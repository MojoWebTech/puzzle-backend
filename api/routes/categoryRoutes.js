const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

// GET to clean category data
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

// GET to fetch all categories with 10 images from each category
router.get('/', async (req, res) => {
  try {
    // Fetch categories and select specific fields along with 10 images
    const categories = await Category.find()
      .select('themeName coverImage categoryKey gender images')
      .slice('images', 1); // Limit images to 10 per category

      // Fetch additional images with tag "hotnew"
      const hotnew = await Category.aggregate([
        { $unwind: "$images" },
        { $match: { "images.tag": "hotnew" } },
        { $group: { _id: "$categoryKey", images: { $push: "$images" } } },
        { $limit: 10 } // Adjust the limit as needed
      ]);

      // Fetch additional images with tag "banner"
      const banner = await Category.aggregate([
        { $unwind: "$images" },
        { $match: { "images.tag": "banner" } },
        { $group: { _id: "$categoryKey", images: { $push: "$images" } } },
        { $limit: 10 } // Adjust the limit as needed
      ]);

      // Construct the response object
      const response = {
        categories: categories, // Main categories with 10 images each
        hotnew: hotnew,         // Images tagged as "hotnew"
        banner: banner          // Images tagged as "banner"
      };

      res.status(200).json(response);

    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});
  
// GET to fetch images of a specific category by key with pagination
router.get('/:categoryKey', async (req, res) => {
  const { categoryKey } = req.params;
  const { skip = 0, limit = 10 } = req.query; // Get skip and limit values from query params, default to skip 0 and limit 10

  try {
    // Find the category by its key
    const category = await Category.findOne({ categoryKey });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Apply skip and limit to the images array
    const images = category.images.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.status(200).json(images);
  } catch (error) {
    console.error('Error fetching category images:', error);
    res.status(500).json({ error: 'Failed to fetch category images.' });
  }
});
  

module.exports = router;
