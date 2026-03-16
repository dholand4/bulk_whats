const { MessageMedia } = require('whatsapp-web.js');
const { WHATSAPP_SUFFIX } = require('../config');
const { clients } = require('./clientManager');
const helpers = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

const stopRequests = new Set();
const activeSends = new Set();

function isStopRequested(matricula) {
    return stopRequests.has(matricula);
}

async function waitWithStopCheck(matricula, totalMs = 6000, intervalMs = 300) {
    let elapsed = 0;
    while (elapsed < totalMs) {
        if (isStopRequested(matricula)) {
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        elapsed += intervalMs;
    }
    return true;
}

async function sendMessage(req, res) {
    const { matricula, recipients, messageTemplate, mediaUrl } = req.body;

    if (!clients.has(matricula)) {
        return res.status(400).send('Cliente não autenticado ou não inicializado');
    }

    if (activeSends.has(matricula)) {
        return res.status(409).send('Ja existe um envio em andamento para esta matricula.');
    }

    stopRequests.delete(matricula);
    activeSends.add(matricula);
    const client = clients.get(matricula);

    try {
        let interrupted = false;

        for (let recipient of recipients) {
            if (isStopRequested(matricula)) {
                interrupted = true;
                break;
            }

            const formattedNumber = helpers.formatPhoneNumber(recipient.number);
            const chatId = `${formattedNumber}${WHATSAPP_SUFFIX}`;

            const personalizedMessage = messageTemplate
                ?.replace('{nome}', recipient.name)
                ?.replace('{paciente}', recipient.paciente)
                ?.replace('{data}', recipient.data)
                ?.replace('{hora}', recipient.hora);
            try {
                const isRegistered = await client.isRegisteredUser(chatId);
                if (!isRegistered) {
                    console.warn(`⚠️ Número não registrado no WhatsApp: ${formattedNumber}`);
                    continue;
                }

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
                        caption: personalizedMessage || '',
                        sendSeen: false
                    });
                    console.log(`🖼️ Imagem enviada para ${recipient.name} (${formattedNumber})`);
                }

                // Enviar texto, se houver e não estiver com imagem
                if (!mediaUrl && personalizedMessage) {
                    await client.sendMessage(chatId, personalizedMessage, { sendSeen: false });
                    console.log(`📨 Texto enviado para ${recipient.name} (${formattedNumber})`);
                }

            } catch (err) {
                console.error(`❌ Erro ao enviar para ${recipient.name}:`, err.message);
            }

            const shouldContinue = await waitWithStopCheck(matricula, 6000, 300); // Delay entre envios com possibilidade de parada
            if (!shouldContinue) {
                interrupted = true;
                break;
            }
        }

        if (interrupted) {
            return res.status(200).send('Envio interrompido pelo usuario.');
        }

        res.status(200).send('Envio concluído');
    } catch (error) {
        console.error('Erro geral no envio:', error);
        res.status(500).send('Erro ao enviar mensagem.');
    } finally {
        activeSends.delete(matricula);
        stopRequests.delete(matricula);
    }
}

function stopMessage(req, res) {
    const { matricula } = req.body;

    if (!matricula) {
        return res.status(400).send('Matricula obrigatoria.');
    }

    if (!activeSends.has(matricula)) {
        return res.status(400).send('Nao ha envio em andamento para interromper.');
    }

    stopRequests.add(matricula);
    return res.status(200).send('Solicitacao de parada recebida. Interrompendo envio...');
}

module.exports = { sendMessage, stopMessage };
