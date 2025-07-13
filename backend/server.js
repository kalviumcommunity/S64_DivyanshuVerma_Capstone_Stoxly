const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');
const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Portfolio = require('./models/portfolio');
const User = require('./models/user');
const connectDatabase = require('./database/db');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const http = require('http');
const setupWebSocketServer = require('./websocket');
const axios = require('axios');

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://stoxly.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://s64-divyanshuverma-capstone-stoxly.onrender.com/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        user = new User({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          authMethod: 'google',
          providerId: profile.id,
          profilePicture: profile.photos[0].value,
          isVerified: true
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

app.use(express.json());
app.use(cookieParser());

connectDatabase();

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
        let closingPrice = 0;
        if (parsedData.bars && Array.isArray(parsedData.bars) && parsedData.bars.length > 0) {
          closingPrice = parsedData.bars[0].c || 0;
        }
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

app.post('/api/users', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    
    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user with local authentication
    const user = new User({
      fullName,
      email,
      password,
      authMethod: 'local'
    });

    await user.save();

    // Return user data without password
    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      authMethod: user.authMethod
    };

    res.status(201).json(userData);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// JWT authentication middleware
function authenticateJWT(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  console.log('Attempting JWT verification...');

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT verification failed:', err.message);
        return res.sendStatus(403);
      }
      console.log('JWT verification successful. User:');
      req.user = user;
      next();
    });
  } else {
    console.log('No token found, sending 401');
    res.sendStatus(401);
  }
}

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email
    };

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set JWT as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: userData,
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Protect portfolio routes with JWT
app.post('/api/portfolio', authenticateJWT, async (req, res) => {
  try {
    const { symbol, date, quantity } = req.body;
    const userId = req.user.userId;

    if (!symbol || !date || !userId) {
      return res.status(400).json({ error: 'Symbol, date, and userId are required' });
    }

    // Robust quantity validation
    if (quantity === undefined || quantity === null || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    const quantityNum = Number(quantity);

    // Fetch closing price for purchase date
    const closingPrice = await fetchClosingPrice(symbol, date);

    // Fetch latest bar for current price
    let currentPrice = closingPrice;
    try {
      const latestBarUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&limit=1`;
      const latestBarRes = await axios.get(latestBarUrl, {
        headers: {
          'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
        },
      });
      if (latestBarRes.data && Array.isArray(latestBarRes.data.bars) && latestBarRes.data.bars.length > 0) {
        currentPrice = latestBarRes.data.bars[0].c || closingPrice;
      }
    } catch (err) {
      console.error('Error fetching latest bar for current price:', err.message);
    }

    const portfolioEntry = await Portfolio.findOneAndUpdate(
      { user: userId, symbol, date: new Date(date) },
      {
        user: userId,
        symbol,
        date: new Date(date),
        closingPrice,
        currentPrice,
        quantity: quantityNum,
        totalValue: closingPrice * quantityNum,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    res.json(portfolioEntry);
  } catch (error) {
    console.error('Error storing portfolio data:', error);
    res.status(500).json({ error: 'Failed to store portfolio data' });
  }
});

app.get('/api/portfolio', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    // Fetch the user and their portfolio
    const user = await User.findById(userId).select('profilePicture'); // Only select profilePicture
    const portfolio = await Portfolio.find({ user: userId }).sort({ date: -1 });

    // Combine portfolio data with user profile picture
    res.json({ portfolio, user: { profilePicture: user?.profilePicture } });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Update portfolio entry by symbol and date
app.put('/api/portfolio/:symbol/:date', authenticateJWT, async (req, res) => {
  try {
    const { symbol, date } = req.params;
    const { quantity, newDate } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Robust quantity validation
    if (quantity === undefined || quantity === null || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    const quantityNum = Number(quantity);
    const originalDate = new Date(date);
    const updatedDate = newDate ? new Date(newDate) : originalDate;
    const closingPrice = await fetchClosingPrice(symbol, updatedDate.toISOString().split('T')[0]);

    // If date is changed, check for duplicate
    if (newDate && new Date(newDate).getTime() !== new Date(date).getTime()) {
      const existing = await Portfolio.findOne({ user: userId, symbol, date: updatedDate });
      if (existing) {
        return res.status(400).json({ error: 'A holding with this symbol and date already exists.' });
      }
    }

    // Update the entry (including date if changed)
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { user: userId, symbol, date: originalDate },
      {
        quantity: quantityNum,
        closingPrice: closingPrice,
        totalValue: closingPrice * quantityNum,
        lastUpdated: new Date(),
        ...(newDate && new Date(newDate).getTime() !== new Date(date).getTime() ? { date: updatedDate } : {})
      },
      { new: true }
    );

    if (!updatedPortfolio) {
      return res.status(404).json({ error: 'Portfolio entry not found.' });
    }

    // Fetch and update the latest current price
    try {
      const latestBarUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&limit=1`;
      const latestBarRes = await axios.get(latestBarUrl, {
        headers: {
          'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
        },
      });
      let currentPrice = closingPrice;
      if (latestBarRes.data && Array.isArray(latestBarRes.data.bars) && latestBarRes.data.bars.length > 0) {
        currentPrice = latestBarRes.data.bars[0].c || closingPrice;
      }
      updatedPortfolio.currentPrice = currentPrice;
      await updatedPortfolio.save();
    } catch (err) {
      console.error('Error updating current price after edit:', err.message);
    }

    res.json({
      message: 'Portfolio updated successfully',
      stock: updatedPortfolio
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Failed to update portfolio' });
  }
});

app.delete('/api/portfolio/:symbol', authenticateJWT, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { date } = req.query;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const query = { user: userId, symbol };
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

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // Generate JWT for the authenticated user
    const token = jwt.sign(
      { userId: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Set JWT as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    // Redirect to frontend without token in URL
    res.redirect('https://stoxly.netlify.app/dashboard');
  }
);

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/news', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols query parameter is required' });
    }
    const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
    if (symbolList.length === 0) {
      return res.status(400).json({ error: 'No valid symbols provided' });
    }
    // Fetch more news for all symbols at once
    const newsUrl = `https://data.alpaca.markets/v1beta1/news?symbols=${symbolList.join(',')}&limit=20`;
    const response = await axios.get(newsUrl, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
    });
    // Only include news for the requested symbols, and only those with a large image
    const grouped = {};
    for (const symbol of symbolList) {
      grouped[symbol] = [];
    }
    for (const article of response.data.news || []) {
      const hasLargeImage = Array.isArray(article.images) && article.images.some(img => img.size === 'large');
      if (!hasLargeImage) continue;
      for (const symbol of symbolList) {
        if (article.symbols.includes(symbol) && grouped[symbol].length < 5) {
          grouped[symbol].push(article);
        }
      }
    }
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching news:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.get('/api/asset-names', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols query parameter is required' });
    }
    const url = `https://paper-api.alpaca.markets/v2/assets?symbols=${symbols}`;
    const response = await axios.get(url, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
    });
    // Map symbol to name
    const mapping = {};
    for (const asset of response.data) {
      mapping[asset.symbol] = asset.name;
    }
    res.json(mapping);
  } catch (error) {
    console.error('Error fetching asset names:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch asset names' });
  }
});

// Add latest bars endpoint
app.get('/api/market/latest-bars', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols query parameter is required' });
    }

    const url = `https://data.alpaca.markets/v2/stocks/bars/latest?symbols=${symbols}`;
    const response = await axios.get(url, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
    });

    // FIX: Use response.data.bars
    const latestBars = {};
    for (const [symbol, data] of Object.entries(response.data.bars)) {
      latestBars[symbol] = {
        c: data.c,
        h: data.h,
        l: data.l,
        o: data.o,
        t: data.t,
        v: data.v
      };
    }

    res.json(latestBars);
  } catch (error) {
    console.error('Error fetching latest bars:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch latest bars' });
  }
});

// Get market movers
app.get('/api/market/market-movers', async (req, res) => {
  try {
    // Fetch top gainers and losers from Alpaca
    const response = await axios.get('https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=3', {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
      }
    });
    

    // Get all unique symbols from both gainers and losers
    const allSymbols = [
      ...response.data.gainers.map(stock => stock.symbol),
      ...response.data.losers.map(stock => stock.symbol)
    ];
    

    // Fetch asset names for all symbols
    const assetNamesResponse = await axios.get(`https://paper-api.alpaca.markets/v2/assets?symbols=${allSymbols.join(',')}`, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
    });
    

    // Create a mapping of symbol to name
    const symbolToName = {};
    assetNamesResponse.data.forEach(asset => {
      symbolToName[asset.symbol] = asset.name;
    });

    // Process the response to get top 3 gainers and losers with names
    const gainers = response.data.gainers.map(stock => ({
      symbol: stock.symbol,
      name: symbolToName[stock.symbol] || stock.symbol,
      change: stock.change
    }));

    const losers = response.data.losers.map(stock => ({
      symbol: stock.symbol,
      name: symbolToName[stock.symbol] || stock.symbol,
      change: stock.change
    }));

    const result = { gainers, losers };
    res.json(result);
  } catch (error) {
    console.error('Error fetching market movers:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch market movers' });
  }
});

// Utility to get previous trading day (skipping weekends)
function getPreviousTradingDay(date = new Date()) {
  let d = new Date(date);
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6); // 0 = Sunday, 6 = Saturday
  return d.toISOString().split('T')[0];
}

// Endpoint to get yesterday's close for multiple symbols
app.get('/api/market/yesterday-close', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols query parameter is required' });
    }
    const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
    if (symbolList.length === 0) {
      return res.status(400).json({ error: 'No valid symbols provided' });
    }
    // Fetch the last 5 trading days of data to ensure we get a close price
    const today = new Date().toISOString().split('T')[0];
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5); // Go back 5 calendar days
    const formattedFiveDaysAgo = fiveDaysAgo.toISOString().split('T')[0];

    const url = `https://data.alpaca.markets/v2/stocks/bars?symbols=${symbolList.join(',')}&timeframe=1Day&start=${formattedFiveDaysAgo}&end=${today}&feed=iex`;
    const response = await axios.get(url, {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
    });
    const closes = {};
    for (const symbol of symbolList) {
      // Find the most recent closing price from the returned bars
      const bars = response.data.bars?.[symbol] || [];
      const mostRecentBar = bars.length > 0 ? bars[bars.length - 1] : null;
      closes[symbol] = mostRecentBar ? mostRecentBar.c : null;
    }
    res.json(closes);
  } catch (error) {
    console.error('Error fetching yesterday close:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch yesterday close' });
  }
});

// Market Calendar endpoint
app.get('/api/market/calendar', async (req, res) => {
  try {
    const response = await axios.get('https://paper-api.alpaca.markets/v2/calendar', {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching market calendar:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch market calendar' });
  }
});

// Endpoint to proxy user profile pictures from Google
app.get('/api/user/profile-picture', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer' // Get response as binary data
    });

    // Set appropriate content type header
    res.setHeader('Content-Type', response.headers['content-type']);
    // Cache the image in the browser for a reasonable time (e.g., 1 hour)
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(response.data); // Send the image data
  } catch (error) {
    console.error('Error fetching profile picture from Google:', error.message);
    // Respond with a 404 for not found or 500 for other errors
    if (error.response && error.response.status === 404) {
       res.status(404).json({ error: 'Profile picture not found' });
    } else {
       res.status(500).json({ error: 'Failed to fetch profile picture' });
    }
  }
});

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
  setupWebSocketServer(server);
  server.listen(PORT, () => {
    console.log(`Server and WebSocket running on port ${PORT}`);
  });
}

// For testing purposes
if (process.env.NODE_ENV === 'test') {
  app.listen = function() {
    return server;
  };
}

module.exports = { app, server }; 