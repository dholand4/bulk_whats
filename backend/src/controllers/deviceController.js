const deviceService = require('../modules/devices/deviceService');

async function listDevices(req, res, next) {
    try {
        const result = await deviceService.listDevices(req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function createDevice(req, res, next) {
    try {
        const result = await deviceService.createDevice(req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function connectDevice(req, res, next) {
    try {
        const result = await deviceService.connectDevice(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function reconnectDevice(req, res, next) {
    try {
        const result = await deviceService.reconnectDevice(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function getDeviceAuth(req, res, next) {
    try {
        const result = await deviceService.getDeviceAuth(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function generatePairingCode(req, res, next) {
    try {
        const result = await deviceService.generatePairingCode(req.params.id, req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function removeDevice(req, res, next) {
    try {
        const result = await deviceService.removeDevice(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listDevices,
    createDevice,
    connectDevice,
    reconnectDevice,
    getDeviceAuth,
    generatePairingCode,
    removeDevice,
};
