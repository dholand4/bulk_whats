const fileStore = require('../storage/fileStore');

function normalizeFiles(files) {
    if (!files) {
        return [];
    }

    return Array.isArray(files) ? files : [files];
}

async function buildUploadResponse(files, auth) {
    const normalizedFiles = normalizeFiles(files);

    if (normalizedFiles.length === 0) {
        return {
            statusCode: 400,
            body: { message: 'Nenhum arquivo enviado' },
        };
    }

    const storedFiles = await Promise.all(
        normalizedFiles.map(async (file) => {
            const storedFile = await fileStore.saveFile({
                ownerMatricula: auth.matricula,
                category: 'campaign_attachment',
                fileName: file.originalname,
                mimeType: file.mimetype,
                buffer: file.buffer,
            });

            return {
                path: `dbfile:${storedFile.id}`,
                url: `/api/files/${storedFile.id}`,
                mimeType: storedFile.mime_type,
                fileName: storedFile.file_name,
                sizeBytes: Number(storedFile.size_bytes || 0),
                checksum: storedFile.checksum,
            };
        }),
    );

    return {
        statusCode: 200,
        body: {
            files: storedFiles,
        },
    };
}

module.exports = {
    buildUploadResponse,
};
