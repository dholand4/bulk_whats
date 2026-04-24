const postgres = require('../storage/postgres');

function mapGroup(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        ownerEmail: row.owner_email,
        name: row.name,
        whatsappGroupId: row.whatsapp_group_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function listGroups(ownerEmail) {
    const result = await postgres.query(`
        SELECT id, owner_email, name, whatsapp_group_id, created_at, updated_at
        FROM whatsapp_groups
        WHERE owner_email = $1
        ORDER BY name ASC, created_at DESC
    `, [ownerEmail]);

    return result.rows.map(mapGroup);
}

async function upsertGroup({ ownerEmail, name, whatsappGroupId }) {
    const result = await postgres.query(`
        INSERT INTO whatsapp_groups (owner_email, name, whatsapp_group_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (owner_email, whatsapp_group_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
        RETURNING id, owner_email, name, whatsapp_group_id, created_at, updated_at
    `, [ownerEmail, name, whatsappGroupId]);

    return mapGroup(result.rows[0]);
}

async function getGroupByWhatsappId(ownerEmail, whatsappGroupId) {
    const result = await postgres.query(`
        SELECT id, owner_email, name, whatsapp_group_id, created_at, updated_at
        FROM whatsapp_groups
        WHERE owner_email = $1 AND whatsapp_group_id = $2
        LIMIT 1
    `, [ownerEmail, whatsappGroupId]);

    return mapGroup(result.rows[0]);
}

module.exports = {
    listGroups,
    upsertGroup,
    getGroupByWhatsappId,
};
