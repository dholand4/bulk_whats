const fs = require('fs');
const path = require('path');

const { rootDirectory } = require('../../config');
const fileStore = require('./fileStore');

function getMimeTypeFromExtension(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypesByExtension = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.zip': 'application/zip',
    };

    return mimeTypesByExtension[extension] || 'application/octet-stream';
}

function extractStoredFileId(filePath) {
    if (!String(filePath || '').startsWith('dbfile:')) {
        return '';
    }

    return String(filePath).slice('dbfile:'.length).trim();
}

async function loadAttachmentContent(attachment, ownerMatricula) {
    if (String(attachment?.path || '').startsWith('http')) {
        return {
            kind: 'url',
            url: attachment.path,
            mimeType: attachment.mimeType || 'application/octet-stream',
            fileName: attachment.fileName || '',
        };
    }

    const storedFileId = extractStoredFileId(attachment?.path);
    if (storedFileId) {
        const file = await fileStore.getFile(storedFileId, ownerMatricula);
        if (!file) {
            throw new Error('Arquivo anexado nao encontrado no banco.');
        }

        return {
            kind: 'buffer',
            buffer: Buffer.from(file.content),
            mimeType: attachment.mimeType || file.mime_type,
            fileName: attachment.fileName || file.file_name,
        };
    }

    const absolutePath = path.resolve(rootDirectory, attachment.path || '');
    return {
        kind: 'buffer',
        buffer: fs.readFileSync(absolutePath),
        mimeType: attachment.mimeType || getMimeTypeFromExtension(absolutePath),
        fileName: attachment.fileName || path.basename(absolutePath),
    };
}

module.exports = {
    getMimeTypeFromExtension,
    loadAttachmentContent,
};
