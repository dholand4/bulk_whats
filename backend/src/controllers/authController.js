const authService = require('../modules/auth/authService');

async function login(req, res, next) {
    try {
        const result = await authService.login(req.body);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function me(req, res, next) {
    try {
        const result = await authService.me(req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function changePassword(req, res, next) {
    try {
        const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
        const result = await authService.changePassword(req.auth, req.body, token);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
        const result = await authService.logout(token);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    me,
    changePassword,
    logout,
};
