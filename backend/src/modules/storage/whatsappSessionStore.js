const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const postgres = require('./postgres');

const IGNORE_FILE_NAMES = new Set(['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'lockfile']);

function checksum(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function collectFiles(rootDirectory, currentDirectory = rootDirectory, files = []) {
    if (!fs.existsSync(currentDirectory)) {
        return files;
    }

    const entries = await fs.promises.readdir(currentDirectory, { withFileTypes: true });
    for (const entry of entries) {
        const absolutePath = path.join(currentDirectory, entry.name);
        if (entry.isDirectory()) {
            await collectFiles(rootDirectory, absolutePath, files);
            continue;
        }

        if (IGNORE_FILE_NAMES.has(entry.name)) {
            continue;
        }

        const content = await fs.promises.readFile(absolutePath);
        files.push({
            path: path.relative(rootDirectory, absolutePath),
            data: content.toString('base64'),
        });
    }

    return files;
}

async function createArchiveFromDirectory(directoryPath) {
    const files = await collectFiles(directoryPath);
    const payload = Buffer.from(JSON.stringify({ files }), 'utf8');
    return {
        archive: zlib.gzipSync(payload),
        fileCount: files.length,
    };
}

async function restoreArchiveToDirectory(archiveBuffer, directoryPath) {
    const extracted = JSON.parse(zlib.gunzipSync(archiveBuffer).toString('utf8'));
    const files = Array.isArray(extracted?.files) ? extracted.files : [];

    await fs.promises.mkdir(directoryPath, { recursive: true });
    await Promise.all(files.map(async (file) => {
        const absolutePath = path.join(directoryPath, file.path);
        await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.promises.writeFile(absolutePath, Buffer.from(file.data, 'base64'));
    }));

    return files.length;
}

async function saveSessionSnapshot({ deviceId, ownerMatricula, directoryPath }) {
    if (!fs.existsSync(directoryPath)) {
        return null;
    }

    const { archive, fileCount } = await createArchiveFromDirectory(directoryPath);
    const result = await postgres.query(`
        INSERT INTO whatsapp_sessions (device_id, owner_matricula, archive, checksum, file_count, size_bytes, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (device_id) DO UPDATE SET
            owner_matricula = EXCLUDED.owner_matricula,
            archive = EXCLUDED.archive,
            checksum = EXCLUDED.checksum,
            file_count = EXCLUDED.file_count,
            size_bytes = EXCLUDED.size_bytes,
            updated_at = NOW()
        RETURNING device_id, owner_matricula, checksum, file_count, size_bytes, created_at, updated_at
    `, [deviceId, ownerMatricula, archive, checksum(archive), fileCount, archive.length]);

    return result.rows[0];
}

async function getSessionSnapshot(deviceId) {
    const result = await postgres.query(`
        SELECT device_id, owner_matricula, archive, checksum, file_count, size_bytes, created_at, updated_at
        FROM whatsapp_sessions
        WHERE device_id = $1
        LIMIT 1
    `, [deviceId]);

    return result.rows[0] || null;
}

async function restoreSessionSnapshot(deviceId, directoryPath) {
    const snapshot = await getSessionSnapshot(deviceId);
    if (!snapshot) {
        return false;
    }

    await restoreArchiveToDirectory(snapshot.archive, directoryPath);
    return true;
}

async function deleteSessionSnapshot(deviceId) {
    await postgres.query('DELETE FROM whatsapp_sessions WHERE device_id = $1', [deviceId]);
}

module.exports = {
    saveSessionSnapshot,
    getSessionSnapshot,
    restoreSessionSnapshot,
    deleteSessionSnapshot,
};
