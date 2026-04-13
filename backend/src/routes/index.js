const { Router } = require('express');

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const contactController = require('../controllers/contactController');
const deviceController = require('../controllers/deviceController');
const queueController = require('../controllers/queueController');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { multiMediaUpload } = require('../modules/uploads/uploadMiddleware');

const router = Router();

router.post('/api/auth/login', authController.login);

router.use('/api', authMiddleware);

router.get('/api/auth/me', authController.me);
router.post('/api/auth/change-password', authController.changePassword);
router.post('/api/auth/logout', authController.logout);

router.get('/api/contacts', contactController.listContacts);
router.post('/api/contacts', contactController.createContact);
router.put('/api/contacts/:id', contactController.updateContact);
router.delete('/api/contacts/:id', contactController.deleteContact);
router.delete('/api/contact-lists/:listName', contactController.deleteContactList);
router.post('/api/contacts/import', contactController.importContacts);

router.get('/api/dashboard/summary', queueController.summary);

router.get('/api/devices', deviceController.listDevices);
router.post('/api/devices', deviceController.createDevice);
router.delete('/api/devices/:id', deviceController.removeDevice);
router.post('/api/devices/:id/connect', deviceController.connectDevice);
router.post('/api/devices/:id/reconnect', deviceController.reconnectDevice);
router.post('/api/devices/:id/disconnect', deviceController.disconnectDevice);
router.get('/api/devices/:id/auth', deviceController.getDeviceAuth);
router.post('/api/devices/:id/pairing-code', deviceController.generatePairingCode);

router.get('/api/queue', queueController.listQueue);
router.post('/api/queue', queueController.enqueue);
router.post('/api/queue/:id/cancel', queueController.cancelItem);
router.post('/api/queue/:id/reprocess', queueController.reprocessItem);
router.delete('/api/queue/:id', queueController.deleteQueueItem);

router.get('/api/history', queueController.listHistory);
router.post('/api/messages/send', queueController.sendNow);

router.post('/api/upload', multiMediaUpload, uploadController.uploadMedia);
router.get('/api/files/:id', uploadController.downloadFile);

router.get('/api/admin/users', adminMiddleware, adminController.listUsers);
router.post('/api/admin/users', adminMiddleware, adminController.saveUser);
router.put('/api/admin/users/:email', adminMiddleware, adminController.saveUser);
router.delete('/api/admin/users/:email', adminMiddleware, adminController.removeUser);

module.exports = router;
