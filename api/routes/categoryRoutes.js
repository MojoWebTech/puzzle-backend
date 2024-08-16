const express = require('express');
const Category = require('../models/Category');
const HotNew = require('../models/HotNew');
const router = express.Router();
require('dotenv').config()

router.get('/clean', async (req, res) => {
  try {
    const categories = await Category.find().select('themeName coverImage categoryKey gender images');

    for (const category of categories) {
      const seenUrls = new Set();
      const uniqueImages = [];

      category.images.forEach(image => {
        if (!seenUrls.has(image.url)) {
          seenUrls.add(image.url);
          uniqueImages.push(image);
        }
      });

      // Update the category with the unique images
      category.images = uniqueImages;
      await category.save();
    }

    res.status(200).json({ message: 'Duplicate images removed successfully.' });
  } catch (error) {
    console.error('Error cleaning categories:', error);
    res.status(500).json({ error: 'Failed to clean categories.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { name } = req.query;
    if(!name)
    {
      return res.status(400).json({ error: 'Name is required' });
    }

    const genderResponse = await fetch(`https://v2.namsor.com/NamSorAPIv2/api2/json/genderFull/${name}`, {
      "method": "GET",
      "headers": {
        "X-API-KEY": process.env.GENDER_API_KEY,
        "Accept": "application/json"
      }
    });
    
    if (!genderResponse.ok){
      console.error("Error in gender api response:", genderResponse.status, genderResponse);
    }

    const data = await genderResponse.json();
    const gender = data?.likelyGender?.toUpperCase() || "MALE";

    console.log(gender);
      
    const categories = await Category.find()
      .select('themeName coverImage categoryKey gender images')
      .slice('images', 1);

    const sameCategories = [];
    const differentCategories = [];

    categories.forEach(category => {
      if (category.gender.includes(gender)) {
        sameCategories.push(category);
      } 
      else {
        differentCategories.push(category);
      }
    });

    const sortedCategories = [...sameCategories, ...differentCategories];
  
    const hotnew = await HotNew.find({
      tag: 'hotnew',
      gender: { $in: [gender] },
    });

    const banner = await HotNew.find({
      tag: 'banner',
      gender: { $in: [gender] },
    });


    const response = {
      categories: sortedCategories, 
      hotnew: hotnew,
      banner: banner
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

router.get('/:categoryKey', async (req, res) => {
  const { categoryKey } = req.params;
  const { skip = 0, limit = 10 } = req.query; 

  try {
    const category = await Category.findOne({ categoryKey });

    console.log(categoryKey);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const images = category.images.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.status(200).json(images);
  } catch (error) {
    console.error('Error fetching category images:', error);
    res.status(500).json({ error: 'Failed to fetch category images.' });
  }
});
  

module.exports = router;
