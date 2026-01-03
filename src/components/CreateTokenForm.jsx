import React, { useState } from 'react';
import { hederaService } from '../services/hederaService';
import { FaCoins, FaSpinner, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import './TokenCreator.css';

const CreateTokenForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 8,
    initialSupply: 0,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'decimals' || name === 'initialSupply' 
        ? (value === '' ? '' : Number(value))
        : value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Token name is required');
      return false;
    }
    if (formData.name.length > 50) {
      setError('Token name must be 50 characters or less');
      return false;
    }
    if (!formData.symbol.trim()) {
      setError('Token symbol is required');
      return false;
    }
    if (formData.symbol.length > 10) {
      setError('Token symbol must be 10 characters or less');
      return false;
    }
    if (formData.decimals < 0 || formData.decimals > 18) {
      setError('Decimals must be between 0 and 18');
      return false;
    }
    if (formData.initialSupply < 0) {
      setError('Initial supply cannot be negative');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const result = await hederaService.createFungibleToken({
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        decimals: formData.decimals,
        initialSupply: formData.initialSupply
      });

      setSuccess({
        tokenId: result.tokenId,
        name: formData.name,
        symbol: formData.symbol.toUpperCase()
      });

      // Notify parent component
      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          symbol: '',
          decimals: 8,
          initialSupply: 0,
          description: ''
        });
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Token creation error:', err);
      setError(err.message || 'Failed to create token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="token-creator-overlay" onClick={onClose}>
      <div className="token-creator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="token-creator-header">
          <div className="token-creator-title">
            <FaCoins className="token-creator-icon" />
            <h2>Create Your Token</h2>
          </div>
          <button className="token-creator-close" onClick={onClose}>×</button>
        </div>

        <div className="token-creator-content">
          {success ? (
            <div className="token-creator-success">
              <FaCheckCircle className="success-icon" />
              <h3>Token Created Successfully! 🎉</h3>
              <div className="success-details">
                <p><strong>Name:</strong> {success.name}</p>
                <p><strong>Symbol:</strong> {success.symbol}</p>
                <p><strong>Token ID:</strong></p>
                <code className="token-id">{success.tokenId}</code>
                <button 
                  className="copy-token-id"
                  onClick={() => {
                    navigator.clipboard.writeText(success.tokenId);
                    alert('Token ID copied to clipboard!');
                  }}
                >
                  Copy Token ID
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="token-creator-form">
              <div className="form-group">
                <label htmlFor="name">
                  Token Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., My Awesome Token"
                  maxLength={50}
                  required
                  disabled={loading}
                />
                <small>Choose a memorable name for your token (max 50 characters)</small>
              </div>

              <div className="form-group">
                <label htmlFor="symbol">
                  Token Symbol <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  placeholder="e.g., MAT"
                  maxLength={10}
                  required
                  disabled={loading}
                  style={{ textTransform: 'uppercase' }}
                />
                <small>Ticker symbol (max 10 characters, will be uppercase)</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="decimals">
                    Decimals
                  </label>
                  <input
                    type="number"
                    id="decimals"
                    name="decimals"
                    value={formData.decimals}
                    onChange={handleChange}
                    min="0"
                    max="18"
                    required
                    disabled={loading}
                  />
                  <small>Number of decimal places (0-18)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="initialSupply">
                    Initial Supply
                  </label>
                  <input
                    type="number"
                    id="initialSupply"
                    name="initialSupply"
                    value={formData.initialSupply}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    required
                    disabled={loading}
                  />
                  <small>Starting token supply</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your token..."
                  rows="3"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="form-error">
                  <FaTimesCircle className="error-icon" />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-info">
                <FaInfoCircle className="info-icon" />
                <p>
                  Your token will be created on Hedera Testnet. 
                  Make sure you have sufficient HBAR for transaction fees.
                </p>
              </div>

              <button 
                type="submit" 
                className="create-token-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" />
                    Creating Token...
                  </>
                ) : (
                  <>
                    <FaCoins />
                    Create Token
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTokenForm;
