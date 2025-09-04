const { MessageMedia } = require('whatsapp-web.js');
const { WHATSAPP_SUFFIX } = require('../config');
const { clients } = require('./clientManager');
const helpers = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

async function sendMessage(req, res) {
    const { matricula, recipients, messageTemplate, mediaUrl } = req.body;

    if (!clients.has(matricula)) {
        return res.status(400).send('Cliente não autenticado ou não inicializado');
    }

    const client = clients.get(matricula);

    try {
        for (let recipient of recipients) {
            const formattedNumber = helpers.formatPhoneNumber(recipient.number);
            const chatId = `${formattedNumber}${WHATSAPP_SUFFIX}`;

            // --- ALTERAÇÃO PRINCIPAL AQUI ---
            // Encadeie vários .replace() para cada variável
            const personalizedMessage = messageTemplate
                ?.replace('{nome}', recipient.name)
                ?.replace('{paciente}', recipient.paciente)
                ?.replace('{data}', recipient.data)
                ?.replace('{hora}', recipient.hora);
            // Você pode adicionar quantos .replace() quiser!

            try {
                // Enviar imagem (local ou via URL)
                if (mediaUrl) {
                    let media;

                    if (mediaUrl.startsWith('http')) {
                        media = await MessageMedia.fromUrl(mediaUrl);
                    } else {
                        const filePath = path.resolve(__dirname, '../../', mediaUrl);
                        const ext = path.extname(filePath).toLowerCase();
                        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
                        const fileData = fs.readFileSync(filePath, { encoding: 'base64' });
                        media = new MessageMedia(mimeType, fileData, path.basename(filePath));
                    }

                    await client.sendMessage(chatId, media, {
                        caption: personalizedMessage || ''
                    });
                    console.log(`🖼️ Imagem enviada para ${recipient.name} (${formattedNumber})`);
                }

                // Enviar texto, se houver e não estiver com imagem
                if (!mediaUrl && personalizedMessage) {
                    await client.sendMessage(chatId, personalizedMessage);
                    console.log(`📨 Texto enviado para ${recipient.name} (${formattedNumber})`);
                }

            } catch (err) {
                console.error(`❌ Erro ao enviar para ${recipient.name}:`, err.message);
            }

            await new Promise(resolve => setTimeout(resolve, 6000)); // Delay entre envios
        }

        res.status(200).send('Envio concluído');
    } catch (error) {
        console.error('Erro geral no envio:', error);
        res.status(500).send('Erro ao enviar mensagem.');
    }
}

module.exports = { sendMessage };