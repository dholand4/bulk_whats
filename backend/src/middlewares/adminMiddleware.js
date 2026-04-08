function adminMiddleware(req, res, next) {
    if (req.auth?.role !== 'admin') {
        res.status(403).json({
            message: 'Acesso restrito ao perfil administrador.',
        });
        return;
    }

    next();
}

module.exports = adminMiddleware;
