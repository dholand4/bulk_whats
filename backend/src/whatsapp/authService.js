const { initializeClient, qrCodes, authenticatedUsers } = require('./clientManager');
const axios = require('axios');

const PLANILHA_URL = 'https://script.google.com/macros/s/AKfycbzfxn8ntzKyAKlWNAtvOUBA9tUpeSVlSfQSLP5O9gi3M8cd7mxsDM8CTtUs6eLhD7CkJw/exec';

let usuariosAutorizadosCache = [];
let ultimoCarregamento = 0;
const TEMPO_CACHE_MS = 1000 * 60 * 2;

async function carregarUsuariosAutorizados() {
    const agora = Date.now();
    if (usuariosAutorizadosCache.length === 0 || (agora - ultimoCarregamento) > TEMPO_CACHE_MS) {
        try {
            console.log('Buscando dados atualizados da planilha...');
            const response = await axios.get(PLANILHA_URL);
            usuariosAutorizadosCache = response.data.usuarios || [];
            ultimoCarregamento = agora;
            console.log('Cache de usuários atualizado com sucesso.');
        } catch (error) {
            console.error('Erro CRÍTICO ao carregar dados da planilha:', error.message);
            throw new Error('Não foi possível conectar ao serviço de autorização.');
        }
    }
    return usuariosAutorizadosCache;
}

async function authenticate(req, res) {
    const { matricula } = req.body;
    if (!matricula) {
        return res.status(400).json({ status: 'INVALID_REQUEST', message: 'O campo matrícula é obrigatório.' });
    }
    const matriculaNormalizada = String(matricula).trim();
    try {
        const usuariosAutorizados = await carregarUsuariosAutorizados();
        const usuarioAtual = usuariosAutorizados.find(user => user.matricula === matriculaNormalizada);

        if (!usuarioAtual) {
            console.warn(`[ACESSO NEGADO] Matrícula não autorizada: [${matriculaNormalizada}]`);
            return res.status(403).json({ status: 'UNAUTHORIZED', message: `A matrícula ${matriculaNormalizada} não foi autorizada.` });
        }

        const hoje = new Date();
        const dataExpiracao = new Date(`${usuarioAtual.dataExpiracao}T00:00:00`);
        hoje.setHours(0, 0, 0, 0);

        if (hoje > dataExpiracao) {
            console.warn(`[ACESSO BLOQUEADO] Licença expirada para a matrícula [${matriculaNormalizada}].`);
            return res.status(403).json({ status: 'EXPIRED', message: 'Sua licença de uso para o sistema expirou.' });
        }

        console.log(`[ACESSO AUTORIZADO] Matrícula [${matriculaNormalizada}]. Iniciando cliente...`);
        initializeClient(matriculaNormalizada);
        res.status(200).json({ status: 'AUTHORIZED', message: 'Autenticação válida. Iniciando cliente...' });

    } catch (err) {
        console.error(`[ERRO] Falha na autenticação para [${matriculaNormalizada}]:`, err);
        res.status(500).json({ status: 'ERROR', message: err.message || 'Erro interno ao verificar matrícula.' });
    }
}

async function getQrCode(req, res) {
    const { matricula } = req.params;
    const matriculaNormalizada = String(matricula).trim();

    if (authenticatedUsers.has(matriculaNormalizada)) {
        return res.status(200).json({ status: 'AUTHENTICATED', message: '✅ Conectado com sucesso!' });
    }
    if (qrCodes.has(matriculaNormalizada)) {
        return res.status(200).json({
            status: 'QR_CODE_READY',
            qrCode: qrCodes.get(matriculaNormalizada),
            message: 'Leia o QR Code com o seu celular.'
        });
    }
    res.status(200).json({ status: 'INITIALIZING', message: 'Inicializando Cliente / Gerando QR Code' });
}

module.exports = { authenticate, getQrCode };