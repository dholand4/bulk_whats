const sessionStore = require('./sessionStore');
const deviceService = require('../devices/deviceService');
const userRepository = require('../users/userRepository');

function normalizeMatricula(value) {
    return String(value || '').trim();
}

function normalizePassword(value) {
    return String(value || '');
}

function isExpired(expirationDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > new Date(`${expirationDate}T00:00:00`);
}

async function login(payload) {
    const matricula = normalizeMatricula(payload?.matricula);
    const password = normalizePassword(payload?.password);

    if (!matricula) {
        return {
            statusCode: 400,
            body: {
                message: 'O campo matricula e obrigatorio.',
            },
        };
    }

    if (!password) {
        return {
            statusCode: 400,
            body: {
                message: 'O campo senha e obrigatorio.',
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

    const passwordMatches = await userRepository.verifyPassword(matricula, password);
    if (!passwordMatches) {
        return {
            statusCode: 403,
            body: {
                message: 'Matricula ou senha invalidas.',
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
        mustChangePassword: Boolean(session.mustChangePassword),
    };

    return {
        statusCode: 200,
        body: {
            user,
        },
    };
}

async function changePassword(session, payload, token) {
    const currentPassword = normalizePassword(payload?.currentPassword);
    const newPassword = normalizePassword(payload?.newPassword);

    if (!currentPassword) {
        return {
            statusCode: 400,
            body: {
                message: 'Informe a senha atual.',
            },
        };
    }

    if (!newPassword || newPassword.trim().length < 4) {
        return {
            statusCode: 400,
            body: {
                message: 'Informe uma nova senha com pelo menos 4 caracteres.',
            },
        };
    }

    const passwordMatches = await userRepository.verifyPassword(session.matricula, currentPassword);
    if (!passwordMatches) {
        return {
            statusCode: 403,
            body: {
                message: 'A senha atual informada esta incorreta.',
            },
        };
    }

    if (currentPassword === newPassword) {
        return {
            statusCode: 400,
            body: {
                message: 'A nova senha precisa ser diferente da senha atual.',
            },
        };
    }

    const user = await userRepository.updatePassword(session.matricula, newPassword);
    sessionStore.update(token, { mustChangePassword: false });

    return {
        statusCode: 200,
        body: {
            message: 'Senha alterada com sucesso.',
            user: {
                matricula: user.matricula,
                role: user.role,
                dataExpiracao: user.dataExpiracao,
                mustChangePassword: user.mustChangePassword,
            },
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
    changePassword,
    logout,
};
