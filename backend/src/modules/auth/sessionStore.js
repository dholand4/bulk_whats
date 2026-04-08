const crypto = require('crypto');

const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function create(user) {
    const token = crypto.randomUUID();
    const session = {
        token,
        matricula: user.matricula,
        role: user.role || 'user',
        dataExpiracao: user.dataExpiracao || '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    sessions.set(token, session);
    return session;
}

function get(token) {
    const session = sessions.get(token);

    if (!session) {
        return null;
    }

    if (Date.now() > new Date(session.expiresAt).getTime()) {
        sessions.delete(token);
        return null;
    }

    return session;
}

function remove(token) {
    sessions.delete(token);
}

module.exports = {
    create,
    get,
    remove,
};
