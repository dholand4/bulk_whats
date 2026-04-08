const database = require('../storage/database');
const clientManager = require('../whatsapp/clientManager');

function buildPersonalDevice(matricula) {
    const now = new Date().toISOString();
    return {
        id: matricula,
        name: matricula,
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

async function ensurePersonalDevice(matricula) {
    let device = null;

    await database.update((current) => {
        device = current.devices.find((item) => item.id === matricula);
        if (device) {
            return;
        }

        device = buildPersonalDevice(matricula);
        current.devices = current.devices.filter((item) => item.id !== matricula);
        current.devices.unshift(device);
    });

    return decorateDevice(device);
}

function decorateDevice(device) {
    const runtime = clientManager.getDeviceRuntime(device.id);
    return {
        ...device,
        qrCode: runtime.qrCode,
        pairingCode: runtime.pairingCode,
        runtime,
    };
}

async function listDevices(auth) {
    await ensurePersonalDevice(auth.matricula);
    const current = database.load();
    const ownDevice = current.devices.find((item) => item.id === auth.matricula);
    return {
        statusCode: 200,
        body: {
            devices: ownDevice ? [decorateDevice(ownDevice)] : [],
        },
    };
}

async function createDevice(_payload, auth) {
    return {
        statusCode: 200,
        body: {
            device: await ensurePersonalDevice(auth.matricula),
        },
    };
}

async function connectDevice(deviceId, auth) {
    if (deviceId !== auth.matricula) {
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
    if (deviceId !== auth.matricula) {
        throw new Error('Dispositivo invalido para este usuario.');
    }
    const current = database.load();
    const device = getDeviceOrThrow(current, deviceId);
    await clientManager.destroyClient(deviceId);
    await clientManager.initializeDevice(device);

    return {
        statusCode: 200,
        body: {
            message: 'Reconexao solicitada.',
            device: decorateDevice({ ...device }),
        },
    };
}

async function getDeviceAuth(deviceId, auth) {
    if (deviceId !== auth.matricula) {
        throw new Error('Dispositivo invalido para este usuario.');
    }
    const current = database.load();
    const device = getDeviceOrThrow(current, deviceId);

    const runtime = clientManager.getDeviceRuntime(device.id);
    if (!runtime.hasClient && !runtime.initializing && !['connected', 'authenticated'].includes(device.status)) {
        await clientManager.initializeDevice(device);
    }

    return {
        statusCode: 200,
        body: {
            device: decorateDevice(getDeviceOrThrow(database.load(), deviceId)),
        },
    };
}

async function generatePairingCode(deviceId, payload, auth) {
    if (deviceId !== auth.matricula) {
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
    if (deviceId !== auth.matricula) {
        throw new Error('Dispositivo invalido para este usuario.');
    }
    await clientManager.destroyClient(deviceId, { removeSession: true, logout: true });

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
    getDeviceAuth,
    generatePairingCode,
    removeDevice,
};
