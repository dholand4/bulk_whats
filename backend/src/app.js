const express = require('express');
const cors = require('cors');
const path = require('path');

const { uploadsDirectory, frontendDirectory } = require('./config');
const routes = require('./routes');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const errorHandlerMiddleware = require('./middlewares/errorHandlerMiddleware');

function createApp() {
    const app = express();

    app.use(cors({ origin: '*' }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(uploadsDirectory));
    app.use(routes);
    app.use('/', express.static(frontendDirectory));
    app.get('*', (request, response, next) => {
        if (request.path.startsWith('/api') || request.path.startsWith('/uploads')) {
            next();
            return;
        }

        response.sendFile(path.join(frontendDirectory, 'index.html'));
    });
    app.use(notFoundMiddleware);
    app.use(errorHandlerMiddleware);

    return app;
}

module.exports = { createApp };
