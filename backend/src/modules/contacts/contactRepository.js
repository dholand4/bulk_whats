const postgres = require('../storage/postgres');

function mapContact(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        ownerEmail: row.owner_email,
        listName: row.list_name,
        name: row.name,
        phone: row.phone,
        paciente: row.paciente,
        profissional: row.profissional,
        data: row.data,
        hora: row.hora,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function listContacts(ownerEmail) {
    const result = await postgres.query(`
        SELECT id, owner_email, list_name, name, phone, paciente, profissional, data, hora, notes, created_at, updated_at
        FROM contacts
        WHERE owner_email = $1
        ORDER BY list_name ASC, name ASC, created_at DESC
    `, [ownerEmail]);

    return result.rows.map(mapContact);
}

async function listContactsByIds(ownerEmail, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        return [];
    }

    const result = await postgres.query(`
        SELECT id, owner_email, list_name, name, phone, paciente, profissional, data, hora, notes, created_at, updated_at
        FROM contacts
        WHERE owner_email = $1 AND id = ANY($2::uuid[])
    `, [ownerEmail, ids]);

    return result.rows.map(mapContact);
}

async function createContact({ ownerEmail, listName = 'Geral', name, phone, paciente = '', profissional = '', data = '', hora = '', notes = '' }) {
    const result = await postgres.query(`
        INSERT INTO contacts (owner_email, list_name, name, phone, paciente, profissional, data, hora, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, owner_email, list_name, name, phone, paciente, profissional, data, hora, notes, created_at, updated_at
    `, [ownerEmail, listName, name, phone, paciente, profissional, data, hora, notes]);

    return mapContact(result.rows[0]);
}

async function updateContact({ id, ownerEmail, listName = 'Geral', name, phone, paciente = '', profissional = '', data = '', hora = '', notes = '' }) {
    const result = await postgres.query(`
        UPDATE contacts
        SET
            list_name = $3,
            name = $4,
            phone = $5,
            paciente = $6,
            profissional = $7,
            data = $8,
            hora = $9,
            notes = $10,
            updated_at = NOW()
        WHERE id = $1 AND owner_email = $2
        RETURNING id, owner_email, list_name, name, phone, paciente, profissional, data, hora, notes, created_at, updated_at
    `, [id, ownerEmail, listName, name, phone, paciente, profissional, data, hora, notes]);

    return mapContact(result.rows[0]);
}

async function deleteContact(id, ownerEmail) {
    await postgres.query('DELETE FROM contacts WHERE id = $1 AND owner_email = $2', [id, ownerEmail]);
}

async function deleteContactList(ownerEmail, listName) {
    const result = await postgres.query(`
        DELETE FROM contacts
        WHERE owner_email = $1 AND list_name = $2
    `, [ownerEmail, listName]);

    return result.rowCount || 0;
}

module.exports = {
    listContacts,
    listContactsByIds,
    createContact,
    updateContact,
    deleteContact,
    deleteContactList,
};
