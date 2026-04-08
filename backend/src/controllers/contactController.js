const contactService = require('../modules/contacts/contactService');

async function listContacts(req, res, next) {
    try {
        const result = await contactService.listContacts(req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function createContact(req, res, next) {
    try {
        const result = await contactService.createContact(req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function updateContact(req, res, next) {
    try {
        const result = await contactService.updateContact(req.params.id, req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function deleteContact(req, res, next) {
    try {
        const result = await contactService.deleteContact(req.params.id, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function deleteContactList(req, res, next) {
    try {
        const result = await contactService.deleteContactList(req.params.listName, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function importContacts(req, res, next) {
    try {
        const result = await contactService.importContacts(req.body, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listContacts,
    createContact,
    updateContact,
    deleteContact,
    deleteContactList,
    importContacts,
};
