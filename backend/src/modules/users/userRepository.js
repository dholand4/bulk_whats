const postgres = require('../storage/postgres');

function mapUser(row) {
    if (!row) {
        return null;
    }

    return {
        email: row.email,
        role: row.role,
        dataExpiracao: row.expiration_date instanceof Date
            ? row.expiration_date.toISOString().slice(0, 10)
            : String(row.expiration_date),
        mustChangePassword: Boolean(row.force_password_change),
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function listUsers() {
    const result = await postgres.query(`
        SELECT email, role, expiration_date, force_password_change, active, created_at, updated_at
        FROM users
        ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, email ASC
    `);

    return result.rows.map(mapUser);
}

async function findByEmail(email) {
    const result = await postgres.query(`
        SELECT email, role, expiration_date, force_password_change, active, created_at, updated_at
        FROM users
        WHERE email = $1
        LIMIT 1
    `, [email]);

    return mapUser(result.rows[0]);
}

async function upsertUser({ email, role = 'user', dataExpiracao, password, forcePasswordChange = true, active = true }) {
    const result = await postgres.query(`
        INSERT INTO users (email, role, expiration_date, password_hash, force_password_change, active, updated_at)
        VALUES (
            $1,
            $2,
            $3::date,
            CASE
                WHEN NULLIF($4, '') IS NULL THEN NULL
                ELSE crypt($4, gen_salt('bf'))
            END,
            CASE
                WHEN NULLIF($4, '') IS NULL THEN FALSE
                ELSE $5
            END,
            $6,
            NOW()
        )
        ON CONFLICT (email)
        DO UPDATE SET
            role = EXCLUDED.role,
            expiration_date = EXCLUDED.expiration_date,
            password_hash = CASE
                WHEN NULLIF($4, '') IS NULL THEN users.password_hash
                ELSE crypt($4, gen_salt('bf'))
            END,
            force_password_change = CASE
                WHEN NULLIF($4, '') IS NULL THEN users.force_password_change
                ELSE $5
            END,
            active = EXCLUDED.active,
            updated_at = NOW()
        RETURNING email, role, expiration_date, force_password_change, active, created_at, updated_at
    `, [email, role, dataExpiracao, password || '', forcePasswordChange, active]);

    return mapUser(result.rows[0]);
}

async function verifyPassword(email, password) {
    const result = await postgres.query(`
        SELECT
            email,
            password_hash,
            CASE
                WHEN password_hash IS NULL THEN FALSE
                ELSE password_hash = crypt($2, password_hash)
            END AS password_matches
        FROM users
        WHERE email = $1
        LIMIT 1
    `, [email, password]);

    const row = result.rows[0];
    if (!row) {
        return false;
    }

    if (!row.password_hash) {
        return password === email;
    }

    return Boolean(row.password_matches);
}

async function updatePassword(email, password) {
    const result = await postgres.query(`
        UPDATE users
        SET
            password_hash = crypt($2, gen_salt('bf')),
            force_password_change = FALSE,
            updated_at = NOW()
        WHERE email = $1
        RETURNING email, role, expiration_date, force_password_change, active, created_at, updated_at
    `, [email, password]);

    return mapUser(result.rows[0]);
}

async function deleteUser(email) {
    await postgres.query('DELETE FROM users WHERE email = $1', [email]);
}

module.exports = {
    listUsers,
    findByEmail,
    upsertUser,
    verifyPassword,
    updatePassword,
    deleteUser,
};
