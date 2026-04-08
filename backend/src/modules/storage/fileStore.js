const crypto = require('crypto');

const postgres = require('./postgres');

function buildChecksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function saveFile({ ownerMatricula, category, fileName, mimeType, buffer }) {
    const content = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || '');
    const checksum = buildChecksum(content);
    const result = await postgres.query(`
        INSERT INTO stored_files (owner_matricula, category, file_name, mime_type, content, size_bytes, checksum, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, owner_matricula, category, file_name, mime_type, size_bytes, checksum, created_at, updated_at
    `, [ownerMatricula, category, fileName, mimeType || 'application/octet-stream', content, content.length, checksum]);

    return result.rows[0];
}

async function getFile(fileId, ownerMatricula) {
    const result = await postgres.query(`
        SELECT id, owner_matricula, category, file_name, mime_type, content, size_bytes, checksum, created_at, updated_at
        FROM stored_files
        WHERE id = $1 AND owner_matricula = $2
        LIMIT 1
    `, [fileId, ownerMatricula]);

    return result.rows[0] || null;
}

async function deleteFile(fileId, ownerMatricula) {
    await postgres.query('DELETE FROM stored_files WHERE id = $1 AND owner_matricula = $2', [fileId, ownerMatricula]);
}

module.exports = {
    saveFile,
    getFile,
    deleteFile,
};
