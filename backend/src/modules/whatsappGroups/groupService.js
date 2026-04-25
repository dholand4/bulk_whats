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

function normalizeParticipantId(value) {
    return String(value || '')
        .trim()
        .toLowerCase();
}

function buildConnectedParticipantIds(client) {
    const ownIds = new Set();
    const serializedWid = normalizeParticipantId(client?.info?.wid?._serialized);

    if (serializedWid) {
        ownIds.add(serializedWid);

        const numericPart = serializedWid.split('@')[0];
        if (numericPart) {
            ownIds.add(`${numericPart}@c.us`);
            ownIds.add(`${numericPart}@s.whatsapp.net`);
            ownIds.add(`${numericPart}@lid`);
        }
    }

    return ownIds;
}

function isCurrentUserInGroup(chat, ownIds) {
    const participants = Array.isArray(chat?.groupMetadata?.participants)
        ? chat.groupMetadata.participants
        : [];

    if (participants.length === 0) {
        return true;
    }

    return participants.some((participant) => {
        const participantId = normalizeParticipantId(
            participant?.id?._serialized
            || participant?.id?.user
            || participant?.id
            || participant,
        );

        if (!participantId) {
            return false;
        }

        if (ownIds.has(participantId)) {
            return true;
        }

        const numericPart = participantId.split('@')[0];
        return ownIds.has(`${numericPart}@c.us`)
            || ownIds.has(`${numericPart}@s.whatsapp.net`)
            || ownIds.has(`${numericPart}@lid`);
    });
}

async function queryFreshConnectedGroups(client) {
    return client.pupPage.evaluate(async () => {
        const normalizeId = (value) => String(value || '').trim().toLowerCase();
        const ownIds = new Set();
        const meWid = window.Store?.User?.getMaybeMePnUser?.() || window.Store?.User?.getMaybeMeLidUser?.();
        const serializedMeWid = normalizeId(meWid?._serialized);

        if (serializedMeWid) {
            ownIds.add(serializedMeWid);

            const numericPart = serializedMeWid.split('@')[0];
            if (numericPart) {
                ownIds.add(`${numericPart}@c.us`);
                ownIds.add(`${numericPart}@s.whatsapp.net`);
                ownIds.add(`${numericPart}@lid`);
            }
        }

        const chatModels = window.Store.Chat?.getModelsArray?.() || [];
        const groups = [];

        for (const chatModel of chatModels) {
            const groupId = chatModel?.id?._serialized;
            const isGroup = Boolean(chatModel?.isGroup || chatModel?.groupMetadata);

            if (!isGroup || !groupId || !groupId.endsWith('@g.us')) {
                continue;
            }

            try {
                await window.Store.GroupQueryAndUpdate({ id: groupId });
            } catch (_error) {
                // Se a atualizacao falhar, ainda tentamos ler o modelo local.
            }

            const refreshedChat = window.Store.Chat.get(chatModel.id) || chatModel;
            const participants = refreshedChat?.groupMetadata?.participants;
            const participantModels = participants?.getModelsArray?.() || participants?._models || [];

            const isCurrentUserStillInGroup = participantModels.length === 0
                ? true
                : participantModels.some((participant) => {
                    const participantId = normalizeId(
                        participant?.id?._serialized
                        || participant?.id?.user
                        || participant?.id
                        || participant,
                    );

                    if (!participantId) {
                        return false;
                    }

                    if (ownIds.has(participantId)) {
                        return true;
                    }

                    const numericPart = participantId.split('@')[0];
                    return ownIds.has(`${numericPart}@c.us`)
                        || ownIds.has(`${numericPart}@s.whatsapp.net`)
                        || ownIds.has(`${numericPart}@lid`);
                });

            if (!isCurrentUserStillInGroup) {
                continue;
            }

            groups.push({
                name: String(refreshedChat?.formattedTitle || refreshedChat?.name || 'Grupo sem nome').trim(),
                whatsappGroupId: groupId,
            });
        }

        return groups;
    });
}

async function syncConnectedGroups(auth) {
    const client = getConnectedClientOrThrow(auth.email);
    let groups = [];

    try {
        groups = await queryFreshConnectedGroups(client);
    } catch (_error) {
        const chats = await client.getChats();
        const ownIds = buildConnectedParticipantIds(client);
        groups = chats
            .filter((chat) => chat?.isGroup && chat?.id?._serialized)
            .filter((chat) => isCurrentUserInGroup(chat, ownIds))
            .map((chat) => ({
                name: normalizeText(chat.name) || 'Grupo sem nome',
                whatsappGroupId: chat.id._serialized,
            }))
            .filter((group) => group.whatsappGroupId.endsWith('@g.us'));
    }

    return groupRepository.syncGroups(auth.email, groups);
}

async function listGroups(auth, options = {}) {
    const forceSync = options.forceSync === true;
    let groups = await groupRepository.listGroups(auth.email);

    try {
        groups = await syncConnectedGroups(auth);
    } catch (error) {
        if (forceSync || !isGroupsSyncUnavailableError(error)) {
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
