import React, { useState } from 'react';
import './LoginScreen.css';
import { AuthService } from './services/authService.js';

const LoginScreen = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
      }

      // Use AuthService for authentication
      const { data, error } = isSignUp 
        ? await AuthService.signUp(formData.email, formData.password, formData.name)
        : await AuthService.signIn(formData.email, formData.password);

      if (error) {
        throw error;
      }

      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHashPackLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Use AuthService for HashPack authentication
      const { data, error } = await AuthService.signInWithHashPack();

      if (error) {
        throw error;
      }

      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>Play Your Path (PYP)</h1>
          <p>African-inspired adventures in the PYP Hub</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={!isSignUp ? 'active' : ''} 
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
          <button 
            className={isSignUp ? 'active' : ''} 
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="auth-methods">
          {/* HashPack Wallet Login */}
          <div className="wallet-login">
            <button 
              className="hashpack-btn"
              onClick={handleHashPackLogin}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect with HashPack'}
            </button>
            <p className="wallet-description">
              Connect your Hedera wallet to access NFT rewards and governance features
            </p>
          </div>

          <div className="divider">
            <span>or</span>
          </div>

          {/* Email/Password Auth */}
          <form onSubmit={handleEmailAuth} className="email-auth">
            {isSignUp && (
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            )}
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            {isSignUp && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            )}
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              className="toggle-auth"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
