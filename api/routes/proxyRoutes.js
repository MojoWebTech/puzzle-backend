const express = require('express');
const router = express.Router();
const { convertImageToBase64 } = require('../controllers/proxyController');

router.post('/convert-image', convertImageToBase64);

module.exports = router;
