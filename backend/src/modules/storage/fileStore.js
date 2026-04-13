const crypto = require('crypto');

const postgres = require('./postgres');

function buildChecksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function saveFile({ ownerEmail, category, fileName, mimeType, buffer }) {
    const content = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || '');
    const checksum = buildChecksum(content);
    const result = await postgres.query(`
        INSERT INTO stored_files (owner_email, category, file_name, mime_type, content, size_bytes, checksum, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, owner_email, category, file_name, mime_type, size_bytes, checksum, created_at, updated_at
    `, [ownerEmail, category, fileName, mimeType || 'application/octet-stream', content, content.length, checksum]);

    return result.rows[0];
}

async function getFile(fileId, ownerEmail) {
    const result = await postgres.query(`
        SELECT id, owner_email, category, file_name, mime_type, content, size_bytes, checksum, created_at, updated_at
        FROM stored_files
        WHERE id = $1 AND owner_email = $2
        LIMIT 1
    `, [fileId, ownerEmail]);

    return result.rows[0] || null;
}

async function deleteFile(fileId, ownerEmail) {
    await postgres.query('DELETE FROM stored_files WHERE id = $1 AND owner_email = $2', [fileId, ownerEmail]);
}

module.exports = {
    saveFile,
    getFile,
    deleteFile,
};
