const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    default: 0
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

// Create a compound index on symbol and date
portfolioSchema.index({ symbol: 1, date: 1 }, { unique: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;

