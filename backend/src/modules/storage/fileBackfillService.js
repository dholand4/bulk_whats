const fs = require('fs');
const path = require('path');

const { rootDirectory } = require('../../config');
const database = require('./database');
const fileStore = require('./fileStore');
const { getMimeTypeFromExtension } = require('./fileReferenceService');

function shouldBackfillAttachment(attachment) {
    const attachmentPath = String(attachment?.path || '');
    return Boolean(attachmentPath)
        && !attachmentPath.startsWith('http')
        && !attachmentPath.startsWith('dbfile:');
}

async function backfillAttachments() {
    const cacheByOwnerAndPath = new Map();

    await database.update(async (current) => {
        const collections = [current.queue, current.history];

        for (const items of collections) {
            for (const item of items) {
                const ownerMatricula = item.createdBy || item.deviceId || '';
                const attachments = Array.isArray(item.attachments) ? item.attachments : [];

                for (const attachment of attachments) {
                    if (!shouldBackfillAttachment(attachment) || !ownerMatricula) {
                        continue;
                    }

                    const absolutePath = path.resolve(rootDirectory, attachment.path);
                    if (!fs.existsSync(absolutePath)) {
                        continue;
                    }

                    const cacheKey = `${ownerMatricula}:${absolutePath}`;
                    let storedFile = cacheByOwnerAndPath.get(cacheKey);

                    if (!storedFile) {
                        storedFile = await fileStore.saveFile({
                            ownerMatricula,
                            category: 'legacy_attachment',
                            fileName: attachment.fileName || path.basename(absolutePath),
                            mimeType: attachment.mimeType || getMimeTypeFromExtension(absolutePath),
                            buffer: await fs.promises.readFile(absolutePath),
                        });
                        cacheByOwnerAndPath.set(cacheKey, storedFile);
                    }

                    attachment.path = `dbfile:${storedFile.id}`;
                    attachment.mimeType = attachment.mimeType || storedFile.mime_type;
                    attachment.fileName = attachment.fileName || storedFile.file_name;
                }
            }
        }
    });
}

module.exports = {
    backfillAttachments,
};
