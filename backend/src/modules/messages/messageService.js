const { MessageMedia } = require('whatsapp-web.js');

const { whatsapp } = require('../../config');
const whatsappClientManager = require('../whatsapp/clientManager');
const { loadAttachmentContent } = require('../storage/fileReferenceService');
const { formatPhoneNumber } = require('../../shared/utils/phoneUtils');

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

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        elapsed += intervalMs;
    }

    return true;
}

function buildPersonalizedMessage(messageTemplate, recipient) {
    return messageTemplate
        ?.replace('{nome}', recipient.name)
        ?.replace('{paciente}', recipient.paciente)
        ?.replace('{profissional}', recipient.profissional)
        ?.replace('{data}', recipient.data)
        ?.replace('{hora}', recipient.hora);
}

async function createMedia(mediaItem, ownerMatricula) {
    const resolved = await loadAttachmentContent({
        path: mediaItem.mediaUrl,
        mimeType: mediaItem.mediaMimeType,
        fileName: mediaItem.mediaFileName,
    }, ownerMatricula);

    if (resolved.kind === 'url') {
        return MessageMedia.fromUrl(resolved.url);
    }

    return new MessageMedia(
        resolved.mimeType || 'application/octet-stream',
        resolved.buffer.toString('base64'),
        resolved.fileName || 'arquivo',
    );
}

function normalizeMediaItems(payload) {
    if (Array.isArray(payload.mediaItems) && payload.mediaItems.length > 0) {
        return payload.mediaItems.filter((item) => item?.mediaUrl);
    }

    if (payload.mediaUrl) {
        return [{
            mediaUrl: payload.mediaUrl,
            mediaMimeType: payload.mediaMimeType,
            mediaFileName: payload.mediaFileName,
        }];
    }

    return [];
}

async function sendMessage(payload) {
    const { matricula, recipients = [], messageTemplate } = payload;
    const mediaItems = normalizeMediaItems(payload);

    if (!whatsappClientManager.clients.has(matricula)) {
        return { statusCode: 400, body: 'Cliente não autenticado ou não inicializado' };
    }

    if (activeSends.has(matricula)) {
        return { statusCode: 409, body: 'Ja existe um envio em andamento para esta matricula.' };
    }

    stopRequests.delete(matricula);
    activeSends.add(matricula);
    const client = whatsappClientManager.clients.get(matricula);

    try {
        let interrupted = false;

        for (const recipient of recipients) {
            if (isStopRequested(matricula)) {
                interrupted = true;
                break;
            }

            const formattedNumber = formatPhoneNumber(recipient.number);
            const chatId = `${formattedNumber}${whatsapp.suffix}`;
            const personalizedMessage = buildPersonalizedMessage(messageTemplate, recipient);

            try {
                const isRegistered = await client.isRegisteredUser(chatId);

                if (!isRegistered) {
                    console.warn(`Número não registrado no WhatsApp: ${formattedNumber}`);
                    continue;
                }

                if (mediaItems.length > 0) {
                    for (let index = 0; index < mediaItems.length; index += 1) {
                        const mediaItem = mediaItems[index];
                        const media = await createMedia(mediaItem, matricula);

                        await client.sendMessage(chatId, media, {
                            caption: index === 0 ? (personalizedMessage || '') : '',
                            sendSeen: false,
                        });
                    }
                    console.log(`Arquivos enviados para ${recipient.name} (${formattedNumber})`);
                }

                if (mediaItems.length === 0 && personalizedMessage) {
                    await client.sendMessage(chatId, personalizedMessage, { sendSeen: false });
                    console.log(`Texto enviado para ${recipient.name} (${formattedNumber})`);
                }
            } catch (error) {
                console.error(`Erro ao enviar para ${recipient.name}:`, error.message);
            }

            const shouldContinue = await waitWithStopCheck(matricula, 6000, 300);
            if (!shouldContinue) {
                interrupted = true;
                break;
            }
        }

        if (interrupted) {
            return { statusCode: 200, body: 'Envio interrompido pelo usuario.' };
        }

        return { statusCode: 200, body: 'Envio concluído' };
    } catch (error) {
        console.error('Erro geral no envio:', error);
        return { statusCode: 500, body: 'Erro ao enviar mensagem.' };
    } finally {
        activeSends.delete(matricula);
        stopRequests.delete(matricula);
    }
}

async function stopMessage(payload) {
    const matricula = String(payload?.matricula || '').trim();

    if (!matricula) {
        return { statusCode: 400, body: 'Matricula obrigatoria.' };
    }

    if (!activeSends.has(matricula)) {
        return { statusCode: 400, body: 'Nao ha envio em andamento para interromper.' };
    }

    stopRequests.add(matricula);
    return {
        statusCode: 200,
        body: 'Solicitacao de parada recebida. Interrompendo envio...',
    };
}

module.exports = {
    sendMessage,
    stopMessage,
};
