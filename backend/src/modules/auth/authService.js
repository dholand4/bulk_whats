const sessionStore = require('./sessionStore');
const deviceService = require('../devices/deviceService');
const userRepository = require('../users/userRepository');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
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
    const email = normalizeEmail(payload?.email);
    const password = normalizePassword(payload?.password);

    if (!email) {
        return {
            statusCode: 400,
            body: {
                message: 'O campo email e obrigatorio.',
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

    const user = await userRepository.findByEmail(email);

    if (!user || !user.active) {
        return {
            statusCode: 403,
            body: {
                message: `O email ${email} nao foi autorizado.`,
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

    const passwordMatches = await userRepository.verifyPassword(email, password);
    if (!passwordMatches) {
        return {
            statusCode: 403,
            body: {
                message: 'Email ou senha invalidos.',
            },
        };
    }

    await deviceService.ensurePersonalDevice(user.email);
    const session = sessionStore.create(user);

    return {
        statusCode: 200,
        body: {
            token: session.token,
            user: {
                email: user.email,
                role: user.role,
                dataExpiracao: user.dataExpiracao,
            },
        },
    };
}

async function me(session) {
    const user = await userRepository.findByEmail(session.email) || {
        email: session.email,
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

    const passwordMatches = await userRepository.verifyPassword(session.email, currentPassword);
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

    const user = await userRepository.updatePassword(session.email, newPassword);
    sessionStore.update(token, { mustChangePassword: false });

    return {
        statusCode: 200,
        body: {
            message: 'Senha alterada com sucesso.',
            user: {
                email: user.email,
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
