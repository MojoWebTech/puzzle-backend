const mongoose = require('mongoose');

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

module.exports = imageSchema;
