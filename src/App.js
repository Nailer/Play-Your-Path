import React, { useState, useEffect } from 'react';
import './App.css';
import GameFrame from './Gameframe';
import LoginScreen from './LoginScreen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing auth state
    const savedAuth = localStorage.getItem('pyp-auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setUser(authData.user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('pyp-auth');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('pyp-auth', JSON.stringify({ user: userData }));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('pyp-auth');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="user-bar">
        <span>Welcome, {user?.name || user?.email || 'Player'}!</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      <GameFrame />
    </div>
  );
}

export default App;
