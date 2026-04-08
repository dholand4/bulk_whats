const postgres = require('../storage/postgres');
const { seed } = require('../../config');

function mapUser(row) {
    if (!row) {
        return null;
    }

    return {
        matricula: row.matricula,
        role: row.role,
        dataExpiracao: row.expiration_date instanceof Date
            ? row.expiration_date.toISOString().slice(0, 10)
            : String(row.expiration_date),
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function listUsers() {
    const result = await postgres.query(`
        SELECT matricula, role, expiration_date, active, created_at, updated_at
        FROM users
        ORDER BY role DESC, matricula ASC
    `);

    return result.rows.map(mapUser);
}

async function findByMatricula(matricula) {
    const result = await postgres.query(`
        SELECT matricula, role, expiration_date, active, created_at, updated_at
        FROM users
        WHERE matricula = $1
        LIMIT 1
    `, [matricula]);

    return mapUser(result.rows[0]);
}

async function upsertUser({ matricula, role = 'user', dataExpiracao, password, active = true }) {
    const result = await postgres.query(`
        INSERT INTO users (matricula, role, expiration_date, password_hash, active, updated_at)
        VALUES (
            $1,
            $2,
            $3::date,
            CASE
                WHEN NULLIF($4, '') IS NULL THEN NULL
                ELSE crypt($4, gen_salt('bf'))
            END,
            $5,
            NOW()
        )
        ON CONFLICT (matricula)
        DO UPDATE SET
            role = EXCLUDED.role,
            expiration_date = EXCLUDED.expiration_date,
            password_hash = CASE
                WHEN NULLIF($4, '') IS NULL THEN users.password_hash
                ELSE crypt($4, gen_salt('bf'))
            END,
            active = EXCLUDED.active,
            updated_at = NOW()
        RETURNING matricula, role, expiration_date, active, created_at, updated_at
    `, [matricula, role, dataExpiracao, password || '', active]);

    return mapUser(result.rows[0]);
}

async function verifyPassword(matricula, password) {
    const result = await postgres.query(`
        SELECT
            matricula,
            password_hash,
            CASE
                WHEN password_hash IS NULL THEN FALSE
                ELSE password_hash = crypt($2, password_hash)
            END AS password_matches
        FROM users
        WHERE matricula = $1
        LIMIT 1
    `, [matricula, password]);

    const row = result.rows[0];
    if (!row) {
        return false;
    }

    if (!row.password_hash) {
        return password === matricula;
    }

    return Boolean(row.password_matches);
}

async function deleteUser(matricula) {
    await postgres.query('DELETE FROM users WHERE matricula = $1', [matricula]);
}

async function bootstrapUsersFromLegacy(legacyState) {
    const countResult = await postgres.query('SELECT COUNT(*)::int AS count FROM users');
    const currentCount = countResult.rows[0]?.count || 0;
    const legacyUsers = Array.isArray(legacyState?.users) ? legacyState.users : [];

    if (currentCount === 0 && legacyUsers.length > 0) {
        for (const user of legacyUsers) {
            // eslint-disable-next-line no-await-in-loop
            await upsertUser({
                matricula: user.matricula,
                role: user.matricula === seed.adminMatricula ? 'admin' : 'user',
                dataExpiracao: user.dataExpiracao || seed.adminExpirationDate,
                active: true,
            });
        }
    }

    const adminUser = await findByMatricula(seed.adminMatricula);
    if (!adminUser) {
        await upsertUser({
            matricula: seed.adminMatricula,
            role: 'admin',
            dataExpiracao: seed.adminExpirationDate,
            active: true,
        });
        return;
    }

    if (adminUser.role !== 'admin') {
        await upsertUser({
            matricula: adminUser.matricula,
            role: 'admin',
            dataExpiracao: adminUser.dataExpiracao,
            active: adminUser.active,
        });
    }
}

module.exports = {
    listUsers,
    findByMatricula,
    upsertUser,
    verifyPassword,
    deleteUser,
    bootstrapUsersFromLegacy,
};
