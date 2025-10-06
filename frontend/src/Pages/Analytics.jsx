import React, { useState, useEffect } from 'react';
import './Analytics.css';
import { FaChartLine, FaInfoCircle } from 'react-icons/fa';

const Analytics = ({ holdings }) => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHoldings, setFilteredHoldings] = useState([]);

  useEffect(() => {
    if (holdings && holdings.length > 0 && !selectedStock) {
      setSelectedStock(holdings[0]);
    }
  }, [holdings, selectedStock]);

  useEffect(() => {
    if (holdings) {
      const filtered = holdings.filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHoldings(filtered);
    } else {
      setFilteredHoldings([]);
    }
  }, [searchQuery, holdings]);

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
  };

  // Calculate stock statistics
  const calculateStats = (stock) => {
    if (!stock) return null;

    const purchasePrice = stock.closingPrice || 0;
    const currentPrice = stock.currentPrice || purchasePrice;
    const totalInvested = purchasePrice * stock.quantity;
    const currentValue = currentPrice * stock.quantity;
    const profitLoss = currentValue - totalInvested;
    const profitLossPercentage = totalInvested === 0 ? 0 : ((profitLoss / totalInvested) * 100).toFixed(2);

    return {
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      quantity: stock.quantity,
      purchasePrice: purchasePrice.toFixed(2),
      currentPrice: currentPrice.toFixed(2),
      totalInvested: totalInvested.toFixed(2),
      currentValue: currentValue.toFixed(2),
      profitLoss: profitLoss.toFixed(2),
      profitLossPercentage,
      isProfitable: profitLoss >= 0
    };
  };

  const stats = calculateStats(selectedStock);

  return (
    <div className="analytics-container">
      {/* Stock Selection Section */}
      <section className="stock-selection-section">
        <div className="stock-selector">
          <div className="selector-header">
            <h3>Select Stock to Analyze</h3>
            <input 
              type="text" 
              placeholder="Search stocks..." 
              className="stock-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="stock-list">
            {filteredHoldings.length === 0 ? (
              <div className="no-stocks">
                <p>No stocks found</p>
              </div>
            ) : (
              filteredHoldings.map((stock) => (
                <div 
                  key={`${stock.symbol}-${stock.date}`}
                  className={`stock-item ${selectedStock?.symbol === stock.symbol && selectedStock?.date === stock.date ? 'active' : ''}`}
                  onClick={() => handleStockSelect(stock)}
                >
                  <div className="stock-item-header">
                    <span className="stock-symbol">{stock.symbol}</span>
                    <span className={`stock-change ${(stock.currentPrice - stock.closingPrice) >= 0 ? 'positive' : 'negative'}`}>
                      {(stock.currentPrice - stock.closingPrice) >= 0 ? '+' : ''}
                      {stock.closingPrice ? (((stock.currentPrice - stock.closingPrice) / stock.closingPrice) * 100).toFixed(2) : 'N/A'}%
                    </span>
                  </div>
                  <div className="stock-item-name">{stock.name || stock.symbol}</div>
                  <div className="stock-item-price">${stock.currentPrice?.toFixed(2) ?? '0.00'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {!selectedStock ? (
        <section className="no-selection-section">
          <div className="no-selection">
            <FaInfoCircle size={48} />
            <h3>Select a stock to view analytics</h3>
            <p>Choose a stock from above to see detailed charts and predictions</p>
          </div>
        </section>
      ) : (
        <>
          {/* Stock Overview Section */}
          <section className="stock-overview-section">
            <div className="overview-header">
              <div>
                <h2>{stats.symbol}</h2>
                <p className="stock-full-name">{stats.name}</p>
              </div>
              <div className="current-price-display">
                <span className="price-label">Current Price</span>
                <span className="price-value">${stats.currentPrice}</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Quantity</span>
                <span className="stat-value">{stats.quantity}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Purchase Price</span>
                <span className="stat-value">${stats.purchasePrice}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Invested</span>
                <span className="stat-value">${stats.totalInvested}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Current Value</span>
                <span className="stat-value">${stats.currentValue}</span>
              </div>
              <div className={`stat-card ${stats.isProfitable ? 'profit' : 'loss'}`}>
                <span className="stat-label">Profit/Loss</span>
                <span className="stat-value">
                  {stats.isProfitable ? '+' : ''}${stats.profitLoss}
                </span>
              </div>
              <div className={`stat-card ${stats.isProfitable ? 'profit' : 'loss'}`}>
                <span className="stat-label">Return</span>
                <span className="stat-value">
                  {stats.isProfitable ? '+' : ''}{stats.profitLossPercentage}%
                </span>
              </div>
            </div>
          </section>

          {/* TradingView Chart Section */}
          <section className="chart-section">
            <div className="chart-header">
              <h3><FaChartLine /> Price Chart</h3>
              <p className="chart-subtitle">Real-time price data powered by TradingView</p>
            </div>
            <div className="tradingview-widget-container">
              <div className="tradingview-widget">
                <iframe
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${stats.symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=${window.location.hostname}&utm_medium=widget&utm_campaign=chart&utm_term=${stats.symbol}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    margin: '0',
                    padding: '0',
                    border: 'none'
                  }}
                  frameBorder="0"
                  allowTransparency="true"
                  scrolling="no"
                  allowFullScreen
                  title={`${stats.symbol} Chart`}
                ></iframe>
              </div>
            </div>
          </section>

          {/* Future Features Section */}
          <section className="future-features-section">
            <h3 className="section-title">Coming Soon</h3>
            <div className="future-features">
              <div className="feature-card coming-soon">
                <div className="feature-icon">
                  <FaChartLine size={48} />
                </div>
                <h4>Advanced Analytics</h4>
                <p>Technical indicators, volume analysis, and more</p>
              </div>
              <div className="feature-card coming-soon">
                <div className="feature-icon">
                  <FaChartLine size={48} />
                </div>
                <h4>AI Stock Predictor</h4>
                <p>Machine learning-powered price predictions and trend analysis</p>
              </div>
              <div className="feature-card coming-soon">
                <div className="feature-icon">
                  <FaChartLine size={48} />
                </div>
                <h4>Performance Reports</h4>
                <p>Detailed performance metrics and historical data analysis</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Analytics;
