const { Router } = require('express');

const authController = require('../../controllers/authController');

const router = Router();

router.post('/authenticate', authController.authenticate);
router.get('/get-qr/:matricula', authController.getQrCode);

module.exports = router;
