const mongoose = require('mongoose');
const imageSchema = require('./Image');

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

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
