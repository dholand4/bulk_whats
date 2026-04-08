const { Router } = require('express');

const uploadController = require('../../controllers/uploadController');
const { multiMediaUpload } = require('../../modules/uploads/uploadMiddleware');

const router = Router();

router.post('/upload', multiMediaUpload, uploadController.uploadMedia);

module.exports = router;
