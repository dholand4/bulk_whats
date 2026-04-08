const { createApp } = require('./app');
const { port } = require('./config');
const clientManager = require('./modules/whatsapp/clientManager');
const queueService = require('./modules/queue/queueService');
const database = require('./modules/storage/database');
const fileBackfillService = require('./modules/storage/fileBackfillService');
const userRepository = require('./modules/users/userRepository');

process.on('unhandledRejection', (error) => {
    console.error('Promessa rejeitada sem tratamento:', error);
});

async function startServer() {
    const legacyState = await database.bootstrap();
    await userRepository.bootstrapUsersFromLegacy(legacyState);
    await fileBackfillService.backfillAttachments();

    const app = createApp();
    app.listen(port, '0.0.0.0', async () => {
        console.log(`Servidor rodando na porta ${port}`);

        queueService.startWorker();
        await clientManager.bootstrapPersistedDevices();
    });
}

startServer().catch((error) => {
    console.error('Falha ao iniciar o servidor:', error.message);
    process.exit(1);
});
