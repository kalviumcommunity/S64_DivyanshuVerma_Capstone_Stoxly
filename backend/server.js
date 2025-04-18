const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');
// const mongoose = require('mongoose');
const Portfolio = require('./models/portfolio');
const connectDatabase= require('./database/db')

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

connectDatabase()

const fetchClosingPrice = async (symbol, date) => {
  const options = {
    method: 'GET',
    hostname: 'data.alpaca.markets',
    path: `/v2/stocks/${symbol}/bars?timeframe=1Day&start=${date}&end=${date}&limit=1`,
    headers: {
      accept: 'application/json',
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
    },
    rejectUnauthorized: false
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      const chunks = [];

      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        const body = Buffer.concat(chunks);
        const parsedData = JSON.parse(body.toString());
        const closingPrice = parsedData.bars[0]?.c || 0;
        resolve(closingPrice);
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
};


app.get('/api/stock/price', async (req, res) => {
  try {
    const { symbol, date } = req.query;

    if (!symbol || !date) {
      return res.status(400).json({
        error: 'Symbol and date are required query parameters'
      });
    }

    const closingPrice = await fetchClosingPrice(symbol, date);
    res.json({ symbol, date, closingPrice });
  } catch (error) {
    console.error('Error fetching stock price:', error);
    res.status(500).json({ error: 'Failed to fetch stock price' });
  }
});


app.post('/api/stock/price', async (req, res) => {
  try {
    const { symbol, date, quantity = 0 } = req.body;

    if (!symbol || !date) {
      return res.status(400).json({
        error: 'Symbol and date are required in the request body'
      });
    }

    const closingPrice = await fetchClosingPrice(symbol, date);
    

    const portfolioEntry = await Portfolio.findOneAndUpdate(
      { symbol, date: new Date(date) },
      {
        symbol,
        date: new Date(date),
        closingPrice,
        quantity: Number(quantity),
        totalValue: closingPrice * Number(quantity),
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Stock data stored successfully',
      data: portfolioEntry
    });
  } catch (error) {
    console.error('Error storing stock data:', error);
    res.status(500).json({ error: 'Failed to store stock data' });
  }
});


app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = await Portfolio.find().sort({ date: -1 });
    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});


app.put('/api/portfolio/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { quantity, date } = req.body;

    if (!quantity || isNaN(quantity)) {
      return res.status(400).json({
        error: 'Valid quantity is required'
      });
    }

    // Get current price for the stock
    const currentDate = date || new Date().toISOString().split('T')[0];
    const closingPrice = await fetchClosingPrice(symbol, currentDate);

    // Update portfolio
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { symbol, date: new Date(currentDate) },
      {
        quantity: Number(quantity),
        closingPrice: closingPrice,
        totalValue: closingPrice * Number(quantity),
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Portfolio updated successfully',
      stock: updatedPortfolio
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});


app.delete('/api/portfolio/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { date } = req.query;

    const query = { symbol };
    if (date) {
      query.date = new Date(date);
    }

    const result = await Portfolio.deleteMany(query);
    
    res.json({
      message: 'Stock(s) removed successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error removing stock:', error);
    res.status(500).json({ error: 'Failed to remove stock' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 