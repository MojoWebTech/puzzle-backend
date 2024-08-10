const mongoose = require('mongoose');

// Define the image schema with an additional tag field
const imageSchema = new mongoose.Schema({
  id: Number,
  url: String,
  key: String,
  tag: {
    type: String,
    default: "", 
  },
  theme_id: {
    type: String, 
    required: true, 
  },
  face_count: {
    type: Number,
  }
});

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
