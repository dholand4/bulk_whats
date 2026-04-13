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
    whatsapp: {
        countryCode: '55',
        suffix: '@c.us',
    },
    rootDirectory,
    dataDirectory,
    uploadsDirectory: path.join(rootDirectory, 'uploads'),
    frontendDirectory: path.join(rootDirectory, '../frontend/dist'),
    whatsappAuthDirectory: path.join(dataDirectory, 'whatsapp_auth_data'),
    postgres: getDatabaseConfig(),
};
