import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom'
import './App.css';
import GameFrame from './Gameframe.js';
import { AuthPage } from './AuthPage.js';
import UserProfile from './components/UserProfile.js';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

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

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <AuthPage />
      ) : (
        <div className="app">
          <div className="user-bar">
            <div className="user-welcome">
              <FaUser className="user-icon" />
              <span>Welcome, {user?.name || user?.email || "Player"}!</span>
            </div>
            <div className="user-actions">
              <button 
                onClick={() => setShowUserProfile(true)} 
                className="profile-btn"
                title="View Profile"
              >
                <FaUser />
                Profile
              </button>
              <button onClick={handleLogout} className="logout-btn">
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
          <GameFrame />
          
          {showUserProfile && (
            <UserProfile 
              user={user} 
              onClose={() => setShowUserProfile(false)} 
            />
          )}
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
