const { Router } = require('express');

const messageController = require('../../controllers/messageController');

const router = Router();

router.post('/send-message', messageController.sendMessage);
router.post('/stop-message', messageController.stopMessage);

module.exports = router;
