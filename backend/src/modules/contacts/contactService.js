const contactRepository = require('./contactRepository');

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '');
}

function normalizePayload(payload) {
    const name = normalizeText(payload?.name);
    const phone = normalizePhone(payload?.phone);

    if (!name) {
        throw new Error('Informe o nome do contato.');
    }

    if (!phone) {
        throw new Error('Informe o numero do contato.');
    }

    return {
        listName: normalizeText(payload?.listName) || 'Geral',
        name,
        phone,
        paciente: normalizeText(payload?.paciente),
        profissional: normalizeText(payload?.profissional),
        data: normalizeText(payload?.data),
        hora: normalizeText(payload?.hora),
        notes: normalizeText(payload?.notes),
    };
}

async function listContacts(auth) {
    return {
        statusCode: 200,
        body: {
            contacts: await contactRepository.listContacts(auth.matricula),
        },
    };
}

async function createContact(payload, auth) {
    const contact = await contactRepository.createContact({
        ownerMatricula: auth.matricula,
        ...normalizePayload(payload),
    });

    return {
        statusCode: 201,
        body: {
            contact,
        },
    };
}

async function updateContact(contactId, payload, auth) {
    const contact = await contactRepository.updateContact({
        id: contactId,
        ownerMatricula: auth.matricula,
        ...normalizePayload(payload),
    });

    if (!contact) {
        throw new Error('Contato nao encontrado.');
    }

    return {
        statusCode: 200,
        body: {
            contact,
        },
    };
}

async function deleteContact(contactId, auth) {
    await contactRepository.deleteContact(contactId, auth.matricula);
    return {
        statusCode: 200,
        body: {
            message: 'Contato removido com sucesso.',
        },
    };
}

async function deleteContactList(listName, auth) {
    const normalizedListName = normalizeText(listName);
    if (!normalizedListName) {
        throw new Error('Informe a lista que deseja remover.');
    }

    const removedCount = await contactRepository.deleteContactList(auth.matricula, normalizedListName);
    return {
        statusCode: 200,
        body: {
            message: `${removedCount} contato(s) removido(s) da lista ${normalizedListName}.`,
        },
    };
}

async function importContacts(payload, auth) {
    const items = Array.isArray(payload?.contacts) ? payload.contacts : [];
    if (items.length === 0) {
        throw new Error('Nenhum contato informado para importacao.');
    }

    const createdContacts = [];
    for (const item of items) {
        const normalized = normalizePayload(item);
        // eslint-disable-next-line no-await-in-loop
        const contact = await contactRepository.createContact({
            ownerMatricula: auth.matricula,
            ...normalized,
        });
        createdContacts.push(contact);
    }

    return {
        statusCode: 201,
        body: {
            message: `${createdContacts.length} contato(s) importado(s) com sucesso.`,
            contacts: createdContacts,
        },
    };
}

module.exports = {
    listContacts,
    createContact,
    updateContact,
    deleteContact,
    deleteContactList,
    importContacts,
};
