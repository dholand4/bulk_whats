const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');
const { PORT } = require('./src/config');

const authService = require('./src/whatsapp/authService');
const messageService = require('./src/whatsapp/messageService');
const uploadService = require('./src/whatsapp/uploadService');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir imagens locais
app.use('/upload', uploadService); // Rota de upload

const frontendDir = path.join(__dirname, '..', 'frontend');
app.use('/', express.static(frontendDir));

app.post('/authenticate', authService.authenticate);
app.get('/get-qr/:matricula', authService.getQrCode);
app.post('/send-message', messageService.sendMessage);

function openBrowser(url) {
    const platform = process.platform;

    if (platform === 'win32') {
        exec(`start "" "${url}"`);
        return;
    }

    if (platform === 'darwin') {
        exec(`open "${url}"`);
        return;
    }

    exec(`xdg-open "${url}"`);
}

app.listen(PORT, '0.0.0.0', () => {
    const url = `http://localhost:${PORT}`;
    console.log(`🚀 Servidor rodando na porta ${PORT}`);

    if (!process.env.RENDER) {
        openBrowser(url);
    }
});
