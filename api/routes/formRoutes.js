const express = require('express');
const router = express.Router();
const { serveForm, updateNotification } = require('../controllers/formController');

router.get('/form', serveForm);
router.post('/submit-form', express.urlencoded({ extended: true }), updateNotification);


module.exports = router;
