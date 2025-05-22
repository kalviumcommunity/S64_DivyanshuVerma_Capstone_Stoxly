const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  date: {
    type: Date,
    required: true
  },
  closingPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    default: null
  },
  quantity: {
    type: Number,
    min: 1,
    default: 1
  },
  totalValue: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index on user, symbol and date
portfolioSchema.index({ user: 1, symbol: 1, date: 1 }, { unique: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;

