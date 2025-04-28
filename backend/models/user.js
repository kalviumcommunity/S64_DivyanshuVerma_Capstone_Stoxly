const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    sparse: true
  },
  authMethod: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  providerId: {
    type: String,
    sparse: true 
  },
  profilePicture: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;