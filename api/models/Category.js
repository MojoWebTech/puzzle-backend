const mongoose = require('mongoose');

// Define the image schema with an additional tag field
const imageSchema = new mongoose.Schema({
  id: Number,
  url: String,
  key: String,
  tag: {
    type: String,
    default: "", // Default value is an empty string
  },
  theme_id: {
    type: String, // Stores the theme_id or categoryKey
    required: true, // Ensure that each image has an associated categoryKey
  }
});

// Define the category schema
const categorySchema = new mongoose.Schema({
  themeName: String,
  coverImage: String,
  images: [imageSchema], // Embed the imageSchema
  categoryKey: String, // Field to store the key as you did in uploadedData
  gender: {
    type: [String],
    default: ["MALE", "FEMALE"], // Default value for gender array
  },
});

// Create the Category model using the schema
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
