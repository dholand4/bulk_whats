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
        mustChangePassword: Boolean(user.mustChangePassword),
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

function update(token, updates) {
    const session = get(token);
    if (!session) {
        return null;
    }

    const nextSession = {
        ...session,
        ...updates,
    };

    sessions.set(token, nextSession);
    return nextSession;
}

function remove(token) {
    sessions.delete(token);
}

module.exports = {
    create,
    get,
    update,
    remove,
};
