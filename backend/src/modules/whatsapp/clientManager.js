const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const { whatsappAuthDirectory } = require('../../config');
const database = require('../storage/database');
const sessionStore = require('./sessionStore');

const runtimeByDeviceId = new Map();
const chromiumLockFiles = ['singletonlock', 'singletoncookie', 'singletonsocket', 'lockfile', 'devtoolsactiveport'];
const INITIALIZATION_TIMEOUT_MS = 45000;

function getBrowserExecutablePaths() {
    const preferred = [
        process.env.CHROME_PATH,
        process.env.PUPPETEER_EXECUTABLE_PATH,
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ].filter(Boolean);

    return preferred.filter((candidate, index) => fs.existsSync(candidate) && preferred.indexOf(candidate) === index);
}

function buildPuppeteerConfig(executablePath) {
    return {
        headless: true,
        executablePath: executablePath || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-breakpad',
            '--disable-crash-reporter',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-component-update',
            '--disable-extensions',
            '--disable-features=DestroyProfileOnBrowserClose,MediaRouter,OptimizationHints,CertificateTransparencyComponentUpdater,AutofillServerCommunication',
            '--metrics-recording-only',
            '--no-first-run',
            '--no-default-browser-check',
            '--password-store=basic',
            '--use-mock-keychain',
            '--no-service-autorun',
        ],
    };
}

function isBrowserLaunchFailure(errorMessage) {
    const normalized = String(errorMessage || '').toLowerCase();
    return normalized.includes('failed to launch the browser process')
        || normalized.includes('crashpad')
        || normalized.includes('ukm database')
        || normalized.includes('spawn eperm');
}

function ensureSessionsDirectory() {
    if (!fs.existsSync(whatsappAuthDirectory)) {
        fs.mkdirSync(whatsappAuthDirectory, { recursive: true });
    }
}

function getRuntime(deviceId) {
    if (!runtimeByDeviceId.has(deviceId)) {
        runtimeByDeviceId.set(deviceId, {
            client: null,
            qrCode: null,
            pairingCode: null,
            lastError: null,
            initializing: false,
            initializationTimeout: null,
            initializationPromise: null,
            retries: 0,
            freshAuthAttempts: 0,
            persistingSession: false,
            pendingSessionPersist: false,
        });
    }

    return runtimeByDeviceId.get(deviceId);
}

async function updateDevice(deviceId, changes) {
    let updatedDevice = null;

    await database.update((current) => {
        const device = current.devices.find((item) => item.id === deviceId);
        if (!device) {
            return;
        }

        Object.assign(device, changes, {
            updatedAt: new Date().toISOString(),
        });
        updatedDevice = { ...device };
    });

    return updatedDevice;
}

function clearInitializationTimeout(runtime) {
    if (runtime.initializationTimeout) {
        clearTimeout(runtime.initializationTimeout);
        runtime.initializationTimeout = null;
    }
}

function finishInitialization(runtime) {
    runtime.initializing = false;
    runtime.initializationPromise = null;
    clearInitializationTimeout(runtime);
}

async function cleanupSessionArtifacts(deviceId) {
    await terminateBrowserProcessesForSession(getAuthSessionPath(deviceId));
    await terminateBrowserProcessesForSession(getSessionPath(deviceId));
    await terminateBrowserProcessesForSession(getLegacySessionPath(deviceId));
    await terminateBrowserProcessesForSession(getLegacyHashedSessionPath(deviceId));
    await removeSessionDirectory(deviceId);
    await sessionStore.deleteSessionArchive(deviceId, deviceId);
}

async function retryWithFreshSession(device, reason) {
    const runtime = getRuntime(device.id);
    if (runtime.freshAuthAttempts >= 1) {
        return false;
    }

    runtime.freshAuthAttempts += 1;
    runtime.client = null;
    runtime.qrCode = null;
    runtime.pairingCode = null;
    runtime.lastError = null;
    finishInitialization(runtime);

    await updateDevice(device.id, {
        status: 'initializing',
        lastKnownStatus: `Recriando sessao do WhatsApp (${reason})`,
        connectedNumber: null,
    });

    await cleanupSessionArtifacts(device.id);

    setTimeout(() => {
        initializeDevice(device, { skipSessionRestore: true }).catch((error) => {
            console.error('Falha ao reinicializar dispositivo com sessao limpa:', error.message);
        });
    }, 1200);

    return true;
}

function scheduleInitializationTimeout(device) {
    const runtime = getRuntime(device.id);
    clearInitializationTimeout(runtime);

    runtime.initializationTimeout = setTimeout(async () => {
        if (!runtime.initializing || runtime.qrCode || runtime.pairingCode) {
            return;
        }

        try {
            const recovered = await retryWithFreshSession(device, 'timeout na inicializacao');
            if (recovered) {
                return;
            }
        } catch (error) {
            console.error('Falha ao recriar sessao apos timeout:', error.message);
        }

        runtime.initializing = false;
        runtime.lastError = 'Tempo limite ao iniciar a autenticacao do WhatsApp. Tente conectar novamente.';
        runtime.client = null;

        updateDevice(device.id, {
            status: 'error',
            lastKnownStatus: 'Tempo limite ao iniciar a autenticacao do WhatsApp',
            connectedNumber: null,
        }).catch((error) => {
            console.error('Falha ao atualizar timeout de inicializacao:', error.message);
        });
    }, INITIALIZATION_TIMEOUT_MS);
}

function getSessionPath(deviceId) {
    return path.join(whatsappAuthDirectory, getAuthClientId(deviceId));
}

function getAuthClientId(deviceId) {
    return `d-${crypto.createHash('sha1').update(String(deviceId)).digest('hex').slice(0, 12)}`;
}

function getAuthSessionPath(deviceId) {
    return path.join(getSessionPath(deviceId), `session-${getAuthClientId(deviceId)}`);
}

function getLegacySessionPath(deviceId) {
    return path.join(whatsappAuthDirectory, deviceId);
}

function getLegacyHashedSessionPath(deviceId) {
    return path.join(whatsappAuthDirectory, `device-${Buffer.from(String(deviceId)).toString('hex')}`);
}

async function migrateLegacySessionDirectory(deviceId) {
    const legacySessionPath = getLegacySessionPath(deviceId);
    const legacyHashedSessionPath = getLegacyHashedSessionPath(deviceId);
    const sessionPath = getSessionPath(deviceId);

    if (fs.existsSync(sessionPath)) {
        return;
    }

    const sourcePath = fs.existsSync(legacyHashedSessionPath)
        ? legacyHashedSessionPath
        : legacySessionPath;

    if (!fs.existsSync(sourcePath)) {
        return;
    }

    await fs.promises.mkdir(path.dirname(sessionPath), { recursive: true });
    await fs.promises.rename(sourcePath, sessionPath);
}

function runPowerShell(command) {
    return new Promise((resolve, reject) => {
        execFile(
            'powershell.exe',
            ['-NoProfile', '-NonInteractive', '-Command', command],
            { windowsHide: true },
            (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            },
        );
    });
}

async function terminateBrowserProcessesForSession(sessionPath) {
    if (process.platform !== 'win32') {
        return;
    }

    const normalizedPath = sessionPath.replace(/\\/g, '\\\\').replace(/'/g, "''");
    const script = [
        '$target = \'' + normalizedPath + '\'',
        '$names = @("chrome.exe", "chromium.exe", "msedge.exe")',
        '$processes = Get-CimInstance Win32_Process | Where-Object {',
        '  $names -contains $_.Name -and $_.CommandLine -and $_.CommandLine -like ("*" + $target + "*")',
        '}',
        'foreach ($process in $processes) {',
        '  try { Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop } catch {}',
        '}',
    ].join(' ');

    try {
        await runPowerShell(script);
    } catch (_error) {
        // In restricted environments, process inspection may be blocked.
    }
}

async function removeBrowserLocks(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
        return;
    }

    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

    await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(directoryPath, entry.name);

        if (entry.isDirectory()) {
            await removeBrowserLocks(entryPath);
            return;
        }

        if (chromiumLockFiles.includes(entry.name.toLowerCase())) {
            await fs.promises.rm(entryPath, { force: true });
        }
    }));
}

async function removeSessionDirectory(deviceId) {
    const sessionPath = getSessionPath(deviceId);
    if (fs.existsSync(sessionPath)) {
        let lastError = null;

        for (let attempt = 1; attempt <= 5; attempt += 1) {
            try {
                await terminateBrowserProcessesForSession(sessionPath);
                await removeBrowserLocks(sessionPath);
                await fs.promises.rm(sessionPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
                return;
            } catch (error) {
                lastError = error;
                await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
            }
        }

        throw lastError;
    }

    const legacySessionPath = getLegacySessionPath(deviceId);
    if (legacySessionPath !== sessionPath && fs.existsSync(legacySessionPath)) {
        let lastError = null;

        for (let attempt = 1; attempt <= 5; attempt += 1) {
            try {
                await terminateBrowserProcessesForSession(legacySessionPath);
                await removeBrowserLocks(legacySessionPath);
                await fs.promises.rm(legacySessionPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
                return;
            } catch (error) {
                lastError = error;
                await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
            }
        }

        throw lastError;
    }

    const legacyHashedSessionPath = getLegacyHashedSessionPath(deviceId);
    if (legacyHashedSessionPath !== sessionPath && fs.existsSync(legacyHashedSessionPath)) {
        let lastError = null;

        for (let attempt = 1; attempt <= 5; attempt += 1) {
            try {
                await terminateBrowserProcessesForSession(legacyHashedSessionPath);
                await removeBrowserLocks(legacyHashedSessionPath);
                await fs.promises.rm(legacyHashedSessionPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
                return;
            } catch (error) {
                lastError = error;
                await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
            }
        }

        throw lastError;
    }
}

async function persistSessionSnapshot(device) {
    const runtime = getRuntime(device.id);
    const sessionPath = getSessionPath(device.id);

    if (runtime.persistingSession) {
        runtime.pendingSessionPersist = true;
        return;
    }

    if (!fs.existsSync(sessionPath)) {
        return;
    }

    runtime.persistingSession = true;

    try {
        await sessionStore.saveSessionArchive({
            deviceId: device.id,
            ownerEmail: device.id,
            sessionPath,
        });
    } catch (error) {
        runtime.lastError = error.message;
    } finally {
        runtime.persistingSession = false;

        if (runtime.pendingSessionPersist) {
            runtime.pendingSessionPersist = false;
            setTimeout(() => {
                persistSessionSnapshot(device).catch((persistError) => {
                    console.error('Falha ao persistir sessao no banco:', persistError.message);
                });
            }, 250);
        }
    }
}

function runEventSafely(deviceId, label, handler) {
    Promise.resolve()
        .then(handler)
        .catch((error) => {
            const runtime = getRuntime(deviceId);
            runtime.lastError = error.message;
            console.error(`Erro no evento ${label} do dispositivo ${deviceId}:`, error);
        });
}

function registerEvents(device, client) {
    const runtime = getRuntime(device.id);

    client.on('qr', (qr) => {
        runEventSafely(device.id, 'qr', async () => {
            finishInitialization(runtime);
            runtime.qrCode = await qrcode.toDataURL(qr);
            runtime.pairingCode = null;
            runtime.freshAuthAttempts = 0;
            await updateDevice(device.id, {
                status: 'qr_ready',
                lastKnownStatus: 'QR Code disponivel',
            });
        });
    });

    client.on('code', (code) => {
        runEventSafely(device.id, 'code', async () => {
            finishInitialization(runtime);
            runtime.pairingCode = code;
            runtime.freshAuthAttempts = 0;
            await updateDevice(device.id, {
                status: 'pairing_code_ready',
                lastKnownStatus: 'Codigo de pareamento disponivel',
            });
        });
    });

    client.on('authenticated', () => {
        runEventSafely(device.id, 'authenticated', async () => {
            finishInitialization(runtime);
            runtime.qrCode = null;
            runtime.pairingCode = null;
            runtime.lastError = null;
            runtime.retries = 0;
            runtime.freshAuthAttempts = 0;

            await updateDevice(device.id, {
                status: 'authenticated',
                lastKnownStatus: 'Sessao autenticada. Validando conexao...',
                connectedNumber: client.info?.wid?.user || null,
            });
            await persistSessionSnapshot(device);
        });
    });

    client.on('ready', () => {
        runEventSafely(device.id, 'ready', async () => {
            finishInitialization(runtime);
            runtime.qrCode = null;
            runtime.pairingCode = null;
            runtime.lastError = null;
            runtime.retries = 0;
            runtime.freshAuthAttempts = 0;
            await updateDevice(device.id, {
                status: 'connected',
                lastKnownStatus: 'Conectado',
                connectedNumber: client.info?.wid?.user || null,
            });
            await persistSessionSnapshot(device);
        });
    });

    client.on('auth_failure', (message) => {
        runEventSafely(device.id, 'auth_failure', async () => {
            finishInitialization(runtime);
            runtime.lastError = message;
            runtime.client = null;
            await updateDevice(device.id, {
                status: 'auth_failure',
                lastKnownStatus: `Falha de autenticacao: ${message}`,
                connectedNumber: null,
            });
        });
    });

    client.on('disconnected', (reason) => {
        runEventSafely(device.id, 'disconnected', async () => {
            runtime.qrCode = null;
            runtime.pairingCode = null;
            finishInitialization(runtime);
            runtime.client = null;
            runtime.retries = 0;
            runtime.freshAuthAttempts = 0;
            await updateDevice(device.id, {
                status: 'disconnected',
                lastKnownStatus: `Desconectado: ${reason}`,
                connectedNumber: null,
            });
        });
    });

    client.on('change_state', (state) => {
        runEventSafely(device.id, 'change_state', async () => {
            await updateDevice(device.id, {
                lastKnownStatus: `Estado do WhatsApp: ${state}`,
            });
        });
    });

    client.on('remote_session_saved', () => {
        runEventSafely(device.id, 'remote_session_saved', async () => {
            await persistSessionSnapshot(device);
        });
    });
}

async function initializeDevice(device, { skipSessionRestore = false } = {}) {
    ensureSessionsDirectory();
    await migrateLegacySessionDirectory(device.id);
    const runtime = getRuntime(device.id);

    if (runtime.client || runtime.initializing) {
        return runtime;
    }

    if (runtime.initializationPromise) {
        await runtime.initializationPromise;
        return runtime;
    }

    runtime.initializing = true;
    runtime.qrCode = null;
    runtime.pairingCode = null;
    runtime.lastError = null;
    scheduleInitializationTimeout(device);

    await updateDevice(device.id, {
        status: 'initializing',
        lastKnownStatus: 'Inicializando cliente',
        connectedNumber: null,
    });

    if (!skipSessionRestore && !fs.existsSync(getSessionPath(device.id))) {
        await sessionStore.restoreSessionArchive({
            deviceId: device.id,
            ownerEmail: device.id,
            sessionPath: getSessionPath(device.id),
        });
    }

    await terminateBrowserProcessesForSession(getAuthSessionPath(device.id));
    await terminateBrowserProcessesForSession(getSessionPath(device.id));
    await removeBrowserLocks(getSessionPath(device.id));

    const executablePaths = getBrowserExecutablePaths();

    async function launchWithExecutable(executablePath, browserIndex = 0) {
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: getAuthClientId(device.id),
                dataPath: getSessionPath(device.id),
            }),
            puppeteer: buildPuppeteerConfig(executablePath),
        });

        runtime.client = client;
        registerEvents(device, client);

        await client.initialize()
            .catch(async (error) => {
            let errorMessage = error.message;
            if (errorMessage.includes('spawn EPERM')) {
                errorMessage = executablePath
                    ? `Falha ao abrir o navegador do WhatsApp usando ${path.basename(executablePath)}. Verifique permissoes do Chrome/Edge.`
                    : 'Falha ao abrir o navegador do WhatsApp. Defina CHROME_PATH ou instale Google Chrome/Microsoft Edge.';
            }

            runtime.lastError = errorMessage;
            runtime.client = null;
            clearInitializationTimeout(runtime);

            if (error.message.includes('browser is already running')) {
                try {
                    const recovered = await retryWithFreshSession(device, 'sessao em uso');
                    if (recovered) {
                        return;
                    }
                } catch (recoveryError) {
                    console.error('Falha ao recriar sessao apos conflito de navegador:', recoveryError.message);
                }
            }

            if (isBrowserLaunchFailure(error.message) && browserIndex < executablePaths.length - 1) {
                await cleanupSessionArtifacts(device.id);
                await updateDevice(device.id, {
                    status: 'initializing',
                    lastKnownStatus: `Tentando outro navegador (${browserIndex + 2}/${executablePaths.length})`,
                });

                setTimeout(() => {
                    launchWithExecutable(executablePaths[browserIndex + 1], browserIndex + 1).catch((retryError) => {
                        console.error('Falha ao alternar navegador para o dispositivo:', retryError.message);
                    });
                }, 1000);

                return;
            }

            if (error.message.includes('Execution context was destroyed') && runtime.retries < 2) {
                runtime.retries += 1;
                await updateDevice(device.id, {
                    status: 'initializing',
                    lastKnownStatus: `Recuperando inicializacao (${runtime.retries}/2)`,
                });

                setTimeout(() => {
                    initializeDevice(device).catch((retryError) => {
                        console.error('Falha ao reinicializar dispositivo:', retryError.message);
                    });
                }, 1500);

                return;
            }

            runtime.retries = 0;

            await updateDevice(device.id, {
                status: 'error',
                lastKnownStatus: `Erro ao inicializar: ${errorMessage}`,
            });
        })
            .finally(() => {
                clearInitializationTimeout(runtime);
                if (!runtime.qrCode && !runtime.pairingCode && !runtime.client) {
                    runtime.initializing = false;
                    runtime.initializationPromise = null;
                }
            });
    }

    runtime.initializationPromise = launchWithExecutable(executablePaths[0] || null, 0)
        .catch((error) => {
            runtime.initializing = false;
            runtime.initializationPromise = null;
            throw error;
        });

    await runtime.initializationPromise;
    return runtime;
}

async function bootstrapPersistedDevices() {
    const current = database.load();
    current.meta.lastBootAt = new Date().toISOString();
    await database.persist(current);

    await Promise.all(
        current.devices.map(async (device) => {
            if (fs.existsSync(getSessionPath(device.id))) {
                await persistSessionSnapshot(device);
            }
        }),
    );

    await Promise.all(
        current.devices.map(async (device) => {
            const hasLocalSession = fs.existsSync(getSessionPath(device.id));
            const hasStoredSession = await sessionStore.hasSessionArchive(device.id, device.id);
            if (hasLocalSession || hasStoredSession) {
                await initializeDevice(device);
            }
        }),
    );
}

async function destroyClient(deviceId, { removeSession = false, logout = false } = {}) {
    const runtime = getRuntime(deviceId);
    const client = runtime.client;
    const sessionPath = getSessionPath(deviceId);

    if (client) {
        try {
            if (logout) {
                await client.logout();
            }
        } catch (error) {
            runtime.lastError = error.message;
        }

        try {
            await client.destroy();
        } catch (error) {
            runtime.lastError = error.message;
        }
    }

    runtime.client = null;
    runtime.qrCode = null;
    runtime.pairingCode = null;
    finishInitialization(runtime);
    runtime.retries = 0;
    runtime.freshAuthAttempts = 0;

    if (removeSession) {
        await cleanupSessionArtifacts(deviceId);
    }
}

async function requestPairingCode(device, phoneNumber) {
    const runtime = await initializeDevice(device);
    if (!runtime.client) {
        throw new Error('Cliente nao disponivel para pareamento.');
    }

    const sanitizedNumber = String(phoneNumber || '').replace(/\D/g, '');
    if (!sanitizedNumber) {
        throw new Error('Informe o numero do telefone para gerar o codigo.');
    }

    const code = await runtime.client.requestPairingCode(sanitizedNumber, true, 180000);
    runtime.pairingCode = code;

    await updateDevice(device.id, {
        status: 'pairing_code_ready',
        lastKnownStatus: 'Codigo de pareamento gerado',
    });

    return code;
}

function getDeviceRuntime(deviceId) {
    const runtime = getRuntime(deviceId);
    return {
        qrCode: runtime.qrCode,
        pairingCode: runtime.pairingCode,
        lastError: runtime.lastError,
        hasClient: Boolean(runtime.client),
        initializing: runtime.initializing,
    };
}

function getClient(deviceId) {
    return getRuntime(deviceId).client;
}

module.exports = {
    bootstrapPersistedDevices,
    initializeDevice,
    destroyClient,
    requestPairingCode,
    getDeviceRuntime,
    getClient,
};
