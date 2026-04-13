const postgres = require('./postgres');

const defaultDatabase = {
    users: [],
    devices: [],
    queue: [],
    history: [],
    meta: {
        lastBootAt: null,
    },
};

let cache = null;
let writeQueue = Promise.resolve();

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeDatabase(database) {
    return {
        users: Array.isArray(database?.users) ? database.users : [],
        devices: Array.isArray(database?.devices) ? database.devices : [],
        queue: Array.isArray(database?.queue) ? database.queue : [],
        history: Array.isArray(database?.history) ? database.history : [],
        meta: {
            ...defaultDatabase.meta,
            ...(database?.meta || {}),
        },
    };
}

async function bootstrap() {
    await postgres.ensureSchema();
    const existingState = await postgres.query('SELECT state FROM app_state WHERE id = 1');

    if (existingState.rowCount === 0) {
        const initialState = clone(defaultDatabase);
        await postgres.query(
            'INSERT INTO app_state (id, state, updated_at) VALUES (1, $1::jsonb, NOW())',
            [JSON.stringify(initialState)],
        );
        cache = initialState;
        return clone(cache);
    }

    cache = normalizeDatabase(existingState.rows[0].state);
    return clone(cache);
}

function load() {
    if (!cache) {
        throw new Error('Banco de dados ainda nao foi inicializado. Execute database.bootstrap() no startup.');
    }

    return clone(cache);
}

async function persist(nextDatabase) {
    cache = normalizeDatabase(nextDatabase);
    const snapshot = JSON.stringify(cache);

    writeQueue = writeQueue.then(async () => {
        await postgres.query(
            'UPDATE app_state SET state = $1::jsonb, updated_at = NOW() WHERE id = 1',
            [snapshot],
        );
    });

    await writeQueue;
    return clone(cache);
}

async function update(mutator) {
    const current = load();
    const next = clone(current);
    const result = await mutator(next);
    const persisted = await persist(next);

    return {
        database: persisted,
        result,
    };
}

module.exports = {
    bootstrap,
    load,
    persist,
    update,
};
