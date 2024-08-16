const mongoose = require('mongoose');

const hotNewImageSchema = new mongoose.Schema({
  id: Number,
  url: String,
  key: String,
  tag: {
    type: String,
    enum: ['hotnew', 'banner'],
    required: true,
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
    default: 0,
  },
  gender: {
    type: [String],
    default: ["MALE", "FEMALE"],
  }
});

const HotNew = mongoose.model('HotNew', hotNewImageSchema);
module.exports = HotNew;
