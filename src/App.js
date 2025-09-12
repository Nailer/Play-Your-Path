import React, { useState, useEffect } from 'react';
import './App.css';
import GameFrame from './Gameframe';
import LoginScreen from './LoginScreen';
import HederaAccountSetup from './HederaAccountSetup';
import UserProfile from './components/UserProfile';
import { createUserProfile, createHederaAccount } from './lib/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showHederaSetup, setShowHederaSetup] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

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

  const handleLogin = async (userData) => {
    try {
      // Create user profile in Supabase
      const profileData = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        auth_type: userData.authType,
        wallet_address: userData.walletAddress
      };
      
      await createUserProfile(profileData);
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('pyp-auth', JSON.stringify({ user: userData }));
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Still allow login even if profile creation fails
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('pyp-auth', JSON.stringify({ user: userData }));
    }
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
        <div className="user-actions">
          <button 
            onClick={() => setShowUserProfile(true)} 
            className="profile-btn"
          >
            Profile
          </button>
          {user?.authType === 'email' && !user?.hederaAccount && (
            <button 
              onClick={() => setShowHederaSetup(true)} 
              className="hedera-setup-btn"
            >
              Create Hedera Account
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      
      {showHederaSetup && (
        <HederaAccountSetup 
          user={user}
          onAccountCreated={async (hederaAccount) => {
            try {
              // Save Hedera account to Supabase
              await createHederaAccount(user.id, hederaAccount);
              
              const updatedUser = { ...user, hederaAccount };
              setUser(updatedUser);
              localStorage.setItem('pyp-auth', JSON.stringify({ user: updatedUser }));
              setShowHederaSetup(false);
            } catch (error) {
              console.error('Error saving Hedera account:', error);
              alert('Account created but failed to save to database. Please try again.');
            }
          }}
          onClose={() => setShowHederaSetup(false)}
        />
      )}
      
      {showUserProfile && (
        <UserProfile 
          user={user}
          onClose={() => setShowUserProfile(false)}
        />
      )}
      
      <GameFrame />
    </div>
  );
}

export default App;
