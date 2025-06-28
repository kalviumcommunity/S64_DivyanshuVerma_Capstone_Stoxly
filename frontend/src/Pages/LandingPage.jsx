// src/components/LandingPage.jsx
"use client"
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import Lenis from 'lenis';
import { FaTwitter, FaLinkedinIn, FaGithub } from 'react-icons/fa';
import { useGLTF } from '@react-three/drei'; // Import useGLTF here for preloading

// Lazy load heavy components
const Hero3DScene = lazy(() => import('../components/Hero3DScene'));
const BitcoinModel = lazy(() => import('../components/BitcoinModel'));
const CubeeModel = lazy(() => import('../components/CubeeModel'));
const IconStrip = lazy(() => import('../components/IconStrip'));
const ScrollFloat = lazy(() => import('../components/ScrollFloat'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-fallback">
    <div className="loading-spinner"></div>
  </div>
);

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState({
    hero: true,
    bitcoin: false,
    cubee: false,
    dashboard: false
  });

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });
    
    // Preload 3D models as soon as the page component mounts
    useGLTF.preload('/colored_coins.glb');
    useGLTF.preload('/bitcoin_final.glb');
    useGLTF.preload('/cubee.glb');

    // Intersection Observer for lazy loading components
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          } else {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: false
            }));
          }
        });
      },
      { threshold: 0.2 } // Slightly increase threshold to load earlier
    );

    // Observe sections
    const sections = document.querySelectorAll('.section-observer');
    sections.forEach(section => observer.observe(section));
    
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    
    const rafId = requestAnimationFrame(raf);
    
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      observer.disconnect();
    };
  }, []);
    
  return (
    <div className="landing-container">
      <div className="navbar">
        <div className="logo-container">
          <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3V21H21" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 14L11 10L15 14L21 8" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">Stoxly</span>
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
      
      <div id="hero" className="hero-section section-observer">
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
          {isVisible.hero && (
            <Suspense fallback={<LoadingFallback />}>
              <Hero3DScene />
            </Suspense>
          )}
        </div>
      </div>

      <div id="bitcoin" className="hero-section2 section-observer">
        {isVisible.bitcoin && (
          <Suspense fallback={<LoadingFallback />}>
            <BitcoinModel />
          </Suspense>
        )}
        <section className="trading-interface">
          <div className="trading-header">
            <Suspense fallback={<div>JOIN THE REVOLUTION</div>}>
              <ScrollFloat containerClassName="trading-subtitle">
                JOIN THE REVOLUTION
              </ScrollFloat>
            </Suspense>
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

      <div id="cubee" className="hero-section3 section-observer">
        <div className="universe-interface">
          <div className="universe-header">
            <Suspense fallback={<div>THE CRYPTO UNIVERSE</div>}>
              <ScrollFloat containerClassName="universe-subtitle">
                THE CRYPTO UNIVERSE
              </ScrollFloat>
            </Suspense>
            <h2 className="universe-title">Entire Crypto Universe</h2>
            <p className="universe-description">
              Experience the comprehensive selection of cryptocurrencies available on our platform. 
              From major coins to emerging altcoins, we've got your crypto trading needs covered.
            </p>
          </div>
          <div className="crypto-icons-container">
            {isVisible.cubee && (
              <>
                <Suspense fallback={<LoadingFallback />}>
                  <IconStrip position="top" />
                  <CubeeModel />
                  <IconStrip position="bottom" />
                </Suspense>
              </>
            )}
          </div>
        </div>
      </div>

      <div id="dashboard" className="hero-section4 section-observer">
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
                <img src="/dashboard-preview.png" alt="Trading Dashboard Interface" loading="lazy" />
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
              <span>Stoxly</span>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem', maxWidth: '300px' }}>
              Your trusted partner in portfolio management.
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon">
                <FaTwitter />
              </a>
              <a href="#" className="social-icon">
                <FaLinkedinIn />
              </a>
              <a href="https://github.com/kalviumcommunity/S64_DivyanshuVerma_Capstone_Stoxly" className="social-icon">
                <FaGithub />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Company</h3>
            <div className="footer-links">
              <a href="">About Us</a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Resources</h3>
            <div className="footer-links">
              <a href="https://docs.alpaca.markets/docs/getting-started">Documentation</a>
              <a href="https://docs.alpaca.markets/reference">API Reference</a>
              <a href="https://docs.alpaca.markets/docs/getting-started-with-alpaca-market-data">Market Data</a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Support</h3>
            <div className="footer-links">
              <a href="mailto:divyanshuverma811@gmail.com">Contact Us</a>
              <a href="https://s3.amazonaws.com/files.alpaca.markets/disclosures/library/TermsAndConditions.pdf">Terms of Service</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Stoxly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;