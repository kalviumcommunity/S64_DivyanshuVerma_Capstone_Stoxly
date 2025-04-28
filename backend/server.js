const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');
const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const Portfolio = require('./models/portfolio');
const User = require('./models/user');
const connectDatabase = require('./database/db');

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));


app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));


app.use(passport.initialize());
app.use(passport.session());


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


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.use(express.json());

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
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      fullName,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});


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

    res.json({
      user: userData
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/portfolio', async (req, res) => {
  try {
    const { symbol, date, quantity, userId } = req.body;

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

app.get('/api/portfolio', async (req, res) => {
  try {
    const { userId } = req.query;
    
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

app.put('/api/portfolio/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { quantity, date, userId } = req.body;

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

app.delete('/api/portfolio/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { date, userId } = req.query;

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
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('http://localhost:5173/dashboard');
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 