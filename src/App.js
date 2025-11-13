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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth state synchronously to prevent flash
    // localStorage is always available in browser context
    const checkAuth = () => {
      try {
        const savedAuth = localStorage.getItem("pyp-auth");
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          if (authData && authData.user) {
            setUser(authData.user);
            setIsAuthenticated(true);
          } else {
            // Invalid auth data, clean it up
            localStorage.removeItem("pyp-auth");
          }
        }
      } catch (e) {
        console.error("Error parsing auth data:", e);
        localStorage.removeItem("pyp-auth");
      } finally {
        // Always set loading to false after check completes
        setIsLoading(false);
      }
    };

    // Check auth immediately - localStorage is available synchronously
    if (typeof window !== 'undefined') {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  // handleLogin can be used if AuthPage needs to pass user data up
  // Currently AuthPage handles its own state
  // const handleLogin = async (userData) => {
  //   setUser(userData);
  //   setIsAuthenticated(true);
  //   localStorage.setItem("pyp-auth", JSON.stringify({ user: userData }));
  // };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("pyp-auth", JSON.stringify({ user: userData }));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("pyp-auth");
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTop: '4px solid #4f46e5',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading Play Your Path...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <AuthPage onLogin={handleLogin} />
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
