const templateService = require('../modules/templates/templateService');

async function listTemplates(req, res, next) {
    try {
        const result = await templateService.listTemplates(req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function createTemplate(req, res, next) {
    try {
        const result = await templateService.createTemplate(req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function updateTemplate(req, res, next) {
    try {
        const result = await templateService.updateTemplate(req.params.id, req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function deleteTemplate(req, res, next) {
    try {
        const result = await templateService.deleteTemplate(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function createVariant(req, res, next) {
    try {
        const result = await templateService.createVariant(req.params.templateId, req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function updateVariant(req, res, next) {
    try {
        const result = await templateService.updateVariant(req.params.templateId, req.params.variantId, req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function deleteVariant(req, res, next) {
    try {
        const result = await templateService.deleteVariant(req.params.templateId, req.params.variantId, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
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
