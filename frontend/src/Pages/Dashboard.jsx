import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaSearch, FaPlus, FaChartLine, FaNewspaper, FaStar, FaChartBar, FaEdit, FaTrash } from 'react-icons/fa';
import NewsSection from '../components/NewsSection';
import './Dashboard.css';
import axios from 'axios';
import Loader from '../components/loader';
import gsap from 'gsap';
import GainersCard from '../components/ui/GainersCard';
import LosersCard from '../components/ui/LosersCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Menu, X, ChevronDown, ChevronUp, BarChart2, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { UpwardTriangle, DownwardTriangle } from '../components/ui/Triangleicons';
import Donut3DThree from '../components/ui/Donut3DThree';
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ symbol: '', quantity: '', date: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [holdings, setHoldings] = useState([]);
  const [holdingsLoading, setHoldingsLoading] = useState(true);
  const [holdingsError, setHoldingsError] = useState('');
  const [marketMovers, setMarketMovers] = useState({ gainers: [], losers: [] });
  const [moversLoading, setMoversLoading] = useState(true);
  const [moversError, setMoversError] = useState('');
  const wsRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [usTime, setUsTime] = useState(new Date());

  // GSAP refs for loader/data containers
  const holdingsLoaderRef = useRef();
  const holdingsDataRef = useRef();
  // Refs for other components

  // GSAP animation for holdings
  useEffect(() => {
    if (holdingsLoading) {
      gsap.to(holdingsLoaderRef.current, { opacity: 1, scale: 1, duration: 0.3, pointerEvents: 'auto' });
      gsap.to(holdingsDataRef.current, { opacity: 0, y: 30, duration: 0.3, pointerEvents: 'none' });
    } else {
      gsap.to(holdingsLoaderRef.current, { opacity: 0, scale: 0.8, duration: 0.4, pointerEvents: 'none' });
      gsap.to(holdingsDataRef.current, { opacity: 1, y: 0, duration: 0.5, delay: 0.2, pointerEvents: 'auto', ease: 'power2.out' });
    }
  }, [holdingsLoading]);

  // Market movers animations are now handled by the GainersCard and LosersCard components

  // Fetch market movers
  useEffect(() => {
    const fetchMarketMovers = async () => {
      try {
        setMoversLoading(true);
        setMoversError('');
        const response = await axios.get('http://localhost:5000/api/market/market-movers');
        console.log('Market movers response:', response.data); // Debug log
        setMarketMovers(response.data);
      } catch (error) {
        console.error('Failed to fetch market movers:', error.response?.data || error.message);
        setMoversError('Failed to load market movers');
      } finally {
        setMoversLoading(false);
      }
    };

    fetchMarketMovers();
    // Refresh market movers every 5 minutes
    const interval = setInterval(fetchMarketMovers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real holdings on mount
  useEffect(() => {
    const fetchHoldingsAndNames = async () => {
      setHoldingsLoading(true);
      setHoldingsError('');
      try {
        // 1. Fetch holdings
        const res = await axios.get('http://localhost:5000/api/portfolio', { withCredentials: true });
        const data = res.data;

        // 2. Get unique symbols
        const symbols = [...new Set(data.map(h => h.symbol).filter(Boolean))];
        let symbolToName = {};
        if (symbols.length > 0) {
          // 3. Fetch asset names
          const namesRes = await axios.get(`http://localhost:5000/api/asset-names?symbols=${symbols.join(',')}`);
          symbolToName = namesRes.data;
        }

        // 4. Map names to holdings
        setHoldings(prev =>
          data.map(h => {
            const prevHolding = prev.find(ph => ph.symbol === h.symbol);
            return {
              ...h,
              name: symbolToName[h.symbol] || h.symbol,
              currentPrice: prevHolding?.currentPrice // preserve if exists
            };
          })
        );
        // Fetch latest prices for these symbols right after setting holdings
        if (symbols.length > 0) {
          fetchLatestBars(symbols);
        }
      } catch (err) {
        setHoldingsError('Failed to fetch holdings or asset names.');
      } finally {
        setHoldingsLoading(false);
      }
    };

    fetchHoldingsAndNames();
  }, []);

  // Add price update debouncing
  const priceUpdateTimeout = useRef({});
  const [priceUpdates, setPriceUpdates] = useState({});

  // Add this function after the refreshHoldings function
  const fetchLatestBars = async (symbols) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/market/latest-bars?symbols=${symbols.join(',')}`);
      const latestBars = response.data;
      console.log('API response:', latestBars);
      setHoldings(prev => prev.map(h => {
        const latestBar = latestBars[h.symbol.toUpperCase()];
        if (latestBar && latestBar.c) {
          console.log(`Updating ${h.symbol} currentPrice to`, latestBar.c);
          return { ...h, currentPrice: latestBar.c };
        }
        return h;
      }));
    } catch (error) {
      console.error('Failed to fetch latest bars:', error);
    }
  };

  // WebSocket for real-time price updates
  useEffect(() => {
    if (!holdings.length) return;
    
    // Get unique symbols
    const symbols = [...new Set(holdings.map(h => h.symbol))];
    
    // Open WebSocket connection
    wsRef.current = new window.WebSocket('ws://localhost:5000');
    
    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', symbols }));
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'quote' && data.symbol) {
          // Clear existing timeout for this symbol
          if (priceUpdateTimeout.current[data.symbol]) {
            clearTimeout(priceUpdateTimeout.current[data.symbol]);
          }
          
          // Set new timeout for price update
          priceUpdateTimeout.current[data.symbol] = setTimeout(() => {
            setPriceUpdates(prev => ({
              ...prev,
              [data.symbol]: data.price
            }));
          }, 100); // 100ms debounce
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };
    
    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
      // Fetch latest bars when WebSocket closes
      fetchLatestBars(symbols);
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Fetch latest bars when WebSocket errors
      fetchLatestBars(symbols);
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Clear all timeouts
      Object.values(priceUpdateTimeout.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [holdings.map(h => h.symbol).join(',')]);

  // Update holdings with new prices
  useEffect(() => {
    if (Object.keys(priceUpdates).length === 0) return;
    
    setHoldings(prev => prev.map(h => {
      const newPrice = priceUpdates[h.symbol];
      if (newPrice !== undefined) {
        return { ...h, currentPrice: newPrice };
      }
      return h;
    }));
  }, [priceUpdates]);

  const refreshHoldings = async () => {
    setHoldingsLoading(true);
    setHoldingsError('');
    try {
      const res = await fetch('http://localhost:5000/api/portfolio', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch holdings');
      }
      const data = await res.json();
      setHoldings(data);
    } catch (err) {
      setHoldingsError(err.message);
    } finally {
      setHoldingsLoading(false);
    }
  };


  const calculateProfitLoss = (purchasePrice, currentPrice, quantity) => {
    const profitLoss = (currentPrice - purchasePrice) * quantity;
    const totalInvested = purchasePrice * quantity;
    return {
      value: profitLoss,
      percentage: totalInvested === 0 ? 0 : ((profitLoss / totalInvested) * 100).toFixed(2)
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
    try {
      const res = await fetch('http://localhost:5000/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: addForm.symbol,
          quantity: addForm.quantity,
          date: addForm.date,
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add stock');
      }
      let newHolding = await res.json();
      // Fetch the latest bar for the symbol to ensure currentPrice is up to date
      try {
        const barsRes = await fetch(`http://localhost:5000/api/market/latest-bars?symbols=${newHolding.symbol}`);
        if (barsRes.ok) {
          const barsData = await barsRes.json();
          if (barsData && barsData[newHolding.symbol] && barsData[newHolding.symbol].c) {
            newHolding.currentPrice = barsData[newHolding.symbol].c;
          }
        }
      } catch (err) {
        // Ignore error, fallback to backend value
      }
      setAddSuccess('Stock added successfully!');
      setShowAddModal(false);
      setAddForm({ symbol: '', quantity: '', date: '' });
      setHoldings(prev => {
        // Remove any existing holding with the same symbol and date
        const filtered = prev.filter(
          h => !(h.symbol === newHolding.symbol && h.date === newHolding.date)
        );
        return [...filtered, newHolding];
      });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const [editModal, setEditModal] = useState({ open: false, stock: null, originalSymbol: '', originalDate: '' });
  const [editForm, setEditForm] = useState({ quantity: '', date: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, stock: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // When Edit icon is clicked, prefill the form and store original symbol/date
  const handleEditClick = (stock) => {
    setEditModal({ open: true, stock, originalSymbol: stock.symbol, originalDate: stock.date });
  };

  // When Edit icon is clicked, use handleEditClick
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit edit: call new endpoint with original symbol/date
  const handleEditStockSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`http://localhost:5000/api/portfolio/${editModal.originalSymbol}/${editModal.originalDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: editForm.quantity,
          newDate: editForm.date
        }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update stock');
      }
      setEditModal({ open: false, stock: null, originalSymbol: '', originalDate: '' });
      await refreshHoldings();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (stock) => {
    setDeleteModal({ open: true, stock });
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const symbol = deleteModal.stock.symbol;
      const date = deleteModal.stock.date;
      const res = await fetch(`http://localhost:5000/api/portfolio/${symbol}?date=${date}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete stock');
      }
      setHoldings(prev => prev.filter(h => !(h.symbol === symbol && h.date === date)));
      setDeleteModal({ open: false, stock: null });
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Update the holdings table rendering to use the new price updates
  const renderHoldingsTable = () => (
    <table>
      <thead>
        <tr>
          <th>Stock</th>
          <th>Quantity</th>
          <th>Purchase Price</th>
          <th>Current Price (Per Share)</th>
          <th>Profit/Loss</th>
          <th>Total Value</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((stock) => {
          const purchasePrice = stock.closingPrice || 0;
          const currentPrice = stock.currentPrice || purchasePrice;
          const { value, percentage } = calculateProfitLoss(
            purchasePrice,
            currentPrice,
            stock.quantity
          );
          return (
            <tr key={stock._id || `${stock.symbol}-${stock.date}`}>
              <td>
                <div className="stock-info">
                  <span className="symbol">{stock.symbol}</span>
                  <span className="name">{stock.name}</span>
                </div>
              </td>
              <td>{stock.quantity}</td>
              <td>${(purchasePrice * stock.quantity).toFixed(2)}</td>
              <td className="price-cell">${currentPrice.toFixed(2)}</td>
              <td className={value >= 0 ? 'profit' : 'loss'} style={{ 
                position: 'relative', 
                fontWeight: 'bold',
                textShadow: value >= 0 ? '0 0 5px rgba(0, 255, 0, 0.3)' : '0 0 5px rgba(255, 76, 76, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {value >= 0 ? <UpwardTriangle style={{ marginRight: '5px' }} /> : <DownwardTriangle style={{ marginRight: '5px' }} />}
                  ${Math.abs(value).toFixed(2)} ({percentage}%)
                </div>
              </td>
              <td>${(currentPrice * stock.quantity).toFixed(2)}</td>
              <td>
                <button className="icon-btn" title="Edit" onClick={() => handleEditClick(stock)}>
                  <FaEdit />
                </button>
                <button className="icon-btn" title="Delete" onClick={() => handleDeleteClick(stock)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setUsTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add state for yesterday's closes and today's gain
  const [yesterdayCloses, setYesterdayCloses] = useState({});
  const [todaysGain, setTodaysGain] = useState(0);
  const [todaysGainStats, setTodaysGainStats] = useState({ gainCount: 0, lossCount: 0, gainAmount: 0, lossAmount: 0, gainers: [], losers: [] });

  // Fetch yesterday's close prices after holdings are loaded
  useEffect(() => {
    if (!holdings.length) return;
    const fetchYesterdaysCloses = async () => {
      try {
        const symbols = holdings.map(h => h.symbol).join(',');
        const res = await fetch(`http://localhost:5000/api/market/yesterday-close?symbols=${symbols}`);
        const data = await res.json();
        setYesterdayCloses(data);
      } catch (err) {
        setYesterdayCloses({});
      }
    };
    fetchYesterdaysCloses();
  }, [holdings]);

  // Calculate today's gain after yesterdayCloses is loaded
  useEffect(() => {
    if (!holdings.length || Object.keys(yesterdayCloses).length === 0) return;
    let totalGain = 0;
    let gainCount = 0, lossCount = 0, gainAmount = 0, lossAmount = 0;
    let gainers = [], losers = [];
    holdings.forEach(stock => {
      const currentPrice = stock.currentPrice;
      const yesterdayClose = yesterdayCloses[stock.symbol];
      if (currentPrice && yesterdayClose) {
        const gain = (currentPrice - yesterdayClose) * stock.quantity;
        totalGain += gain;
        if (gain >= 0) {
          gainCount++;
          gainAmount += gain;
          gainers.push({ ...stock, gain });
        } else {
          lossCount++;
          lossAmount += gain;
          losers.push({ ...stock, gain });
        }
      }
    });
    setTodaysGain(totalGain);
    setTodaysGainStats({ gainCount, lossCount, gainAmount, lossAmount, gainers, losers });
  }, [holdings, yesterdayCloses]);

  // Add state for unrealized gain stats
  const [unrealizedStats, setUnrealizedStats] = useState({ total: 0, profitCount: 0, lossCount: 0, profitAmount: 0, lossAmount: 0, highestProfit: null, highestLoss: null });

  // Calculate unrealized gain/loss after holdings are loaded
  useEffect(() => {
    if (!holdings.length) return;
    let total = 0, profitCount = 0, lossCount = 0, profitAmount = 0, lossAmount = 0;
    let highestProfit = null, highestLoss = null;
    holdings.forEach(stock => {
      const purchasePrice = stock.closingPrice || 0;
      const currentPrice = stock.currentPrice;
      const gain = (currentPrice - purchasePrice) * stock.quantity;
      total += gain;
      if (gain >= 0) {
        profitCount++;
        profitAmount += gain;
        if (!highestProfit || gain > highestProfit.gain) highestProfit = { ...stock, gain };
      } else {
        lossCount++;
        lossAmount += gain;
        if (!highestLoss || gain < highestLoss.gain) highestLoss = { ...stock, gain };
      }
    });
    setUnrealizedStats({ total, profitCount, lossCount, profitAmount, lossAmount, highestProfit, highestLoss });
  }, [holdings]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative z-10">
        <div className="dashboard">
          {/* Sidebar */}
          <div className={`sidebar${sidebarOpen ? '' : ' collapsed'}`}>
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
          <div className={`main-content${sidebarOpen ? '' : ' expanded'}`}>
            {/* Top Navbar */}
            <div className="top-navbar">
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle sidebar"
              >
                <span style={{fontSize: '2rem', color: 'var(--accent-orange)'}}>&#9776;</span>
              </button>
              <div className="nav-right">
                <div className="user-profile">
                  <img src="/src/assets/default-avatar.png" alt="User" />
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="dashboard-content">
              {activeTab === 'news' ? (
                <NewsSection />
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="summary-cards-row">
                    {/* Today's Gain Card */}
                    <div className={`summary-advanced-card ${todaysGainStats.gainAmount >= 0 ? 'profit-card' : 'loss-card'}`} 
                      style={{
                        borderColor: todaysGainStats.gainAmount >= 0 ? 'var(--profit-green)' : 'var(--loss-red)',
                        boxShadow: todaysGainStats.gainAmount >= 0 ? 
                          '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 0 10px rgba(0, 255, 0, 0.3)' : 
                          '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 0 10px rgba(255, 76, 76, 0.3)'
                      }}>
                      <h4>Today's Gain</h4>
                      <div className="donut-row">
                        <Donut3DThree gain={todaysGainStats.gainAmount} loss={todaysGainStats.lossAmount} />
                        <div className="donut-info">
                          <div className="gain-count"><span className="dot gain"></span> {todaysGainStats.gainCount} of {holdings.length} Gaining</div>
                          <div className="gain-amount" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {todaysGainStats.gainAmount >= 0 ? '+' : ''}
                            {todaysGainStats.gainAmount.toFixed(2)}
                            <span className="gain" style={{ marginLeft: '6px' }}><UpwardTriangle/></span>
                          </div>
                          <div className="loss-count"><span className="dot loss"></span> {todaysGainStats.lossCount} of {holdings.length} Losing</div>
                          <div className="loss-amount" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {todaysGainStats.lossAmount < 0 ? '-' : ''}
                            {Math.abs(todaysGainStats.lossAmount).toFixed(2)}
                            <span className="loss" style={{ marginLeft: '6px' }}><DownwardTriangle/></span>
                          </div>
                        </div>
                      </div>
                      <div className="summary-stats-row">
                        <div className="stat-box gain">
                          <div className="stat-title">Gaining Stocks</div>
                          <div className="stat-value">{todaysGainStats.gainers.length > 0 ? todaysGainStats.gainers.map(s => s.symbol).join(', ') : '-'}</div>
                          <div className="stat-amount">{todaysGainStats.gainers.length > 0 ? `${todaysGainStats.gainers.map(s => s.gain.toFixed(2)).join(', ')}` : '-'}</div>
                        </div>
                        <div className="stat-box loss">
                          <div className="stat-title">Losing Stocks</div>
                          <div className="stat-value">{todaysGainStats.losers.length > 0 ? todaysGainStats.losers.map(s => s.symbol).join(', ') : '-'}</div>
                          <div className="stat-amount">{todaysGainStats.losers.length > 0 ? `${todaysGainStats.losers.map(s => s.gain.toFixed(2)).join(', ')}` : '-'}</div>
                        </div>
                      </div>
                    </div>
                    {/* Unrealized Gain Card */}
                    <div className={`summary-advanced-card ${unrealizedStats.total >= 0 ? 'profit-card' : 'loss-card'}`}
                      style={{
                        borderColor: unrealizedStats.total >= 0 ? 'var(--profit-green)' : 'var(--loss-red)',
                        boxShadow: unrealizedStats.total >= 0 ? 
                          '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 0 10px rgba(0, 255, 0, 0.3)' : 
                          '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 0 10px rgba(255, 76, 76, 0.3)'
                      }}>
                      <h4>Unrealized Gain</h4>
                      <div className="donut-row">
                        <Donut3DThree gain={unrealizedStats.profitAmount} loss={unrealizedStats.lossAmount} />
                        <div className="donut-info">
                          <div className="gain-count"><span className="dot gain"></span> {unrealizedStats.profitCount} of {holdings.length} In Profit</div>
                          <div className="gain-amount" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {unrealizedStats.profitAmount >= 0 ? '+' : ''}
                            {unrealizedStats.profitAmount.toFixed(2)}
                            <span className="gain" style={{ marginLeft: '6px' }}><UpwardTriangle/></span>
                          </div>
                          <div className="loss-count"><span className="dot loss"></span> {unrealizedStats.lossCount} of {holdings.length} In Loss</div>
                          <div className="loss-amount" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {unrealizedStats.lossAmount < 0 ? '-' : ''}
                            {Math.abs(unrealizedStats.lossAmount).toFixed(2)}
                            <span className="loss" style={{ marginLeft: '6px' }}><DownwardTriangle/></span>
                          </div>
                        </div>
                      </div>
                      <div className="summary-stats-row">
                        <div className="stat-box gain">
                          <div className="stat-title">Highest Profit</div>
                          <div className="stat-value">{unrealizedStats.highestProfit ? unrealizedStats.highestProfit.symbol : '-'}</div>
                          <div className="stat-amount">
                            {unrealizedStats.highestProfit ? (
                              <>
                                {unrealizedStats.highestProfit.gain.toFixed(2)} <span className="gain"><UpwardTriangle/></span>
                              </>
                            ) : '-'}
                          </div>
                        </div>
                        <div className="stat-box loss">
                          <div className="stat-title">Highest Loss</div>
                          <div className="stat-value">{unrealizedStats.highestLoss ? unrealizedStats.highestLoss.symbol : '-'}</div>
                          <div className="stat-amount">
                            {unrealizedStats.highestLoss ? (
                              <>
                                {unrealizedStats.highestLoss.gain.toFixed(2)} <span className="loss"><DownwardTriangle/></span>
                              </>
                            ) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Summary */}
                  <section className="performance-summary">
                    {(() => {
                      const totalProfitLoss = holdings.reduce((total, stock) => {
                        const purchasePrice = stock.closingPrice || 0;
                        const currentPrice = stock.currentPrice;
                        const profitLoss = (currentPrice - purchasePrice) * stock.quantity;
                        return total + profitLoss;
                      }, 0);

                      const totalInvested = holdings.reduce((total, stock) => {
                        const purchasePrice = stock.closingPrice || 0;
                        return total + (purchasePrice * stock.quantity);
                      }, 0);

                      const profitLossPercentage = totalInvested === 0 ? 0 : ((totalProfitLoss / totalInvested) * 100).toFixed(2);

                      return (
                        <>
                          <div className={`summary-card ${totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
                            <h3>{totalProfitLoss >= 0 ? 'Total Profit' : 'Total Loss'}</h3>
                            <div className="amount">{totalProfitLoss >= 0 ? '+' : ''}${Math.abs(totalProfitLoss).toFixed(2)}</div>
                            <div className={`trend ${totalProfitLoss >= 0 ? 'profit' : 'loss'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {totalProfitLoss >= 0 ? <UpwardTriangle/> : <DownwardTriangle/> }
                              <span style={{ marginLeft: '6px' }}>{Math.abs(profitLossPercentage)}%</span>
                            </div>
                          </div>
                          <div className="summary-card invested">
                            <h3>Total Invested</h3>
                            <div className="amount">${totalInvested.toFixed(2)}</div>
                          </div>
                        </>
                      );
                    })()}
                  </section>

                  {/* Top Stocks */}
                  <section className="top-stocks">
                    <div className="gainers">
                      <GainersCard 
                        gainers={marketMovers.gainers}
                        loading={moversLoading}
                        error={moversError}
                      />
                    </div>
                    <div className="losers">
                      <LosersCard 
                        losers={marketMovers.losers}
                        loading={moversLoading}
                        error={moversError}
                      />
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
                    <div className="holdings-table" style={{ position: 'relative', minHeight: '110px' }}>
                      <div ref={holdingsLoaderRef} style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '110px',
                        width: '100%',
                        position: 'absolute',
                        left: 0, right: 0, top: 0, bottom: 0,
                        zIndex: 2,
                        opacity: holdingsLoading ? 1 : 0,
                        pointerEvents: holdingsLoading ? 'auto' : 'none',
                        transition: 'opacity 0.3s'
                      }}>
                        <Loader />
                      </div>
                      <div ref={holdingsDataRef} style={{
                        opacity: holdingsLoading ? 0 : 1,
                        transform: holdingsLoading ? 'translateY(30px)' : 'translateY(0)',
                        transition: 'opacity 0.5s, transform 0.5s',
                        width: '100%'
                      }}>
                        {!holdingsLoading && holdingsError && (
                          <div className="error-message">{holdingsError}</div>
                        )}
                        {!holdingsLoading && !holdingsError && holdings.length === 0 && (
                          <div>No holdings found.</div>
                        )}
                        {!holdingsLoading && !holdingsError && holdings.length > 0 && renderHoldingsTable()}
                      </div>
                    </div>
                  </section>
                </>
              )}
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

          {/* Edit Stock Modal */}
          {editModal.open && (
            <div className="modal-overlay">
              <div className="modal edit-stock-modal">
                <h3>Edit Stock</h3>
                <form onSubmit={handleEditStockSubmit}>
                  <label>
                    Quantity:
                    <input
                      type="number"
                      name="quantity"
                      value={editForm.quantity}
                      onChange={handleEditFormChange}
                      min="1"
                      required
                    />
                  </label>
                  <label>
                    Purchase Date:
                    <input
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditFormChange}
                      required
                    />
                  </label>
                  <div className="modal-actions">
                    <button type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
                    <button type="button" onClick={() => setEditModal({ open: false, stock: null, originalSymbol: '', originalDate: '' })}>Cancel</button>
                  </div>
                  {editError && <div className="error-message">{editError}</div>}
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal.open && (
            <div className="modal-overlay">
              <div className="modal delete-stock-modal">
                <h3>Delete Stock</h3>
                <p>Are you sure you want to delete <b>{deleteModal.stock.symbol}</b> ({deleteModal.stock.name})?</p>
                <div className="modal-actions">
                  <button onClick={handleDeleteConfirm} disabled={deleteLoading} style={{ background: 'red', color: 'white' }}>
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </button>
                  <button onClick={() => setDeleteModal({ open: false, stock: null })} disabled={deleteLoading}>Cancel</button>
                </div>
                {deleteError && <div className="error-message">{deleteError}</div>}
              </div>
            </div>
          )}

          {/* Optional: Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 