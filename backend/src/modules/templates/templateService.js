const templateRepository = require('./templateRepository');

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizeBoolean(value, fallback = true) {
    if (typeof value === 'boolean') {
        return value;
    }

    return fallback;
}

function normalizeTemplatePayload(payload) {
    const name = normalizeText(payload?.name);
    if (!name) {
        throw new Error('Informe o nome do template.');
    }

    return {
        name,
        description: normalizeText(payload?.description),
        active: normalizeBoolean(payload?.active, true),
    };
}

function normalizeVariantPayload(payload) {
    const body = normalizeText(payload?.body);
    if (!body) {
        throw new Error('Informe a mensagem da variacao.');
    }

    return {
        body,
        active: normalizeBoolean(payload?.active, true),
    };
}

async function listTemplates(auth) {
    return {
        statusCode: 200,
        body: {
            templates: await templateRepository.listTemplates(auth.email),
        },
    };
}

async function createTemplate(payload, auth) {
    const template = await templateRepository.createTemplate({
        ownerEmail: auth.email,
        ...normalizeTemplatePayload(payload),
    });

    return {
        statusCode: 201,
        body: {
            template,
        },
    };
}

async function updateTemplate(templateId, payload, auth) {
    const template = await templateRepository.updateTemplate({
        id: templateId,
        ownerEmail: auth.email,
        ...normalizeTemplatePayload(payload),
    });

    if (!template) {
        throw new Error('Template nao encontrado.');
    }

    return {
        statusCode: 200,
        body: {
            template,
        },
    };
}

async function deleteTemplate(templateId, auth) {
    await templateRepository.deleteTemplate(templateId, auth.email);
    return {
        statusCode: 200,
        body: {
            message: 'Template removido com sucesso.',
        },
    };
}

async function createVariant(templateId, payload, auth) {
    const variant = await templateRepository.createVariant({
        templateId,
        ownerEmail: auth.email,
        ...normalizeVariantPayload(payload),
    });

    if (!variant) {
        throw new Error('Template nao encontrado.');
    }

    await templateRepository.touchTemplate(templateId, auth.email);

    return {
        statusCode: 201,
        body: {
            variant,
        },
    };
}

async function updateVariant(templateId, variantId, payload, auth) {
    const variant = await templateRepository.updateVariant({
        templateId,
        variantId,
        ownerEmail: auth.email,
        ...normalizeVariantPayload(payload),
    });

    if (!variant) {
        throw new Error('Variacao nao encontrada.');
    }

    await templateRepository.touchTemplate(templateId, auth.email);

    return {
        statusCode: 200,
        body: {
            variant,
        },
    };
}

async function deleteVariant(templateId, variantId, auth) {
    await templateRepository.deleteVariant(templateId, variantId, auth.email);
    await templateRepository.touchTemplate(templateId, auth.email);

    return {
        statusCode: 200,
        body: {
            message: 'Variacao removida com sucesso.',
        },
    };
}

module.exports = {
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createVariant,
    updateVariant,
    deleteVariant,
};
