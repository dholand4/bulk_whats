const postgres = require('../storage/postgres');

function mapContact(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        ownerMatricula: row.owner_matricula,
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

async function listContacts(ownerMatricula) {
    const result = await postgres.query(`
        SELECT id, owner_matricula, list_name, name, phone, paciente, profissional, data, hora, notes, created_at, updated_at
        FROM contacts
        WHERE owner_matricula = $1
        ORDER BY list_name ASC, name ASC, created_at DESC
    `, [ownerMatricula]);

    return result.rows.map(mapContact);
}

async function createContact({ ownerMatricula, listName = 'Geral', name, phone, paciente = '', profissional = '', data = '', hora = '', notes = '' }) {
    const result = await postgres.query(`
        INSERT INTO contacts (owner_matricula, list_name, name, phone, paciente, profissional, data, hora, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, owner_matricula, list_name, name, phone, paciente, profissional, data, hora, notes, created_at, updated_at
    `, [ownerMatricula, listName, name, phone, paciente, profissional, data, hora, notes]);

    return mapContact(result.rows[0]);
}

async function updateContact({ id, ownerMatricula, listName = 'Geral', name, phone, paciente = '', profissional = '', data = '', hora = '', notes = '' }) {
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
        WHERE id = $1 AND owner_matricula = $2
        RETURNING id, owner_matricula, list_name, name, phone, paciente, profissional, data, hora, notes, created_at, updated_at
    `, [id, ownerMatricula, listName, name, phone, paciente, profissional, data, hora, notes]);

    return mapContact(result.rows[0]);
}

async function deleteContact(id, ownerMatricula) {
    await postgres.query('DELETE FROM contacts WHERE id = $1 AND owner_matricula = $2', [id, ownerMatricula]);
}

async function deleteContactList(ownerMatricula, listName) {
    const result = await postgres.query(`
        DELETE FROM contacts
        WHERE owner_matricula = $1 AND list_name = $2
    `, [ownerMatricula, listName]);

    return result.rowCount || 0;
}

module.exports = {
    listContacts,
    createContact,
    updateContact,
    deleteContact,
    deleteContactList,
};
