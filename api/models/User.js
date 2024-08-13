const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  id: {
    type: String,
    required: true,
    unique: true,
  },
  asid: {
    type: String,
    required: true,
    unique: true,
  },
  photo: {
    type: String,
    default: '',
  }
});

// Pre-save hook to hash passwords if they are provided or changed
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the user model
const User = mongoose.model('User', userSchema);

module.exports = User;
