const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const clients = new Map();
const qrCodes = new Map();
const authenticatedUsers = new Set();

// Remove a pasta da sessão com segurança
async function deleteFolderSafely(folderPath) {
    try {
        if (fs.existsSync(folderPath)) {
            await fs.promises.rm(folderPath, { recursive: true, force: true });
            console.log(`🧹 Pasta de autenticação removida: ${folderPath}`);
        }
    } catch (error) {
        console.error(`❌ Erro ao excluir pasta ${folderPath}:`, error.message);
    }
}

// Trata desconexão e reinicia o cliente de forma segura
async function handleDisconnection(matricula, client, dataPath) {
    console.log(`⚠️ Cliente do WhatsApp desconectado para matrícula ${matricula}`);
    clients.delete(matricula);
    authenticatedUsers.delete(matricula);

    try {
        await client.destroy(); // encerra o cliente sem logout
    } catch (error) {
        console.warn(`⚠️ Erro ao destruir cliente ${matricula}:`, error.message);
    }

    // Espera um tempo para garantir liberação dos arquivos de sessão
    setTimeout(async () => {
        try {
            await deleteFolderSafely(dataPath);
            console.log(`✅ Sessão limpa e reinicializada para ${matricula}`);
        } catch (err) {
            console.error(`❌ Falha ao limpar sessão de ${matricula}:`, err.message);
        }

        initializeClient(matricula); // reinicia o cliente
    }, 2000);
}

// Inicializa um cliente WhatsApp por matrícula
function initializeClient(matricula) {
    if (clients.has(matricula)) {
        console.log(`ℹ️ Cliente para matrícula ${matricula} já está em autenticação.`);
        return;
    }

    console.log(`🚀 Inicializando cliente para matrícula: ${matricula}`);
    const dataPath = path.resolve(__dirname, `../whatsapp_auth_data/${matricula}`);
    fs.mkdirSync(dataPath, { recursive: true });

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: matricula, dataPath }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
    });

    clients.set(matricula, client);

    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            if (err) return console.error('Erro ao gerar QR Code:', err);
            qrCodes.set(matricula, url);
        });
    });

    client.on('ready', () => {
        authenticatedUsers.add(matricula);
        qrCodes.delete(matricula);
        console.log(`✅ Cliente do WhatsApp para matrícula ${matricula} está pronto!`);
    });

    client.on('auth_failure', () => {
        console.error(`❌ Falha de autenticação para matrícula ${matricula}`);
        clients.delete(matricula);
        authenticatedUsers.delete(matricula);
    });

    client.on('disconnected', (reason) => {
        console.log(`📴 Cliente desconectado (${reason}) para matrícula ${matricula}`);
        handleDisconnection(matricula, client, dataPath);
    });

    client.initialize().catch(err => {
        console.error(`❌ Erro ao inicializar cliente ${matricula}:`, err.message);
    });
}

module.exports = { clients, qrCodes, authenticatedUsers, initializeClient };
