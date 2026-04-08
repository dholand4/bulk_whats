const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const postgres = require('../storage/postgres');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

async function listFiles(directoryPath, prefix = '') {
    if (!fs.existsSync(directoryPath)) {
        return [];
    }

    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
        const absolutePath = path.join(directoryPath, entry.name);

        if (entry.isDirectory()) {
            files.push(...await listFiles(absolutePath, relativePath));
            continue;
        }

        const content = await fs.promises.readFile(absolutePath);
        files.push({
            path: relativePath.replace(/\\/g, '/'),
            content: content.toString('base64'),
        });
    }

    return files;
}

function buildChecksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function saveSessionArchive({ deviceId, ownerMatricula, sessionPath }) {
    const files = await listFiles(sessionPath);
    if (files.length === 0) {
        return null;
    }

    const payload = Buffer.from(JSON.stringify({ version: 1, files }), 'utf8');
    const archive = await gzip(payload);
    const checksum = buildChecksum(archive);

    await postgres.query(`
        INSERT INTO whatsapp_sessions (
            device_id,
            owner_matricula,
            archive,
            checksum,
            file_count,
            size_bytes,
            created_at,
            updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (device_id) DO UPDATE SET
            owner_matricula = EXCLUDED.owner_matricula,
            archive = EXCLUDED.archive,
            checksum = EXCLUDED.checksum,
            file_count = EXCLUDED.file_count,
            size_bytes = EXCLUDED.size_bytes,
            updated_at = NOW()
    `, [deviceId, ownerMatricula, archive, checksum, files.length, archive.length]);

    return {
        deviceId,
        checksum,
        fileCount: files.length,
        sizeBytes: archive.length,
    };
}

async function getSessionArchive(deviceId, ownerMatricula) {
    const result = await postgres.query(`
        SELECT device_id, owner_matricula, archive, checksum, file_count, size_bytes, created_at, updated_at
        FROM whatsapp_sessions
        WHERE device_id = $1 AND owner_matricula = $2
        LIMIT 1
    `, [deviceId, ownerMatricula]);

    return result.rows[0] || null;
}

async function hasSessionArchive(deviceId, ownerMatricula) {
    const result = await postgres.query(`
        SELECT 1
        FROM whatsapp_sessions
        WHERE device_id = $1 AND owner_matricula = $2
        LIMIT 1
    `, [deviceId, ownerMatricula]);

    return result.rowCount > 0;
}

async function restoreSessionArchive({ deviceId, ownerMatricula, sessionPath }) {
    const archiveRecord = await getSessionArchive(deviceId, ownerMatricula);
    if (!archiveRecord) {
        return false;
    }

    const unpacked = await gunzip(Buffer.from(archiveRecord.archive));
    const parsed = JSON.parse(unpacked.toString('utf8'));
    const files = Array.isArray(parsed.files) ? parsed.files : [];

    await fs.promises.mkdir(sessionPath, { recursive: true });

    for (const file of files) {
        const normalizedRelativePath = path.normalize(String(file.path || ''));
        const absolutePath = path.resolve(sessionPath, normalizedRelativePath);
        const relativeFromSessionRoot = path.relative(sessionPath, absolutePath);

        if (relativeFromSessionRoot.startsWith('..') || path.isAbsolute(relativeFromSessionRoot)) {
            throw new Error('Arquivo invalido no restore da sessao do WhatsApp.');
        }

        await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.promises.writeFile(absolutePath, Buffer.from(file.content || '', 'base64'));
    }

    return true;
}

async function deleteSessionArchive(deviceId, ownerMatricula) {
    await postgres.query(`
        DELETE FROM whatsapp_sessions
        WHERE device_id = $1 AND owner_matricula = $2
    `, [deviceId, ownerMatricula]);
}

module.exports = {
    saveSessionArchive,
    getSessionArchive,
    hasSessionArchive,
    restoreSessionArchive,
    deleteSessionArchive,
};
