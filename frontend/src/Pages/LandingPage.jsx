"use client"
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import Hero3DScene from '../components/Hero3DScene';
import BitcoinModel from '../components/BitcoinModel';
import Lenis from 'lenis';
import CubeeModel from '../components/CubeeModel';
import IconStrip from '../components/IconStrip';
import { FaTwitter, FaLinkedinIn, FaGithub } from 'react-icons/fa';
import ScrollFloat from '../components/ScrollFloat';

const LandingPage = () => {
  useEffect(()=>{
    const lenis = new Lenis();
    function raf(time){
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }, []);
    
  return (
    <div className="landing-container">
      <div className="navbar">
        <div className="logo-container">
          <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3V21H21" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 14L11 10L15 14L21 8" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">StockFolio</span>
        </div>
        
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#about-us">About us</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact</a>
        </div>
        
        <Link to="/dashboard" className="start-trading-btn">Portfolio</Link>
        
        <div className="mobile-menu-btn">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </div>
      
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="main-heading">Step into the Future of Stock Portfolio Management</h1>
          <p className="sub-heading">
            Maximize your investment potential with a powerful platform built to shape the 
            future of personal finance management
          </p>
          
          <div className="cta-buttons">
            <Link to="/signup" className="sign-up-btn">Sign Up for Free</Link>
          </div>
        </div>
        
        <div className="hero-3d-container">
          <Hero3DScene />
        </div>
      </div>

      <div className="hero-section2">
        <BitcoinModel />
        <section className="trading-interface">
          <div className="trading-header">
            <ScrollFloat containerClassName="trading-subtitle">
              JOIN THE REVOLUTION
            </ScrollFloat>
            <h2 className="trading-title">Setting a New Standard in STOCK PORTFOLIO MANAGEMENT</h2>
            <p className="trading-description">
              Our innovative dynamic UI technology delivers unmatched performance, making stock portfolio management more effective.
            </p>
          </div>

          <div className="trading-dashboard">
            <div className="price-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Stock Prices
              </h3>
              <div className="price-list">
                <div className="price-item">
                  <div className="coin-info">
                    <div className="coin-icon">₿</div>
                    <span className="coin-name">Bitcoin</span>
                  </div>
                  <div>
                    <span className="coin-price">0.289472</span>
                    <span className="price-change">+4.32%</span>
                  </div>
                </div>
                <div className="price-item">
                  <div className="coin-info">
                    <div className="coin-icon">T</div>
                    <span className="coin-name">Tesla</span>
                  </div>
                  <div>
                    <span className="coin-price">85.756283</span>
                    <span className="price-change negative">-1.23%</span>
                  </div>
                </div>
              </div>
              <p className="section-description">Live Data: Access up-to-date Stock prices and transaction volumes for efficient management.</p>
            </div>

            <div className="tools-section">
              <h3 className="section-title">Advanced Tools</h3>
              <div className="chart-container">
                <div className="price-value">$61,493.37</div>
                <div className="chart-line"></div>
              </div>
              <p className="section-description">Leverage our advanced UI to enhance your Portfolio.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="hero-section3">
        <div className="universe-interface">
          <div className="universe-header">
            <ScrollFloat containerClassName="universe-subtitle">
              THE CRYPTO UNIVERSE
            </ScrollFloat>
            <h2 className="universe-title">Entire Crypto Universe</h2>
            <p className="universe-description">
              Experience the comprehensive selection of cryptocurrencies available on our platform. 
              From major coins to emerging altcoins, we've got your crypto trading needs covered.
            </p>
          </div>
          <div className="crypto-icons-container">
            
            <IconStrip position="top" />
            <CubeeModel />
            <IconStrip position="bottom" />
            
          </div>
        </div>
      </div>

      <div className="hero-section4">
        <div className="dashboard-showcase">
          <div className="section-content">
            <div className="text-content">
              <h3 className="section-subtitle">DYNAMIC DASHBOARD</h3>
              <h2 className="section-title">Unlock Revolutionary Trading Technology</h2>
              <p className="section-description">
                Experience seamless trading with our advanced dashboard, designed to provide real-time insights
                and intuitive control over your portfolio.
              </p>
            </div>
            <div className="dashboard-preview">
              <div className="dashboard-image">
                <div className="glow-effect"></div>
                <img src="/dashboard-preview.png" alt="Trading Dashboard Interface" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <div className="footer-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 14L11 10L15 14L21 8" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>CryptoSoft</span>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem', maxWidth: '300px' }}>
              Your trusted partner in cryptocurrency portfolio management and trading analytics.
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon">
                <FaTwitter />
              </a>
              <a href="#" className="social-icon">
                <FaLinkedinIn />
              </a>
              <a href="#" className="social-icon">
                <FaGithub />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Company</h3>
            <div className="footer-links">
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Partners</a>
              <a href="#">Press Kit</a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Resources</h3>
            <div className="footer-links">
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Market Data</a>
              <a href="#">Blog</a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Support</h3>
            <div className="footer-links">
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 CryptoSoft. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;