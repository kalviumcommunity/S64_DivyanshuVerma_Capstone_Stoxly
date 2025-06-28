# 📈 Stoxly (Stock Market Portfolio Tracker)

[![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)](https://react.dev/) 
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)](https://nodejs.org/) 
[![Express](https://img.shields.io/badge/API-Express-black?logo=express)](https://expressjs.com/) 
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?logo=mongodb)](https://www.mongodb.com/) 
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)](https://jwt.io/) 
[![Alpaca](https://img.shields.io/badge/Stock%20Data-Alpaca-0055FF?logo=alpaca)](https://alpaca.markets/) 
[![Three.js](https://img.shields.io/badge/3D-Three.js-000?logo=three.js)](https://threejs.org/)

---

## 🌐 Deployment

- 🔗 [Live Site (Frontend)](https://stoxly.netlify.app)

---

## 🎥 Demo

![Demo](./assets/demo.gif)

---

## 📸 Screenshots

### 📊 Portfolio Dashboard
<img src="./assets/portfolio.png" alt="Dashboard Screenshot" width="100%" />

### 🎮 3D Landing Page
<img src="./assets/landingPage.PNG" alt="3D Screenshot" width="100%" />

---

## 📝 Overview

Tracking stock investments manually can be challenging, leading to difficulties in monitoring profits/losses, retrieving historical data, and visualizing market trends?

**Stoxly** is a modern full-stack web application designed to help users manage and analyze their stock investments with ease. By integrating real-time stock data, interactive dashboards, and 3D visuals, it delivers a robust experience for both beginners and experienced traders.

---

## ✨ Features

- 🔐 **Secure Authentication** – User login and registration powered by JWT.
- 📊 **Portfolio Dashboard** – Add, update, and remove stocks in a personal portfolio.
- 📈 **Live Market Data** – Real-time stock prices and updates via Alpaca API and WebSocket.
- 📉 **Analytics & Insights** – Visualize profits, losses, and historical trends.
- 🌐 **3D Interactive UI** – Engaging, animated elements and charts powered by Three.js.
- 📰 **Market News** – Stay updated with top headlines and movers in the stock market.

---

## 🛠️ Tech Stack

### Frontend
- [React.js](https://react.dev/)
- CSS 

### Backend
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- JWT Authentication
- WebSocket for real-time data

### APIs & Services
- [Alpaca API](https://alpaca.markets/) – Real-time stock data
- [TradingView](https://www.tradingview.com/) – Optional charting integration

### Visualization
- [Three.js](https://threejs.org/) – 3D interactive visuals

---

## Getting Started

### Prerequisites
- Node.js & npm
- MongoDB Atlas account
- Alpaca API key (go [here](https://alpaca.markets/) for keys)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/kalviumcommunity/S64_DivyanshuVerma_Capstone_Stoxly.git
   cd S64_DivyanshuVerma_Capstone_Stoxly
   ```
2. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. **Set up environment variables:**
   - Create `.env` files in `backend` directory (see `.env.example`).
4. **Run the application:**
   - Start backend:
     ```bash
     cd backend && npm run dev
     ```
   - Start frontend:
     ```bash
     cd frontend && npm run dev
     ```

## Usage
- Register or log in to your account.
- Add stocks to your portfolio and track their performance in real time.
- Explore interactive charts and 3D visualizations.
- Stay informed with live news and market movers.


## 🚀 Quick Start with Docker

### 1. Create `.env` file
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Run the app
```bash
docker-compose up --build
```

### 3. Open your browser
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🛑 Stop the app
```bash
docker-compose down
```

## Contributing
Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features.

## License
This project is licensed under the MIT License.
 modern, real-time stock market portfolio tracking application built with React, Node.js, and MongoDB.

