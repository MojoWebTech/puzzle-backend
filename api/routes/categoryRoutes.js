
const express = require('express');
const router = express.Router();
const { cleanCategories, getFirstData, getCategoryImages } = require('../controllers/categoryController');


router.get('/clean', cleanCategories);
router.get('/', getFirstData);
router.get('/:categoryKey', getCategoryImages);


module.exports = router;
