const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const clients = new Map();
const qrCodes = new Map();
const authenticatedUsers = new Set();

/**
 * @param {string} folderPath - O caminho para a pasta a ser removida.
 */
async function deleteFolderSafely(folderPath) {
    try {
        if (fs.existsSync(folderPath)) {
            await fs.promises.rm(folderPath, { recursive: true, force: true });
            console.log(`🧹 Pasta de autenticação removida com sucesso: ${folderPath}`);
        }
    } catch (error) {
        console.error(`❌ Erro ao excluir a pasta ${folderPath}:`, error.message);
    }
}

/**
 * Lida com a desconexão de um cliente, limpando a sessão e tentando reiniciá-lo.
 * @param {string} matricula - A matrícula do usuário.
 * @param {Client} client - A instância do cliente do whatsapp-web.js.
 * @param {string} dataPath - O caminho para a pasta de sessão do usuário.
 */
async function handleDisconnection(matricula, client, dataPath) {
    console.log(`⚠️ Cliente do WhatsApp desconectado para a matrícula ${matricula}`);
    clients.delete(matricula);
    authenticatedUsers.delete(matricula);

    try {
        await client.destroy();
    } catch (error) {
        console.warn(`⚠️ Erro ao destruir o cliente ${matricula}:`, error.message);
    }

    setTimeout(async () => {
        await deleteFolderSafely(dataPath);
        console.log(`🔄 Tentando reinicializar o cliente para a matrícula ${matricula}...`);
        initializeClient(matricula);
    }, 2000);
}

/**
 * Inicializa um novo cliente do WhatsApp para uma matrícula específica.
 * @param {string} matricula - A matrícula do usuário para associar ao cliente.
 */
function initializeClient(matricula) {
    if (clients.has(matricula)) {
        console.log(`ℹ Cliente para a matrícula ${matricula} já está em processo de inicialização.`);
        return;
    }

    console.log(`🚀 Inicializando cliente para a matrícula: ${matricula}`);
    const dataPath = path.resolve(__dirname, `../whatsapp_auth_data/${matricula}`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: matricula, dataPath }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
    });

    clients.set(matricula, client);

    client.on('qr', (qr) => {
        console.log(`QR Code gerado para a matrícula ${matricula}.`);
        qrcode.toDataURL(qr, (err, url) => {
            if (err) return console.error('Erro ao gerar QR Code:', err);
            qrCodes.set(matricula, url);
        });
    });

    client.on('authenticated', () => {
        authenticatedUsers.add(matricula);
        qrCodes.delete(matricula);
        console.log(`✅ Cliente autenticado para a matrícula ${matricula}.`);
    });

    client.on('ready', () => {
        authenticatedUsers.add(matricula);
        qrCodes.delete(matricula);
        console.log(`✅ Cliente do WhatsApp para a matrícula ${matricula} está pronto!`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`❌ Falha de autenticação para a matrícula ${matricula}: ${msg}`);
        clients.delete(matricula);
        authenticatedUsers.delete(matricula);
    });

    client.on('disconnected', (reason) => {
        console.log(`📴 Cliente desconectado (${reason}) para a matrícula ${matricula}`);
        handleDisconnection(matricula, client, dataPath);
    });

    client.initialize().catch(err => {
        console.error(`❌ Erro crítico ao inicializar o cliente ${matricula}:`, err.message);
    });
}

/**
 * Desconecta um cliente e remove permanentemente sua sessão (logout).
 * @param {string} matricula - A matrícula do usuário a ser desconectado.
 */
async function logoutClient(matricula) {
    const client = clients.get(matricula);
    if (!client) {
        console.warn(`Tentativa de logout para matrícula não conectada: ${matricula}`);
        return;
    }

    console.log(`🚪 Realizando logout para a matrícula: ${matricula}...`);
    try {
        await client.logout();
    } catch (error) {
        console.warn(`⚠️ Erro durante o logout do cliente ${matricula}:`, error.message);
    }

    try {
        await client.destroy();
    } catch (error) {
        console.warn(`⚠️ Erro ao destruir o cliente ${matricula}:`, error.message);
    } finally {
        clients.delete(matricula);
        qrCodes.delete(matricula);
        authenticatedUsers.delete(matricula);

        const dataPath = path.resolve(__dirname, `../whatsapp_auth_data/${matricula}`);
        await deleteFolderSafely(dataPath);
        console.log(`✅ Sessão da matrícula ${matricula} removida permanentemente.`);
    }
}

module.exports = {
    clients,
    qrCodes,
    authenticatedUsers,
    initializeClient,
    logoutClient
};
