const express = require('express');
const router = express.Router();
const { handleFaceSwap } = require('../controllers/swapController');

router.post('/', handleFaceSwap);

module.exports = router;
