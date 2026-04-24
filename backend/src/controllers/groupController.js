const groupService = require('../modules/whatsappGroups/groupService');

async function listGroups(req, res, next) {
    try {
        const result = await groupService.listGroups(req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function createGroup(req, res, next) {
    try {
        const result = await groupService.createGroup(req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listGroups,
    createGroup,
};
