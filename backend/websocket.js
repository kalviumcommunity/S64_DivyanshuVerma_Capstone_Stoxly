const WebSocket = require('ws');
const EventEmitter = require('events');
const Portfolio = require('./models/portfolio');
require('dotenv').config();


function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

class AlpacaWebSocket extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.isConnected = false;
    this.subscriptions = new Set();
    this.priceCache = new Map(); 
    this.updateQueue = new Map(); 
  }

  connect() {
    this.socket = new WebSocket(process.env.ALPACA_WSS_URL);

    this.socket.on('open', () => {
      console.log('Connected to Alpaca WebSocket');
      this.isConnected = true;
      // Authenticate with Alpaca
      const authMsg = {
        action: 'auth',
        key: process.env.ALPACA_API_KEY,
        secret: process.env.ALPACA_SECRET_KEY
      };
      this.socket.send(JSON.stringify(authMsg));
    });

    this.socket.on('message', async (event) => {
      try {
        const data = JSON.parse(event);
        this.emit('data', data);
        if (data[0] && data[0].msg === 'authenticated') {
          this.updateSubscriptions();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.socket.on('close', () => {
      console.log('Disconnected from Alpaca WebSocket');
      this.isConnected = false;
      setTimeout(() => this.connect(), 5000);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  updateSubscriptions() {
    if (!this.isConnected) return;
    if (this.subscriptions.size === 0) return;
    const subscribeMsg = {
      action: 'subscribe',
      quotes: Array.from(this.subscriptions)
    };
    this.socket.send(JSON.stringify(subscribeMsg));
    console.log('Subscribed to symbols:', Array.from(this.subscriptions));
  }

  subscribeToSymbols(symbols) {
    if (!this.isConnected) return;
    symbols.forEach(symbol => this.subscriptions.add(symbol));
    this.updateSubscriptions();
  }

  unsubscribeFromSymbols(symbols) {
    if (!this.isConnected) return;
    symbols.forEach(symbol => this.subscriptions.delete(symbol));
    const unsubscribeMsg = {
      action: 'unsubscribe',
      quotes: symbols
    };
    this.socket.send(JSON.stringify(unsubscribeMsg));
    console.log('Unsubscribed from symbols:', symbols);
  }

 
  getLatestPrice(symbol) {
    return this.priceCache.get(symbol);
  }


  queuePriceUpdate(symbol, price) {
    this.priceCache.set(symbol, price);
    this.updateQueue.set(symbol, price);
  }

  // Add method to process queued updates
  async processQueuedUpdates() {
    if (this.updateQueue.size === 0) return;

    const updates = Array.from(this.updateQueue.entries()).map(([symbol, price]) => ({
      updateOne: {
        filter: { symbol },
        update: {
          $set: {
            currentPrice: price,
            lastUpdated: new Date()
          }
        }
      }
    }));

    try {
      await Portfolio.bulkWrite(updates);
      this.updateQueue.clear();
    } catch (error) {
      console.error('Error processing queued updates:', error);
    }
  }
}

const alpacaWS = new AlpacaWebSocket();

const debouncedProcessUpdates = debounce(() => {
  alpacaWS.processQueuedUpdates();
}, 5000); // Process updates every 5 seconds

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  alpacaWS.connect();

  wss.on('connection', (ws) => {
    console.log('Frontend client connected');

    const forwardData = async (data) => {
      if (ws.readyState === WebSocket.OPEN && Array.isArray(data)) {
        data.forEach(async (quote) => {
          if (quote.T === 'q') {
            const price = parseFloat(quote.p) || parseFloat(quote.bp);
            const symbol = quote.S;
        
            alpacaWS.queuePriceUpdate(symbol, price);
            
            
            debouncedProcessUpdates();

      
            const transformed = {
              type: 'quote',
              symbol: symbol,
              price: price,
              bid: parseFloat(quote.bp),
              ask: parseFloat(quote.ap),
              bidSize: parseInt(quote.bs),
              askSize: parseInt(quote.as),
              timestamp: quote.t
            };
            ws.send(JSON.stringify(transformed));
            
          }
        });
      }
    };

    alpacaWS.on('data', forwardData);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.action === 'subscribe' && Array.isArray(data.symbols)) {
          alpacaWS.subscribeToSymbols(data.symbols);
        } else if (data.action === 'unsubscribe' && Array.isArray(data.symbols)) {
          alpacaWS.unsubscribeFromSymbols(data.symbols);
        }
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });

    ws.on('close', () => {
      alpacaWS.removeListener('data', forwardData);
      console.log('Frontend client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

module.exports = setupWebSocketServer; 