function errorHandlerMiddleware(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const statusCode = error.statusCode || 500;
    const payload = error.body || { message: error.message || 'Erro interno do servidor.' };

    if (statusCode >= 500) {
        console.error('Erro nao tratado:', error);
    }

    return res.status(statusCode).json(payload);
}

module.exports = errorHandlerMiddleware;
