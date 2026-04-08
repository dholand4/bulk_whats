function notFoundMiddleware(req, res) {
    res.status(404).json({ message: 'Rota nao encontrada.' });
}

module.exports = notFoundMiddleware;
