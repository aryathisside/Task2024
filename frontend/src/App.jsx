import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const socket = io('http://localhost:3005');

function App() {
  const [whaleData, setWhaleData] = useState([]);
  const [interval, setInterval] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.on('whaleData', (data) => {
      setWhaleData(data.transfers);
      setLoading(false);
    });

    // Simulate initial loading
    setTimeout(() => setLoading(false), 2000);

    return () => {
      socket.off('whaleData');
    };
  }, []);

  const handleSetInterval = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3005/set-interval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interval }),
      });
      const data = await response.json();
      console.log(data.message);
      setTimeout(() => setLoading(false), 1000);
    } catch (error) {
      console.error('Error setting interval:', error);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Whale Transaction Tracker
      </motion.h1>
      <motion.div
        className="interval-setter"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <input
          type="number"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          min="1"
        />
        <button onClick={handleSetInterval} disabled={loading}>
          {loading ? 'Setting...' : 'Set Interval (minutes)'}
        </button>
      </motion.div>
      <motion.div
        className="whale-data"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2>Recent Whale Transactions</h2>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading whale data...</p>
          </div>
        ) : whaleData.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Transaction Hash</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <AnimatePresence>
                {whaleData.map((transfer, index) => (
                  <motion.tr
                    key={transfer.transaction.hash}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <td>{transfer.transaction.hash.slice(0, 10)}...</td>
                    <td>{transfer.sender.address.slice(0, 10)}...</td>
                    <td>{transfer.receiver.address.slice(0, 10)}...</td>
                    <td>{transfer.currency.symbol || 'N/A'}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </table>
          </div>
        ) : (
          <motion.div
            className="no-data"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="no-data-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>No Whale Transactions Found</h3>
            <p>We haven't detected any significant transactions yet. Check back soon!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default App;