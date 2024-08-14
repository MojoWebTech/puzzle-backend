
const mongoose = require('mongoose');
const imageSchema = require('./Image'); 


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  asid: {
    type: String,
    required: true,
    unique: true,
  },
  image_url: {
    type: String,
    default: '',
  },
  images: [imageSchema], 
});

const User = mongoose.model('User', userSchema);

module.exports = User;
