const queueService = require('../modules/queue/queueService');

async function enqueue(req, res, next) {
    try {
        const result = await queueService.enqueue(req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function sendNow(req, res, next) {
    try {
        const result = await queueService.sendNow(req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function listQueue(req, res, next) {
    try {
        const result = await queueService.listQueue(req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function listHistory(req, res, next) {
    try {
        const result = await queueService.listHistory(req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function cancelItem(req, res, next) {
    try {
        const result = await queueService.cancelItem(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function reprocessItem(req, res, next) {
    try {
        const result = await queueService.reprocessItem(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function deleteQueueItem(req, res, next) {
    try {
        const result = await queueService.deleteQueueItem(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function summary(req, res, next) {
    try {
        const result = await queueService.getSummary(req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    enqueue,
    sendNow,
    listQueue,
    listHistory,
    cancelItem,
    reprocessItem,
    deleteQueueItem,
    summary,
};
