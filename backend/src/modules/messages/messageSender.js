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

function buildChatCandidates(formattedNumber, numberId) {
    const preferredChatId = `${formattedNumber}${whatsapp.suffix}`;
    const candidates = [preferredChatId];

    if (numberId?._serialized && numberId._serialized !== preferredChatId) {
        if (!numberId._serialized.endsWith('@lid')) {
            candidates.unshift(numberId._serialized);
        } else {
            candidates.push(numberId._serialized);
        }
    }

    return Array.from(new Set(candidates.filter(Boolean)));
}

async function resolveChatIds(client, recipientNumber) {
    const formattedNumber = formatPhoneNumber(recipientNumber);
    const numberId = await client.getNumberId(formattedNumber);

    if (!numberId?._serialized) {
        throw new Error('Numero nao registrado no WhatsApp.');
    }

    return buildChatCandidates(formattedNumber, numberId);
}

function shouldRetryWithAnotherChatId(error) {
    const message = String(error?.message || error || '').toLowerCase();
    return message.includes('findchat')
        || message.includes('new chat not found')
        || message.includes('invalid wid');
}

async function sendWithResolvedChatIds(client, chatIds, payload, options) {
    let lastError = null;

    for (let index = 0; index < chatIds.length; index += 1) {
        try {
            await client.sendMessage(chatIds[index], payload, options);
            return;
        } catch (error) {
            lastError = error;
            if (!shouldRetryWithAnotherChatId(error) || index === chatIds.length - 1) {
                throw error;
            }
        }
    }

    throw lastError || new Error('Nao foi possivel localizar a conversa no WhatsApp.');
}

async function sendQueueItem(queueItem) {
    const client = clientManager.getClient(queueItem.deviceId);

    if (!client) {
        throw new Error('Dispositivo ainda nao foi inicializado.');
    }

    const isGroupRecipient = queueItem.recipientType === 'group';
    const chatIds = isGroupRecipient
        ? [String(queueItem.recipientId || queueItem.recipientNumber || '').trim()]
        : await resolveChatIds(client, queueItem.recipientNumber);
    const personalizedMessage = fillTemplate(queueItem.message, queueItem);

    if (isGroupRecipient && (!chatIds[0] || !chatIds[0].endsWith('@g.us'))) {
        throw new Error('Grupo nao encontrado ou ID invalido.');
    }

    const attachments = Array.isArray(queueItem.attachments) ? queueItem.attachments : [];
    const ownerEmail = queueItem.createdBy || queueItem.deviceId;
    if (attachments.length > 0) {
        for (let index = 0; index < attachments.length; index += 1) {
            const media = await createMedia(attachments[index], ownerEmail);
            await sendWithResolvedChatIds(client, chatIds, media, {
                caption: index === 0 ? personalizedMessage : '',
                sendSeen: false,
            });
        }
        return;
    }

    if (!personalizedMessage) {
        throw new Error('Mensagem vazia e sem anexos.');
    }

    await sendWithResolvedChatIds(client, chatIds, personalizedMessage, { sendSeen: false });
}

module.exports = {
    fillTemplate,
    sendQueueItem,
};
