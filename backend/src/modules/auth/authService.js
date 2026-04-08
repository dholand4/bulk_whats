const sessionStore = require('./sessionStore');
const deviceService = require('../devices/deviceService');
const userRepository = require('../users/userRepository');

function normalizeMatricula(value) {
    return String(value || '').trim();
}

function isExpired(expirationDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > new Date(`${expirationDate}T00:00:00`);
}

async function login(payload) {
    const matricula = normalizeMatricula(payload?.matricula);

    if (!matricula) {
        return {
            statusCode: 400,
            body: {
                message: 'O campo matricula e obrigatorio.',
            },
        };
    }

    const user = await userRepository.findByMatricula(matricula);

    if (!user || !user.active) {
        return {
            statusCode: 403,
            body: {
                message: `A matricula ${matricula} nao foi autorizada.`,
            },
        };
    }

    if (isExpired(user.dataExpiracao)) {
        return {
            statusCode: 403,
            body: {
                message: 'Sua licenca de uso para o sistema expirou.',
            },
        };
    }

    await deviceService.ensurePersonalDevice(user.matricula);
    const session = sessionStore.create(user);

    return {
        statusCode: 200,
        body: {
            token: session.token,
            user: {
                matricula: user.matricula,
                role: user.role,
                dataExpiracao: user.dataExpiracao,
            },
        },
    };
}

async function me(session) {
    const user = await userRepository.findByMatricula(session.matricula) || {
        matricula: session.matricula,
        role: session.role || 'user',
        dataExpiracao: session.dataExpiracao || '',
    };

    return {
        statusCode: 200,
        body: {
            user,
        },
    };
}

async function logout(token) {
    sessionStore.remove(token);
    return {
        statusCode: 200,
        body: {
            message: 'Sessao encerrada com sucesso.',
        },
    };
}

module.exports = {
    login,
    me,
    logout,
};
