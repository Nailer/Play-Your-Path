import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css';
import GameFrame from './Gameframe';
import { AuthPage } from './AuthPage';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing auth state
    const savedAuth = localStorage.getItem("pyp-auth");
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setUser(authData.user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem("pyp-auth");
      }
    }
  }, []);

  const handleLogin = async (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("pyp-auth", JSON.stringify({ user: userData }));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("pyp-auth");
  };

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="app">
      <div className="user-bar">
        <div className="user-welcome">
          <FaUser className="user-icon" />
          <span>Welcome, {user?.name || user?.email || "Player"}!</span>
        </div>
        <div className="user-actions">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
      <GameFrame />
    </div>
  );
}

export default App;
