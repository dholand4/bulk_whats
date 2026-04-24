const clientManager = require('../whatsapp/clientManager');
const contactRepository = require('../contacts/contactRepository');
const groupRepository = require('./groupRepository');

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizeGroupId(value) {
    const groupId = normalizeText(value);
    if (!groupId) {
        throw new Error('Informe o ID do grupo.');
    }

    if (!groupId.endsWith('@g.us')) {
        throw new Error('O ID do grupo deve usar o formato @g.us.');
    }

    return groupId;
}

function isGroupsSyncUnavailableError(error) {
    const message = String(error?.message || error || '').toLowerCase();
    return message.includes('dispositivo nao conectado')
        || message.includes('reading \'getchats\'')
        || message.includes('reading "getchats"')
        || message.includes('wwebjs')
        || message.includes('execution context was destroyed');
}

function getConnectedClientOrThrow(deviceId) {
    const client = clientManager.getClient(deviceId);
    if (!client) {
        throw new Error('Dispositivo nao conectado ao WhatsApp.');
    }

    return client;
}

async function syncConnectedGroups(auth) {
    const client = getConnectedClientOrThrow(auth.email);
    const chats = await client.getChats();
    const groups = chats
        .filter((chat) => chat?.isGroup && chat?.id?._serialized)
        .map((chat) => ({
            name: normalizeText(chat.name) || 'Grupo sem nome',
            whatsappGroupId: chat.id._serialized,
        }))
        .filter((group) => group.whatsappGroupId.endsWith('@g.us'));

    const persistedGroups = [];
    for (const group of groups) {
        // eslint-disable-next-line no-await-in-loop
        const persisted = await groupRepository.upsertGroup({
            ownerEmail: auth.email,
            name: group.name,
            whatsappGroupId: group.whatsappGroupId,
        });
        persistedGroups.push(persisted);
    }

    return persistedGroups;
}

async function listGroups(auth) {
    let groups = await groupRepository.listGroups(auth.email);

    try {
        groups = await syncConnectedGroups(auth);
    } catch (error) {
        if (!isGroupsSyncUnavailableError(error)) {
            throw error;
        }
    }

    return {
        statusCode: 200,
        body: {
            groups,
        },
    };
}

async function createGroup(payload, auth) {
    const groupName = normalizeText(payload?.name);
    const contactIds = Array.isArray(payload?.contactIds) ? payload.contactIds.map((item) => normalizeText(item)).filter(Boolean) : [];

    if (!groupName) {
        throw new Error('Informe o nome do grupo.');
    }

    if (contactIds.length === 0) {
        throw new Error('Selecione ao menos um contato cadastrado para criar o grupo.');
    }

    const client = getConnectedClientOrThrow(auth.email);
    const contacts = await contactRepository.listContactsByIds(auth.email, contactIds);

    if (contacts.length === 0) {
        throw new Error('Nenhum contato valido foi encontrado para criar o grupo.');
    }

    const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
    const missingContactIds = contactIds.filter((contactId) => !contactById.has(contactId));
    if (missingContactIds.length > 0) {
        throw new Error('Um ou mais contatos selecionados nao pertencem a este usuario.');
    }

    const invalidContacts = [];
    const participants = [];

    for (const contactId of contactIds) {
        const contact = contactById.get(contactId);
        const phone = String(contact.phone || '').replace(/\D/g, '');

        // eslint-disable-next-line no-await-in-loop
        const numberId = await client.getNumberId(phone);
        if (!numberId?._serialized) {
            invalidContacts.push(contact.name || phone);
            continue;
        }

        participants.push(numberId._serialized);
    }

    if (participants.length === 0) {
        throw new Error(`Nenhum numero valido para criar o grupo. Invalidos: ${invalidContacts.join(', ')}`);
    }

    const result = await client.createGroup(groupName, participants);

    if (typeof result === 'string') {
        throw new Error(result || 'Falha ao criar grupo no WhatsApp.');
    }

    const whatsappGroupId = normalizeGroupId(result?.gid?._serialized);
    const group = await groupRepository.upsertGroup({
        ownerEmail: auth.email,
        name: normalizeText(result?.title) || groupName,
        whatsappGroupId,
    });

    return {
        statusCode: 201,
        body: {
            message: invalidContacts.length > 0
                ? `Grupo criado com sucesso. Contatos ignorados: ${invalidContacts.join(', ')}.`
                : 'Grupo criado com sucesso.',
            group,
            invalidContacts,
            participantsAdded: participants.length,
        },
    };
}

async function validateStoredGroup(ownerEmail, groupId) {
    const normalizedGroupId = normalizeGroupId(groupId);
    return groupRepository.getGroupByWhatsappId(ownerEmail, normalizedGroupId);
}

module.exports = {
    listGroups,
    createGroup,
    validateStoredGroup,
};
