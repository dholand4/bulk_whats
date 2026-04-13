const uploadService = require('../modules/uploads/uploadService');
const fileStore = require('../modules/storage/fileStore');

async function uploadMedia(req, res, next) {
    try {
        const result = await uploadService.buildUploadResponse(req.files, req.auth);
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        next(error);
    }
}

async function downloadFile(req, res, next) {
    try {
        const file = await fileStore.getFile(req.params.id, req.auth.email);

        if (!file) {
            res.status(404).json({ message: 'Arquivo nao encontrado.' });
            return;
        }

        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Length', String(file.size_bytes || file.content.length || 0));
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.file_name)}"`);
        res.send(file.content);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    uploadMedia,
    downloadFile,
};
