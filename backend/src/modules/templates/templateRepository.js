const postgres = require('../storage/postgres');

function mapVariant(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        templateId: row.template_id,
        body: row.body,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapTemplate(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        ownerEmail: row.owner_email,
        name: row.name,
        description: row.description,
        active: row.active,
        variants: Array.isArray(row.variants) ? row.variants : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function listTemplates(ownerEmail) {
    const result = await postgres.query(`
        SELECT
            template.id,
            template.owner_email,
            template.name,
            template.description,
            template.active,
            template.created_at,
            template.updated_at,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', variant.id,
                        'templateId', variant.template_id,
                        'body', variant.body,
                        'active', variant.active,
                        'createdAt', variant.created_at,
                        'updatedAt', variant.updated_at
                    )
                    ORDER BY variant.created_at ASC
                ) FILTER (WHERE variant.id IS NOT NULL),
                '[]'::json
            ) AS variants
        FROM message_templates template
        LEFT JOIN message_template_variants variant ON variant.template_id = template.id
        WHERE template.owner_email = $1
        GROUP BY template.id
        ORDER BY template.updated_at DESC, template.name ASC
    `, [ownerEmail]);

    return result.rows.map(mapTemplate);
}

async function getTemplate(templateId, ownerEmail) {
    const templates = await listTemplates(ownerEmail);
    return templates.find((template) => template.id === templateId) || null;
}

async function createTemplate({ ownerEmail, name, description = '', active = true }) {
    const result = await postgres.query(`
        INSERT INTO message_templates (owner_email, name, description, active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, owner_email, name, description, active, created_at, updated_at
    `, [ownerEmail, name, description, active]);

    return {
        ...mapTemplate(result.rows[0]),
        variants: [],
    };
}

async function updateTemplate({ id, ownerEmail, name, description = '', active = true }) {
    const result = await postgres.query(`
        UPDATE message_templates
        SET name = $3, description = $4, active = $5, updated_at = NOW()
        WHERE id = $1 AND owner_email = $2
        RETURNING id, owner_email, name, description, active, created_at, updated_at
    `, [id, ownerEmail, name, description, active]);

    const template = mapTemplate(result.rows[0]);
    if (!template) {
        return null;
    }

    return getTemplate(template.id, ownerEmail);
}

async function deleteTemplate(id, ownerEmail) {
    await postgres.query('DELETE FROM message_templates WHERE id = $1 AND owner_email = $2', [id, ownerEmail]);
}

async function createVariant({ templateId, ownerEmail, body, active = true }) {
    const result = await postgres.query(`
        INSERT INTO message_template_variants (template_id, body, active)
        SELECT id, $3, $4
        FROM message_templates
        WHERE id = $1 AND owner_email = $2
        RETURNING id, template_id, body, active, created_at, updated_at
    `, [templateId, ownerEmail, body, active]);

    return mapVariant(result.rows[0]);
}

async function updateVariant({ templateId, variantId, ownerEmail, body, active = true }) {
    const result = await postgres.query(`
        UPDATE message_template_variants variant
        SET body = $4, active = $5, updated_at = NOW()
        FROM message_templates template
        WHERE
            variant.id = $1
            AND variant.template_id = $2
            AND template.id = variant.template_id
            AND template.owner_email = $3
        RETURNING variant.id, variant.template_id, variant.body, variant.active, variant.created_at, variant.updated_at
    `, [variantId, templateId, ownerEmail, body, active]);

    return mapVariant(result.rows[0]);
}

async function deleteVariant(templateId, variantId, ownerEmail) {
    await postgres.query(`
        DELETE FROM message_template_variants variant
        USING message_templates template
        WHERE
            variant.id = $1
            AND variant.template_id = $2
            AND template.id = variant.template_id
            AND template.owner_email = $3
    `, [variantId, templateId, ownerEmail]);
}

async function touchTemplate(templateId, ownerEmail) {
    await postgres.query(`
        UPDATE message_templates
        SET updated_at = NOW()
        WHERE id = $1 AND owner_email = $2
    `, [templateId, ownerEmail]);
}

module.exports = {
    listTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createVariant,
    updateVariant,
    deleteVariant,
    touchTemplate,
};
