const userService = require('../modules/users/userService');

async function listUsers(req, res, next) {
    try {
        const result = await userService.listUsers();
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function saveUser(req, res, next) {
    try {
        const result = await userService.saveUser({
            ...req.body,
            email: req.params.email || req.body?.email,
        }, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function removeUser(req, res, next) {
    try {
        const result = await userService.removeUser(req.params.email);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listUsers,
    saveUser,
    removeUser,
};
