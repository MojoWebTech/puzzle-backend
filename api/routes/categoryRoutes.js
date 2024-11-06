
const express = require('express');
const router = express.Router();
const { cleanCategories, getCategories, getCategoryImages } = require('../controllers/categoryController');


router.get('/clean', cleanCategories);
router.get('/', getCategories);
router.get('/:categoryKey', getCategoryImages);


module.exports = router;
