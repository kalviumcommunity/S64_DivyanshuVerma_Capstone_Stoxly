const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
    // Password is required only for local authentication
    required: function() {
      return this.authMethod === 'local';
    },
    validate: {
      validator: function(v) {
        // Only validate password if authMethod is local
        if (this.authMethod === 'local') {
          return v && v.length >= 8;
        }
        return true;
      },
      message: 'Password is required and must be at least 8 characters long.'
    }
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

// Add a pre-save hook to ensure password is hashed for local users
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.authMethod === 'local') {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      next(error);
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;