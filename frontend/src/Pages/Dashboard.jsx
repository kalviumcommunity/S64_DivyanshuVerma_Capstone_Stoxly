import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaSearch, FaPlus, FaChartLine, FaNewspaper, FaStar, FaChartBar } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ symbol: '', quantity: '', date: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Mock data for demonstration
  const holdings = [
    { symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, purchasePrice: 150.25, currentPrice: 175.30 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', quantity: 5, purchasePrice: 2800.50, currentPrice: 2950.75 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 8, purchasePrice: 300.00, currentPrice: 320.25 },
  ];

  const topGainers = [
    { symbol: 'TSLA', name: 'Tesla Inc.', change: '+5.2%' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', change: '+3.8%' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', change: '+2.9%' },
  ];
  const topLosers = [
    { symbol: 'META', name: 'Meta Platforms', change: '-2.5%' },
    { symbol: 'NFLX', name: 'Netflix Inc.', change: '-1.8%' },
    { symbol: 'PYPL', name: 'PayPal Holdings', change: '-1.2%' },
  ];

  const news = [
    { headline: 'Tech stocks rally as market rebounds', source: 'Bloomberg', time: '2h ago', tags: ['AAPL', 'MSFT'] },
    { headline: 'New regulations impact financial sector', source: 'Reuters', time: '4h ago', tags: ['JPM', 'BAC'] },
    { headline: 'Electric vehicle sales hit record high', source: 'CNBC', time: '5h ago', tags: ['TSLA', 'F'] },
  ];

  const calculateProfitLoss = (purchasePrice, currentPrice, quantity) => {
    const profitLoss = (currentPrice - purchasePrice) * quantity;
    return {
      value: profitLoss,
      percentage: ((currentPrice - purchasePrice) / purchasePrice * 100).toFixed(2)
    };
  };

  const handleAddStockChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    // Placeholder userId for demo
    const userId = 'demo-user-id';
    try {
      const res = await fetch('http://localhost:5000/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: addForm.symbol,
          quantity: addForm.quantity,
          date: addForm.date,
          userId
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add stock');
      }
      setAddSuccess('Stock added successfully!');
      setShowAddModal(false);
      setAddForm({ symbol: '', quantity: '', date: '' });
      // Optionally: refresh holdings here
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">Stoxly</div>
        <nav>
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <FaChartLine /> Dashboard
            </li>
            <li className={activeTab === 'holdings' ? 'active' : ''} onClick={() => setActiveTab('holdings')}>
              <FaStar /> Holdings
            </li>
            <li className={activeTab === 'news' ? 'active' : ''} onClick={() => setActiveTab('news')}>
              <FaNewspaper /> News
            </li>
            <li className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
              <FaChartBar /> Analytics
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <div className="top-navbar">
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="nav-right">
            <div className="notification">
              <FaBell />
              <span className="notification-badge">3</span>
            </div>
            <div className="user-profile">
              <img src="/default-avatar.png" alt="User" />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Summary Cards */}
          <div className="summary-cards-row">
            {/* Today's Gain Card */}
            <div className="summary-advanced-card">
              <h4>Today's Gain</h4>
              <div className="donut-row">
                <svg width="60" height="60" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#333" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#00FF00" strokeWidth="4" strokeDasharray="80, 100" strokeLinecap="round" />
                </svg>
                <div className="donut-info">
                  <div className="gain-count"><span className="dot gain"></span> 1 of 1 Gaining</div>
                  <div className="gain-amount">395 <span className="gain">▲ 5.1%</span></div>
                  <div className="loss-count"><span className="dot loss"></span> 0 of 1 Losing</div>
                  <div className="loss-amount">0 <span className="loss">▼ 0%</span></div>
                </div>
              </div>
              <div className="summary-stats-row">
                <div className="stat-box gain">
                  <div className="stat-title">Gaining Stocks</div>
                  <div className="stat-value">Reliance</div>
                  <div className="stat-amount">1,366.20 <span className="gain">▲ 5.06%</span></div>
                </div>
                <div className="stat-box loss">
                  <div className="stat-title">Losing Stocks</div>
                  <div className="stat-value">-</div>
                  <div className="stat-amount">-</div>
                </div>
              </div>
            </div>
            {/* Unrealized Gain Card */}
            <div className="summary-advanced-card">
              <h4>Unrealized Gain</h4>
              <div className="donut-row">
                <svg width="60" height="60" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#333" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#00FF00" strokeWidth="4" strokeDasharray="90, 100" strokeLinecap="round" />
                </svg>
                <div className="donut-info">
                  <div className="gain-count"><span className="dot gain"></span> 1 of 1 In Profit</div>
                  <div className="gain-amount">698 <span className="gain">▲ 9.3%</span></div>
                  <div className="loss-count"><span className="dot loss"></span> 0 of 1 In Loss</div>
                  <div className="loss-amount">0 <span className="loss">▼ 0%</span></div>
                </div>
              </div>
              <div className="summary-stats-row">
                <div className="stat-box gain">
                  <div className="stat-title">Highest Profit</div>
                  <div className="stat-value">Reliance</div>
                  <div className="stat-amount">698 <span className="gain">▲ 9.31%</span></div>
                </div>
                <div className="stat-box loss">
                  <div className="stat-title">Highest Loss</div>
                  <div className="stat-value">-</div>
                  <div className="stat-amount">-</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <section className="performance-summary">
            <div className="summary-card profit">
              <h3>Total Profit</h3>
              <div className="amount">+$2,450.50</div>
              <div className="trend">↑ 5.2%</div>
            </div>
            <div className="summary-card invested">
              <h3>Total Invested</h3>
              <div className="amount">$20,000.00</div>
              <div className="trend">—</div>
            </div>
          </section>

          {/* Top Stocks */}
          <section className="top-stocks">
            <div className="gainers">
              <h3>Top Gainers</h3>
              {topGainers.map((stock) => (
                <div key={stock.symbol} className="stock-card gainer">
                  <div className="stock-info">
                    <span className="symbol">{stock.symbol}</span>
                    <span className="name">{stock.name}</span>
                  </div>
                  <span className="change">{stock.change}</span>
                </div>
              ))}
            </div>
            <div className="losers">
              <h3>Top Losers</h3>
              {topLosers.map((stock) => (
                <div key={stock.symbol} className="stock-card loser">
                  <div className="stock-info">
                    <span className="symbol">{stock.symbol}</span>
                    <span className="name">{stock.name}</span>
                  </div>
                  <span className="change">{stock.change}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Holdings Section */}
          <section className="holdings-section">
            <div className="section-header">
              <h2>Your Holdings</h2>
              <button className="add-stock-btn" onClick={() => setShowAddModal(true)}>
                <FaPlus /> Add Stock
              </button>
            </div>
            <div className="holdings-table">
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Quantity</th>
                    <th>Purchase Price</th>
                    <th>Current Price</th>
                    <th>Profit/Loss</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((stock) => {
                    const { value, percentage } = calculateProfitLoss(
                      stock.purchasePrice,
                      stock.currentPrice,
                      stock.quantity
                    );
                    return (
                      <tr key={stock.symbol}>
                        <td>
                          <div className="stock-info">
                            <span className="symbol">{stock.symbol}</span>
                            <span className="name">{stock.name}</span>
                          </div>
                        </td>
                        <td>{stock.quantity}</td>
                        <td>${stock.purchasePrice.toFixed(2)}</td>
                        <td>${stock.currentPrice.toFixed(2)}</td>
                        <td className={value >= 0 ? 'profit' : 'loss'}>
                          ${Math.abs(value).toFixed(2)} ({percentage}%)
                        </td>
                        <td>${(stock.currentPrice * stock.quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* News Section */}
          <section className="news-section">
            <h3>Latest News</h3>
            {news.map((item, index) => (
              <div key={index} className="news-card">
                <h4>{item.headline}</h4>
                <div className="news-meta">
                  <span className="source">{item.source}</span>
                  <span className="time">{item.time}</span>
                </div>
                <div className="tags">
                  {item.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal add-stock-modal">
            <h3>Add Stock</h3>
            <form onSubmit={handleAddStockSubmit}>
              <label>
                Symbol:
                <input
                  type="text"
                  name="symbol"
                  value={addForm.symbol}
                  onChange={handleAddStockChange}
                  required
                />
              </label>
              <label>
                Quantity:
                <input
                  type="number"
                  name="quantity"
                  value={addForm.quantity}
                  onChange={handleAddStockChange}
                  min="1"
                  required
                />
              </label>
              <label>
                Date:
                <input
                  type="date"
                  name="date"
                  value={addForm.date}
                  onChange={handleAddStockChange}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit" disabled={addLoading}>{addLoading ? 'Adding...' : 'Add Stock'}</button>
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
              {addError && <div className="error-message">{addError}</div>}
              {addSuccess && <div className="success-message">{addSuccess}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 