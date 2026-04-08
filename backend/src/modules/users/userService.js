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

    const user = await userRepository.upsertUser({
        matricula,
        role: normalizeRole(payload?.role),
        dataExpiracao: normalizeExpirationDate(payload?.dataExpiracao),
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
