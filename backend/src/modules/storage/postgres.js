const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const { postgres } = require('../../config');

const pool = new Pool(postgres);

async function query(text, params = []) {
    return pool.query(text, params);
}

async function withTransaction(callback) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function ensureSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = await fs.promises.readFile(schemaPath, 'utf8');
    await pool.query(schemaSql);
}

async function close() {
    await pool.end();
}

module.exports = {
    query,
    withTransaction,
    ensureSchema,
    close,
};
