const path = require('path');

const rootDirectory = path.resolve(__dirname, '../..');
const dataDirectory = path.join(rootDirectory, 'data');

function getDatabaseConfig() {
    if (process.env.DATABASE_URL) {
        return {
            connectionString: String(process.env.DATABASE_URL),
            ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
        };
    }

    return {
        host: String(process.env.PGHOST || 'localhost'),
        port: Number(process.env.PGPORT) || 5432,
        database: String(process.env.PGDATABASE || 'bulk_whats'),
        user: String(process.env.PGUSER || 'postgres'),
        password: String(process.env.PGPASSWORD || ''),
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    };
}

module.exports = {
    port: Number(process.env.PORT) || 3000,
    authorizedUsersUrl:
        process.env.AUTHORIZED_USERS_URL ||
        'https://script.google.com/macros/s/AKfycbzfxn8ntzKyAKlWNAtvOUBA9tUpeSVlSfQSLP5O9gi3M8cd7mxsDM8CTtUs6eLhD7CkJw/exec',
    whatsapp: {
        countryCode: '55',
        suffix: '@c.us',
    },
    cache: {
        authorizedUsersTtlMs: 1000 * 60 * 2,
    },
    rootDirectory,
    dataDirectory,
    databaseFile: path.join(dataDirectory, 'db.json'),
    uploadsDirectory: path.join(rootDirectory, 'uploads'),
    frontendDirectory: path.join(rootDirectory, '../frontend/dist'),
    authorizedUsersFile: path.join(rootDirectory, 'src/modules/auth/authorizedUsers.json'),
    whatsappAuthDirectory: path.join(dataDirectory, 'whatsapp_auth_data'),
    postgres: getDatabaseConfig(),
    seed: {
        adminMatricula: String(process.env.ADMIN_MATRICULA || 'fcrs2245'),
        adminExpirationDate: String(process.env.ADMIN_EXPIRATION_DATE || '2099-12-31'),
    },
};
