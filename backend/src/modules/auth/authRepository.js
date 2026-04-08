const fs = require('fs');

const { authorizedUsersFile, authorizedUsersUrl, cache } = require('../../config');

let authorizedUsersCache = [];
let lastLoadAt = 0;

function normalizeAuthorizedUsers(payload) {
    const users = Array.isArray(payload?.usuarios) ? payload.usuarios : [];

    return users
        .map((user) => ({
            matricula: String(user?.matricula || '').trim(),
            dataExpiracao: String(user?.dataExpiracao || '').trim(),
        }))
        .filter((user) => user.matricula && user.dataExpiracao);
}

async function getAuthorizedUsersFromRemote() {
    const response = await fetch(authorizedUsersUrl);

    if (!response.ok) {
        throw new Error(`Falha ao consultar planilha remota: HTTP ${response.status}`);
    }

    const payload = await response.json();
    return normalizeAuthorizedUsers(payload);
}

async function getAuthorizedUsersFromLocalFile() {
    const fileContent = await fs.promises.readFile(authorizedUsersFile, 'utf8');
    const parsed = JSON.parse(fileContent);
    return normalizeAuthorizedUsers(parsed);
}

async function getAuthorizedUsers() {
    const now = Date.now();
    const shouldReload =
        authorizedUsersCache.length === 0 ||
        now - lastLoadAt > cache.authorizedUsersTtlMs;

    if (!shouldReload) {
        return authorizedUsersCache;
    }

    try {
        authorizedUsersCache = await getAuthorizedUsersFromRemote();
        lastLoadAt = now;
        console.log('Cache de usuarios autorizados atualizado pela planilha remota.');
        return authorizedUsersCache;
    } catch (error) {
        console.error('Erro ao carregar usuarios da planilha remota:', error.message);

        try {
            authorizedUsersCache = await getAuthorizedUsersFromLocalFile();
            lastLoadAt = now;
            console.warn('Usando arquivo local de usuarios autorizados como contingencia.');
            return authorizedUsersCache;
        } catch (localError) {
            console.error('Erro critico ao carregar usuarios locais:', localError.message);
            throw new Error('Nao foi possivel carregar a lista de usuarios autorizados.');
        }
    }
}

module.exports = {
    getAuthorizedUsers,
};
