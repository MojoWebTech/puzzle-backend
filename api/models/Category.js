const mongoose = require('mongoose');
const imageSchema = require('./Image');

// Define the category schema
const categorySchema = new mongoose.Schema({
  themeName: String,
  coverImage: String,
  images: [imageSchema],
  categoryKey: String, 
  gender: {
    type: [String],
    default: ["MALE", "FEMALE"], 
  },
});

// Create the Category model using the schema
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
