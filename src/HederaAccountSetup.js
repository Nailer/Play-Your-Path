import React, { useState } from 'react';
import './HederaAccountSetup.css';
import { createHederaAccount } from './services/hederaService.js';
import { 
  FaWallet, 
  FaCopy, 
  FaEye, 
  FaEyeSlash, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaSpinner, 
  FaTimes,
  FaKey,
  FaCoins,
  FaExternalLinkAlt
} from 'react-icons/fa';

const HederaAccountSetup = ({ user, onAccountCreated, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState({ address: false, privateKey: false, publicKey: false, evmAddress: false });

  // Real Hedera account generation using SDK
  const generateHederaAccount = async () => {
    setIsGenerating(true);
    
    try {
      console.log('Creating Hedera account on testnet...');
      
      // Create real account using Hedera SDK
      const hederaAccount = await createHederaAccount();
      
      console.log('Hedera account created successfully:', hederaAccount);
      setAccountData(hederaAccount);
    } catch (error) {
      console.error('Error generating Hedera account:', error);
      alert(`Failed to generate Hedera account: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };


  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleConfirm = () => {
    if (accountData) {
      onAccountCreated(accountData);
    }
  };

  return (
    <div className="hedera-setup-overlay">
      <div className="hedera-setup-modal">
        <div className="hedera-setup-header">
          <div className="header-title">
            <FaWallet className="header-icon" />
            <h2>Create Hedera Account</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="hedera-setup-content">
          {!accountData ? (
            <div className="account-generation">
              <div className="generation-info">
                <h3>Generate Your Hedera Account</h3>
                <p>
                  This will create a new Hedera account for you to receive NFT rewards, 
                  participate in governance, and trade tokens in the PYP ecosystem.
                </p>
                <div className="warning-box">
                  <strong>
                    <FaExclamationTriangle className="warning-icon" />
                    Important:
                  </strong>
                  <ul>
                    <li><FaKey className="list-icon" /> Your private key will be shown only once</li>
                    <li><FaExclamationTriangle className="list-icon" /> Save it securely - we cannot recover it</li>
                    <li><FaExclamationTriangle className="list-icon" /> Never share your private key with anyone</li>
                    <li><FaExternalLinkAlt className="list-icon" /> This creates a real account on Hedera testnet</li>
                    <li><FaCoins className="list-icon" /> Account will be funded with 20 HBAR automatically</li>
                  </ul>
                </div>
              </div>
              
              <button 
                className="generate-btn"
                onClick={generateHederaAccount}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <FaSpinner className="spinner-icon" />
                    Generating Account...
                  </>
                ) : (
                  <>
                    <FaWallet />
                    Generate Hedera Account
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="account-details">
              <div className="success-message">
                <h3>
                  <FaCheckCircle className="success-icon" />
                  Account Created Successfully!
                </h3>
                <p>Your Hedera account has been generated. Please save your private key securely.</p>
              </div>

              <div className="account-info">
                <div className="info-section">
                  <label>Account ID (Address)</label>
                  <div className="copy-field">
                    <input 
                      type="text" 
                      value={accountData.accountId} 
                      readOnly 
                      className="account-id"
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(accountData.accountId, 'address')}
                    >
                      {copied.address ? (
                        <>
                          <FaCheckCircle />
                          Copied
                        </>
                      ) : (
                        <>
                          <FaCopy />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="info-section">
                  <label>Private Key</label>
                  <div className="private-key-section">
                    <div className="private-key-field">
                      <input 
                        type={showPrivateKey ? 'text' : 'password'} 
                        value={accountData.privateKey} 
                        readOnly 
                        className="private-key"
                      />
                      <button 
                        className="reveal-btn"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? (
                          <>
                            <FaEyeSlash />
                            Hide
                          </>
                        ) : (
                          <>
                            <FaEye />
                            Show
                          </>
                        )}
                      </button>
                    </div>
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(accountData.privateKey, 'privateKey')}
                    >
                      {copied.privateKey ? (
                        <>
                          <FaCheckCircle />
                          Copied
                        </>
                      ) : (
                        <>
                          <FaCopy />
                          Copy Private Key
                        </>
                      )}
                    </button>
                  </div>
                  <p className="private-key-warning">
                    <strong>
                      <FaExclamationTriangle className="warning-icon" />
                      CRITICAL:
                    </strong> Copy and save this private key immediately. 
                    Long press to select all text. We cannot recover it if lost!
                  </p>
                </div>

                <div className="info-section">
                  <label>Public Key</label>
                  <div className="copy-field">
                    <input 
                      type="text" 
                      value={accountData.publicKey} 
                      readOnly 
                      className="public-key"
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(accountData.publicKey, 'publicKey')}
                    >
                      {copied.publicKey ? (
                        <>
                          <FaCheckCircle />
                          Copied
                        </>
                      ) : (
                        <>
                          <FaCopy />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="info-section">
                  <label>EVM Address</label>
                  <div className="copy-field">
                    <input 
                      type="text" 
                      value={accountData.evmAddress} 
                      readOnly 
                      className="evm-address"
                    />
                    <button 
                      className="copy-btn"
                      onClick={() => copyToClipboard(accountData.evmAddress, 'evmAddress')}
                    >
                      {copied.evmAddress ? (
                        <>
                          <FaCheckCircle />
                          Copied
                        </>
                      ) : (
                        <>
                          <FaCopy />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="info-section">
                  <label>
                    <FaCoins className="label-icon" />
                    Balance
                  </label>
                  <div className="balance-display">
                    <span className="balance-amount">
                      <FaCoins className="balance-icon" />
                      {accountData.balance} HBAR
                    </span>
                    <span className="balance-note">Initial funding from testnet</span>
                  </div>
                </div>
              </div>

              <div className="setup-actions">
                <button className="confirm-btn" onClick={handleConfirm}>
                  <FaCheckCircle />
                  Confirm & Continue
                </button>
                <button className="regenerate-btn" onClick={() => setAccountData(null)}>
                  <FaWallet />
                  Generate New Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HederaAccountSetup;
