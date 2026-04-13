const userRepository = require('./userRepository');

function normalizeEmail(value) {
    const parsed = String(value || '').trim().toLowerCase();
    if (!parsed) {
        return '';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed)) {
        throw new Error('Informe um email valido.');
    }

    return parsed;
}

function normalizeExpirationDate(value) {
    const parsed = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
        throw new Error('Informe uma data de expiracao valida no formato YYYY-MM-DD.');
    }

    return parsed;
}

function normalizeRole(value) {
    return String(value || 'user').trim() === 'admin' ? 'admin' : 'user';
}

function normalizePassword(value) {
    const parsed = String(value || '');

    if (!parsed.trim()) {
        return '';
    }

    if (parsed.trim().length < 4) {
        throw new Error('Informe uma senha com pelo menos 4 caracteres.');
    }

    return parsed;
}

async function listUsers() {
    return {
        statusCode: 200,
        body: {
            users: await userRepository.listUsers(),
        },
    };
}

async function saveUser(payload, auth) {
    const email = normalizeEmail(payload?.email);
    if (!email) {
        throw new Error('Informe o email.');
    }

    const existingUser = await userRepository.findByEmail(email);
    const normalizedPassword = normalizePassword(payload?.password);
    const shouldForcePasswordChange = Boolean(normalizedPassword) && auth?.email !== email;

    if (!existingUser && !normalizedPassword) {
        throw new Error('Informe a senha inicial do usuario.');
    }

    const user = await userRepository.upsertUser({
        email,
        role: normalizeRole(payload?.role),
        dataExpiracao: normalizeExpirationDate(payload?.dataExpiracao),
        password: normalizedPassword,
        forcePasswordChange: shouldForcePasswordChange,
        active: payload?.active !== false,
    });

    return {
        statusCode: 200,
        body: {
            user,
        },
    };
}

async function removeUser(email) {
    await userRepository.deleteUser(normalizeEmail(email));
    return {
        statusCode: 200,
        body: {
            message: 'Usuario removido com sucesso.',
        },
    };
}

module.exports = {
    listUsers,
    saveUser,
    removeUser,
};
