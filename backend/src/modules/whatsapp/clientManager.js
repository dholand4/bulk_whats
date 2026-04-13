const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const { whatsappAuthDirectory } = require('../../config');
const database = require('../storage/database');
const sessionStore = require('./sessionStore');

const runtimeByDeviceId = new Map();
const chromiumLockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];

function getBrowserExecutablePath() {
    const candidates = [
        process.env.CHROME_PATH,
        process.env.PUPPETEER_EXECUTABLE_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ].filter(Boolean);

    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
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
            retries: 0,
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

function getSessionPath(deviceId) {
    return path.join(whatsappAuthDirectory, deviceId);
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

        if (chromiumLockFiles.includes(entry.name)) {
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
            runtime.qrCode = await qrcode.toDataURL(qr);
            runtime.pairingCode = null;
            await updateDevice(device.id, {
                status: 'qr_ready',
                lastKnownStatus: 'QR Code disponivel',
            });
        });
    });

    client.on('code', (code) => {
        runEventSafely(device.id, 'code', async () => {
            runtime.pairingCode = code;
            await updateDevice(device.id, {
                status: 'pairing_code_ready',
                lastKnownStatus: 'Codigo de pareamento disponivel',
            });
        });
    });

    client.on('authenticated', () => {
        runEventSafely(device.id, 'authenticated', async () => {
            runtime.qrCode = null;
            runtime.pairingCode = null;
            runtime.lastError = null;
            runtime.retries = 0;

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
            runtime.qrCode = null;
            runtime.pairingCode = null;
            runtime.lastError = null;
            runtime.retries = 0;
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
            runtime.initializing = false;
            runtime.client = null;
            runtime.retries = 0;
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

async function initializeDevice(device) {
    ensureSessionsDirectory();
    const runtime = getRuntime(device.id);

    if (runtime.client || runtime.initializing) {
        return runtime;
    }

    runtime.initializing = true;
    runtime.qrCode = null;
    runtime.pairingCode = null;
    runtime.lastError = null;

    await updateDevice(device.id, {
        status: 'initializing',
        lastKnownStatus: 'Inicializando cliente',
        connectedNumber: null,
    });

    if (!fs.existsSync(getSessionPath(device.id))) {
        await sessionStore.restoreSessionArchive({
            deviceId: device.id,
            ownerEmail: device.id,
            sessionPath: getSessionPath(device.id),
        });
    }

    await terminateBrowserProcessesForSession(getSessionPath(device.id));
    await removeBrowserLocks(getSessionPath(device.id));

    const executablePath = getBrowserExecutablePath();

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: device.id,
            dataPath: getSessionPath(device.id),
        }),
        puppeteer: {
            headless: true,
            executablePath: executablePath || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        },
    });

    runtime.client = client;
    registerEvents(device, client);

    client.initialize()
        .catch(async (error) => {
            let errorMessage = error.message;
            if (errorMessage.includes('spawn EPERM')) {
                errorMessage = executablePath
                    ? `Falha ao abrir o navegador do WhatsApp usando ${path.basename(executablePath)}. Verifique permissoes do Chrome/Edge.`
                    : 'Falha ao abrir o navegador do WhatsApp. Defina CHROME_PATH ou instale Google Chrome/Microsoft Edge.';
            }

            runtime.lastError = errorMessage;
            runtime.client = null;

            if (error.message.includes('browser is already running')) {
                await terminateBrowserProcessesForSession(getSessionPath(device.id));
                await removeBrowserLocks(getSessionPath(device.id));
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
            runtime.initializing = false;
        });

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
    runtime.initializing = false;
    runtime.retries = 0;

    if (removeSession) {
        await terminateBrowserProcessesForSession(sessionPath);
        await removeSessionDirectory(deviceId);
        await sessionStore.deleteSessionArchive(deviceId, deviceId);
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
