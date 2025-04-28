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

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
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
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
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

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const quantityNum = Number(quantity);
    if (isNaN(quantityNum)) {
      return res.status(400).json({ error: 'Quantity must be a valid number' });
    }

    const closingPrice = await fetchClosingPrice(symbol, date);

    const portfolioEntry = await Portfolio.findOneAndUpdate(
      { user: userId, symbol, date: new Date(date) },
      {
        user: userId,
        symbol,
        date: new Date(date),
        closingPrice,
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
    const portfolio = await Portfolio.find({ user: userId }).sort({ date: -1 });
    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

app.put('/api/portfolio/:symbol', authenticateJWT, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { quantity, date } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const quantityNum = Number(quantity);
    if (isNaN(quantityNum)) {
      return res.status(400).json({ error: 'Quantity must be a valid number' });
    }

    const currentDate = date || new Date().toISOString().split('T')[0];
    const closingPrice = await fetchClosingPrice(symbol, currentDate);

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { user: userId, symbol, date: new Date(currentDate) },
      {
        quantity: quantityNum,
        closingPrice: closingPrice,
        totalValue: closingPrice * quantityNum,
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
    // You can pass user info as well, but avoid sensitive data
    const userData = encodeURIComponent(JSON.stringify({
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email
    }));
    // Redirect to frontend with token and user data in query params
    res.redirect(`http://localhost:5173/dashboard?token=${token}&user=${userData}`);
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 