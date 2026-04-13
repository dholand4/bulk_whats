const { MessageMedia } = require('whatsapp-web.js');

const { whatsapp } = require('../../config');
const clientManager = require('../whatsapp/clientManager');
const { loadAttachmentContent } = require('../storage/fileReferenceService');
const { formatPhoneNumber } = require('../../shared/utils/phoneUtils');

function fillTemplate(template, recipient) {
    return String(template || '')
        .replaceAll('{nome}', recipient.contactName || recipient.name || '')
        .replaceAll('{paciente}', recipient.paciente || '')
        .replaceAll('{profissional}', recipient.profissional || '')
        .replaceAll('{data}', recipient.data || '')
        .replaceAll('{hora}', recipient.hora || '');
}

async function createMedia(attachment, ownerEmail) {
    const resolved = await loadAttachmentContent(attachment, ownerEmail);

    if (resolved.kind === 'url') {
        return MessageMedia.fromUrl(resolved.url);
    }

    const data = resolved.buffer.toString('base64');
    return new MessageMedia(
        resolved.mimeType || 'application/octet-stream',
        data,
        resolved.fileName || 'arquivo',
    );
}

async function sendQueueItem(queueItem) {
    const client = clientManager.getClient(queueItem.deviceId);

    if (!client) {
        throw new Error('Dispositivo ainda nao foi inicializado.');
    }

    const formattedNumber = formatPhoneNumber(queueItem.recipientNumber);
    const chatId = `${formattedNumber}${whatsapp.suffix}`;
    const personalizedMessage = fillTemplate(queueItem.message, queueItem);

    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
        throw new Error('Numero nao registrado no WhatsApp.');
    }

    const attachments = Array.isArray(queueItem.attachments) ? queueItem.attachments : [];
    const ownerEmail = queueItem.createdBy || queueItem.deviceId;
    if (attachments.length > 0) {
        for (let index = 0; index < attachments.length; index += 1) {
            const media = await createMedia(attachments[index], ownerEmail);
            await client.sendMessage(chatId, media, {
                caption: index === 0 ? personalizedMessage : '',
                sendSeen: false,
            });
        }
        return;
    }

    if (!personalizedMessage) {
        throw new Error('Mensagem vazia e sem anexos.');
    }

    await client.sendMessage(chatId, personalizedMessage, { sendSeen: false });
}

module.exports = {
    fillTemplate,
    sendQueueItem,
};
