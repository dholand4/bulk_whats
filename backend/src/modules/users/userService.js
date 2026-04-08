const userRepository = require('./userRepository');

function normalizeMatricula(value) {
    return String(value || '').trim();
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

async function saveUser(payload) {
    const matricula = normalizeMatricula(payload?.matricula);
    if (!matricula) {
        throw new Error('Informe a matricula.');
    }

    const existingUser = await userRepository.findByMatricula(matricula);
    const normalizedPassword = normalizePassword(payload?.password);

    if (!existingUser && !normalizedPassword) {
        throw new Error('Informe a senha inicial do usuario.');
    }

    const user = await userRepository.upsertUser({
        matricula,
        role: normalizeRole(payload?.role),
        dataExpiracao: normalizeExpirationDate(payload?.dataExpiracao),
        password: normalizedPassword,
        active: payload?.active !== false,
    });

    return {
        statusCode: 200,
        body: {
            user,
        },
    };
}

async function removeUser(matricula) {
    await userRepository.deleteUser(matricula);
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
