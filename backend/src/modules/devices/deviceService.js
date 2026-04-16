const database = require('../storage/database');
const clientManager = require('../whatsapp/clientManager');

function buildPersonalDevice(email) {
    const now = new Date().toISOString();
    return {
        id: email,
        name: email,
        description: '',
        createdAt: now,
        updatedAt: now,
        status: 'created',
        lastKnownStatus: 'Aguardando conexao',
        connectedNumber: null,
    };
}

function getDeviceOrThrow(databaseState, deviceId) {
    const device = databaseState.devices.find((item) => item.id === deviceId);
    if (!device) {
        throw new Error('Dispositivo nao encontrado.');
    }
    return device;
}

async function ensurePersonalDevice(email) {
    let device = null;

    await database.update((current) => {
        device = current.devices.find((item) => item.id === email);
        if (device) {
            return;
        }

        device = buildPersonalDevice(email);
        current.devices = current.devices.filter((item) => item.id !== email);
        current.devices.unshift(device);
    });

    return decorateDevice(device);
}

function decorateDevice(device) {
    const runtime = clientManager.getDeviceRuntime(device.id);
    const isStaleConnectedState = ['connected', 'authenticated'].includes(device.status)
        && !runtime.hasClient
        && !runtime.initializing;

    return {
        ...device,
        status: isStaleConnectedState ? 'resetting_session' : device.status,
        lastKnownStatus: isStaleConnectedState
            ? 'Conexao perdida. Aguarde enquanto geramos um novo QR Code.'
            : device.lastKnownStatus,
        connectedNumber: isStaleConnectedState ? null : device.connectedNumber,
        qrCode: runtime.qrCode,
        pairingCode: runtime.pairingCode,
        runtime,
    };
}

async function recoverMissingRuntimeIfNeeded(device, { skipSessionRestore = false } = {}) {
    const runtime = clientManager.getDeviceRuntime(device.id);
    if (runtime.hasClient || runtime.initializing) {
        return;
    }

    if (['connected', 'authenticated'].includes(device.status)) {
        await database.update((current) => {
            const currentDevice = current.devices.find((item) => item.id === device.id);
            if (!currentDevice) {
                return;
            }

            currentDevice.status = 'resetting_session';
            currentDevice.lastKnownStatus = 'Conexao perdida. Aguarde enquanto geramos um novo QR Code.';
            currentDevice.connectedNumber = null;
            currentDevice.updatedAt = new Date().toISOString();
        });
    }

    setTimeout(() => {
        clientManager.initializeDevice(device, { skipSessionRestore }).catch((error) => {
            console.error('Falha ao recuperar dispositivo sem cliente ativo:', error.message);
        });
    }, 50);
}

async function listDevices(auth) {
    await ensurePersonalDevice(auth.email);
    const current = database.load();
    const ownDevice = current.devices.find((item) => item.id === auth.email);
    if (ownDevice) {
        await recoverMissingRuntimeIfNeeded(ownDevice);
    }
    return {
        statusCode: 200,
        body: {
            devices: ownDevice ? [decorateDevice(getDeviceOrThrow(database.load(), auth.email))] : [],
        },
    };
}

async function createDevice(_payload, auth) {
    return {
        statusCode: 200,
        body: {
            device: await ensurePersonalDevice(auth.email),
        },
    };
}

async function connectDevice(deviceId, auth) {
    if (deviceId !== auth.email) {
        throw new Error('Dispositivo invalido para este usuario.');
    }
    const current = database.load();
    const device = getDeviceOrThrow(current, deviceId);
    await clientManager.initializeDevice(device);

    return {
        statusCode: 200,
        body: {
            message: 'Inicializacao do dispositivo solicitada.',
            device: decorateDevice({ ...device }),
        },
    };
}

async function reconnectDevice(deviceId, auth) {
    if (deviceId !== auth.email) {
        throw new Error('Dispositivo invalido para este usuario.');
    }
    const current = database.load();
    const device = getDeviceOrThrow(current, deviceId);
    await clientManager.destroyClient(deviceId, { suppressAutoReset: true });
    await clientManager.initializeDevice(device);

    return {
        statusCode: 200,
        body: {
            message: 'Reconexao solicitada.',
            device: decorateDevice({ ...device }),
        },
    };
}

async function disconnectDevice(deviceId, auth) {
    if (deviceId !== auth.email) {
        throw new Error('Dispositivo invalido para este usuario.');
    }

    await clientManager.destroyClient(deviceId, { removeSession: true, logout: true, suppressAutoReset: true });
    await database.update((current) => {
        const device = current.devices.find((item) => item.id === deviceId);
        if (!device) {
            return;
        }

        device.status = 'resetting_session';
        device.lastKnownStatus = 'Aguarde, apagando ultimos registros para gerar um novo QR Code.';
        device.connectedNumber = null;
        device.updatedAt = new Date().toISOString();
    });

    const refreshedDevice = getDeviceOrThrow(database.load(), deviceId);
    setTimeout(() => {
        clientManager.initializeDevice(refreshedDevice, { skipSessionRestore: true }).catch((error) => {
            console.error('Falha ao reinicializar dispositivo apos desconexao manual:', error.message);
        });
    }, 50);

    return {
        statusCode: 200,
        body: {
            message: 'Dispositivo desconectado. Aguarde enquanto apagamos os ultimos registros para gerar um novo QR Code.',
            device: decorateDevice(getDeviceOrThrow(database.load(), deviceId)),
        },
    };
}

async function getDeviceAuth(deviceId, auth) {
    if (deviceId !== auth.email) {
        throw new Error('Dispositivo invalido para este usuario.');
    }
    const current = database.load();
    const device = getDeviceOrThrow(current, deviceId);
    await recoverMissingRuntimeIfNeeded(device);

    return {
        statusCode: 200,
        body: {
            device: decorateDevice(getDeviceOrThrow(database.load(), deviceId)),
        },
    };
}

async function generatePairingCode(deviceId, payload, auth) {
    if (deviceId !== auth.email) {
        throw new Error('Dispositivo invalido para este usuario.');
    }
    const current = database.load();
    const device = getDeviceOrThrow(current, deviceId);
    const pairingCode = await clientManager.requestPairingCode(device, payload?.phoneNumber);

    return {
        statusCode: 200,
        body: {
            pairingCode,
            device: decorateDevice(device),
        },
    };
}

async function removeDevice(deviceId, auth) {
    if (deviceId !== auth.email) {
        throw new Error('Dispositivo invalido para este usuario.');
    }
    await clientManager.destroyClient(deviceId, { removeSession: true, logout: true, suppressAutoReset: true });

    await database.update((current) => {
        current.devices = current.devices.filter((item) => item.id !== deviceId);
        current.queue = current.queue.map((item) => {
            if (item.deviceId !== deviceId || item.status !== 'pending') {
                return item;
            }

            return {
                ...item,
                status: 'cancelled',
                errorMessage: 'Cancelado automaticamente porque o dispositivo foi removido.',
                updatedAt: new Date().toISOString(),
            };
        });
    });

    return {
        statusCode: 200,
        body: {
            message: 'Dispositivo removido com sucesso.',
        },
    };
}

module.exports = {
    ensurePersonalDevice,
    listDevices,
    createDevice,
    connectDevice,
    reconnectDevice,
    disconnectDevice,
    getDeviceAuth,
    generatePairingCode,
    removeDevice,
};
