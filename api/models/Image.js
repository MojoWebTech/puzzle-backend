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
  },
  swap_count: {
    type: Number,
    default: 0
  }
});

// Export the image schema
module.exports = imageSchema;
