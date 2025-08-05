const { initializeClient, qrCodes, authenticatedUsers } = require('./clientManager');
const axios = require('axios');

// URL do seu Apps Script
const PLANILHA_URL = 'https://script.google.com/macros/s/AKfycbzfxn8ntzKyAKlWNAtvOUBA9tUpeSVlSfQSLP5O9gi3M8cd7mxsDM8CTtUs6eLhD7CkJw/exec';

let matriculasAutorizadasCache = [];
let ultimoCarregamento = 0;
const TEMPO_CACHE_MS = 1000 * 60 * 2; // 2 minutos de cache

async function carregarMatriculasAutorizadas() {
    const agora = Date.now();
    const precisaRecarregar = (agora - ultimoCarregamento) > TEMPO_CACHE_MS;

    if (matriculasAutorizadasCache.length === 0 || precisaRecarregar) {
        try {
            const response = await axios.get(PLANILHA_URL);
            // Normaliza a lista removendo espaços e convertendo para string
            matriculasAutorizadasCache = (response.data.validas || []).map(m => String(m).trim());
            ultimoCarregamento = agora;
            console.log('Matrículas atualizadas da planilha:', matriculasAutorizadasCache);
        } catch (error) {
            console.error('Erro ao carregar planilha:', error.message);
            throw new Error('Não foi possível verificar as matrículas autorizadas');
        }
    }

    return matriculasAutorizadasCache;
}

async function authenticate(req, res) {
    const { matricula } = req.body;

    if (!matricula) {
        return res.status(400).send('Matrícula inválida');
    }

    const matriculaNormalizada = String(matricula).trim();
    console.log('Matrícula recebida:', matriculaNormalizada);

    let matriculasAutorizadas;
    try {
        matriculasAutorizadas = await carregarMatriculasAutorizadas();
    } catch (err) {
        return res.status(500).send('Erro ao verificar matrícula');
    }

    if (!matriculasAutorizadas.includes(matriculaNormalizada)) {
        return res.status(403).send('Matrícula não autorizada');
    }

    initializeClient(matriculaNormalizada);
    res.status(200).send('Cliente inicializado. Aguarde o QR Code.');
}

async function getQrCode(req, res) {
    const { matricula } = req.params;
    const matriculaNormalizada = String(matricula).trim();

    let matriculasAutorizadas;
    try {
        matriculasAutorizadas = await carregarMatriculasAutorizadas();
    } catch (err) {
        return res.status(500).send('Erro ao verificar matrícula');
    }

    if (!matriculasAutorizadas.includes(matriculaNormalizada)) {
        return res.status(403).send('Matrícula não autorizada');
    }

    if (authenticatedUsers.has(matriculaNormalizada)) {
        return res.status(200).json({ message: 'Já autenticado' });
    }

    if (qrCodes.has(matriculaNormalizada)) {
        return res.status(200).json({ qrCode: qrCodes.get(matriculaNormalizada) });
    }

    res.status(404).send('QR Code não disponível');
}

module.exports = { authenticate, getQrCode };
