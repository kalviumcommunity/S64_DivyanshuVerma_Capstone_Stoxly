import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NewsSection.css';

const NewsSection = () => {
  const [news, setNews] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError('');
      try {
        // 1. Fetch user's holdings
        const holdingsRes = await axios.get('http://localhost:5000/api/portfolio', { withCredentials: true });
        const holdings = holdingsRes.data;
        const symbols = [...new Set(holdings.map(h => h.symbol).filter(Boolean))];
        console.log(symbols);
        if (symbols.length === 0) {
          setNews({});
          setIsLoading(false);
          return;
        }
        // 2. Fetch news for those symbols
        const newsRes = await axios.get(`http://localhost:5000/api/news?symbols=${symbols.join(',')}`);
        setNews(newsRes.data);
      } catch (err) {
        setError('Failed to fetch news.');
        setNews({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="news-section">
      <h2>Latest Market News for Your Holdings</h2>
      {isLoading && <div>Loading news...</div>}
      {error && <div className="error-message">{error}</div>}
      {!isLoading && !error && Object.keys(news).length === 0 && (
        <div>No news found for your holdings.</div>
      )}
      <div className="news-list">
        {Object.entries(news).map(([symbol, articles]) => (
          <div key={symbol} className="news-symbol-group">
            <h3>{symbol}</h3>
            {articles.length === 0 && <div className="no-news">No news for this holding.</div>}
            {articles.map(article => {
              const largeImage = article.images?.find(img => img.size === 'large');
              return (
                <div key={article.id} className="news-item news-item-row">
                  {largeImage && (
                    <img
                      src={largeImage.url}
                      alt={article.headline}
                      className="news-image-side"
                    />
                  )}
                  <div className="news-content-side">
                    <h4>{article.headline}</h4>
                    <p className="news-summary">{article.summary}</p>
                    <div className="news-meta">
                      <span>By {article.author}</span>
                      <span>{new Date(article.created_at).toLocaleString()}</span>
                      <span className="news-source">{article.source}</span>
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more">
                      Read More
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsSection; 