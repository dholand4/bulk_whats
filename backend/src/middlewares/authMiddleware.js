const sessionStore = require('../modules/auth/sessionStore');

function extractToken(headerValue) {
    if (!headerValue) {
        return '';
    }

    const [scheme, token] = String(headerValue).split(' ');
    if (scheme !== 'Bearer' || !token) {
        return '';
    }

    return token.trim();
}

function authMiddleware(req, res, next) {
    const token = extractToken(req.headers.authorization);
    const session = sessionStore.get(token);

    if (!session) {
        res.status(401).json({
            message: 'Sessao invalida ou expirada.',
        });
        return;
    }

    req.auth = session;
    next();
}

module.exports = authMiddleware;
