import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { getUserProfile, updateHederaBalance } from '../lib/supabase';
import { getAccountBalance } from '../services/hederaService';
import WalletService from '../services/walletService';
import { initHashConnect, getHashConnect } from '../utils/hashconnect';
import { 
  FaUser, 
  FaTimes, 
  FaSpinner, 
  FaSyncAlt, 
  FaCoins, 
  FaWallet, 
  FaExclamationTriangle,
  FaEnvelope,
  FaGem,
  FaTrophy,
  FaCalendarAlt,
  FaCopy,
  FaExternalLinkAlt,
  FaPaperPlane,
  FaHistory,
  FaImage,
  FaCheckCircle,
  FaSignInAlt,
  FaLongArrowAltRight,
  FaLayerGroup
} from 'react-icons/fa';

const UserProfile = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hbarBalance, setHbarBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAccountId, setWalletAccountId] = useState(null);
  
  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferMemo, setTransferMemo] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadUserProfile();
    checkWalletConnection();
  }, [user]);

  const checkWalletConnection = () => {
    const connected = WalletService.isConnected();
    setIsWalletConnected(connected);
    if (connected) {
      setWalletAccountId(WalletService.getConnectedAccountId());
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile(user.profileId || user.id);
      setProfile(userProfile);
      
      // Load balance if account exists
      if (userProfile?.hedera_accounts?.[0]) {
        await refreshBalance(userProfile.hedera_accounts[0].account_id);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async (accountId) => {
    if (!accountId) return;
    
    try {
      setRefreshing(true);
      const balance = await getAccountBalance(accountId);
      setHbarBalance(balance);
      
      // Update in Supabase if profile exists
      if (profile?.hedera_accounts?.[0]) {
        await updateHederaBalance(accountId, balance);
        setProfile(prev => ({
          ...prev,
          hedera_accounts: [{
            ...prev.hedera_accounts[0],
            balance: balance,
            last_balance_check: new Date().toISOString()
          }]
        }));
      }
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError('Failed to refresh balance');
    } finally {
      setRefreshing(false);
    }
  };

  const loadTransactions = async () => {
    const accountId = walletAccountId || profile?.hedera_accounts?.[0]?.account_id;
    if (!accountId) {
      setError('No account ID available');
      return;
    }

    try {
      setLoadingTransactions(true);
      const txns = await WalletService.getTransactionHistory(accountId);
      setTransactions(txns);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadNfts = async () => {
    const accountId = walletAccountId || profile?.hedera_accounts?.[0]?.account_id;
    if (!accountId) {
      setError('No account ID available');
      return;
    }

    try {
      setLoadingNfts(true);
      const nftCollection = await WalletService.getNftCollection(accountId);
      setNfts(nftCollection);
      
      // Also load token balances
      const tokenBalances = await WalletService.getTokenBalances(accountId);
      setTokens(tokenBalances);
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError('Failed to load NFT collection');
    } finally {
      setLoadingNfts(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const { initHashConnect } = await import('../utils/hashconnect');
      const hashconnect = await initHashConnect({
        name: "Play Your Path",
        description: "Learn & earn with Hedera",
        icon: `${window.location.origin}/logo192.png`,
        url: window.location.origin,
      });

      if (!hashconnect) {
        throw new Error('Failed to initialize HashConnect');
      }

      // Open pairing modal (HashConnect v3)
      await hashconnect.openPairingModal();

      // Listen for pairing (HashConnect v3)
      hashconnect.pairingEvent.on((pairingData) => {
        if (pairingData && pairingData.accountIds && pairingData.accountIds.length > 0) {
          const accountIdStr = pairingData.accountIds[0]; // Already string in v3
          setIsWalletConnected(true);
          setWalletAccountId(accountIdStr);
          setLoading(false);
        }
      });
      
      // Check if already connected
      if (hashconnect.connectedAccountIds && hashconnect.connectedAccountIds.length > 0) {
        const existingAccountId = hashconnect.connectedAccountIds[0].toString();
        setIsWalletConnected(true);
        setWalletAccountId(existingAccountId);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please ensure HashPack extension is installed.');
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferAmount || !transferTo || parseFloat(transferAmount) <= 0) {
      setError('Please enter valid transfer details');
      return;
    }

    try {
      setTransferring(true);
      setError(null);
      
      const result = await WalletService.transferHbar({
        toAccountId: transferTo,
        amount: parseFloat(transferAmount),
        memo: transferMemo
      });

      if (result.success) {
        // Show success and refresh balance
        alert(`Transfer successful! View on HashScan: ${result.hashscanUrl}`);
        setShowTransfer(false);
        setTransferAmount('');
        setTransferTo('');
        setTransferMemo('');
        
        // Refresh balance
        const accountId = walletAccountId || profile?.hedera_accounts?.[0]?.account_id;
        if (accountId) {
          setTimeout(() => refreshBalance(accountId), 2000);
        }
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could show a toast notification here
  };

  const getAccountId = () => {
    return walletAccountId || profile?.hedera_accounts?.[0]?.account_id;
  };

  const formatDate = (timestamp) => {
    try {
      // Handle both seconds and nanoseconds
      const date = timestamp.includes('.') 
        ? new Date(parseFloat(timestamp) * 1000)
        : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="user-profile-overlay">
        <div className="user-profile-modal">
          <div className="loading-spinner">
            <FaSpinner className="spinner-icon" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const accountId = getAccountId();

  return (
    <div className="user-profile-overlay">
      <div className="user-profile-modal">
        <div className="profile-header">
          <div className="header-title">
            <FaUser className="header-icon" />
            <h2>User Profile</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Wallet Connection Banner */}
        {!isWalletConnected && (
          <div className="wallet-connect-banner">
            <FaWallet className="banner-icon" />
            <div className="banner-content">
              <h3>Connect HashPack Wallet</h3>
              <p>Connect your wallet to transfer HBAR, view transactions, and manage NFTs</p>
            </div>
            <button className="connect-btn" onClick={handleConnectWallet} disabled={loading}>
              {loading ? <FaSpinner className="spinner-icon" /> : <FaSignInAlt />}
              Connect Wallet
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="profile-tabs">
          <button 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser /> Profile
          </button>
          <button 
            className={activeTab === 'wallet' ? 'active' : ''}
            onClick={() => {
              setActiveTab('wallet');
              if (accountId) refreshBalance(accountId);
            }}
          >
            <FaWallet /> Wallet
          </button>
          <button 
            className={activeTab === 'transactions' ? 'active' : ''}
            onClick={() => {
              setActiveTab('transactions');
              if (accountId) loadTransactions();
            }}
          >
            <FaHistory /> Transactions
          </button>
          <button 
            className={activeTab === 'nfts' ? 'active' : ''}
            onClick={() => {
              setActiveTab('nfts');
              if (accountId) loadNfts();
            }}
          >
            <FaImage /> NFTs & Tokens
          </button>
        </div>

        <div className="profile-content">
          {error && (
            <div className="error-message">
              <FaExclamationTriangle className="error-icon" />
              {error}
              <button onClick={() => setError(null)}>
                <FaTimes />
              </button>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="profile-section">
                <h3>
                  <FaUser className="section-icon" />
                  Account Information
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>
                      <FaUser className="label-icon" />
                      Name
                    </label>
                    <span>{profile?.name || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FaEnvelope className="label-icon" />
                      Email
                    </label>
                    <span>{profile?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FaGem className="label-icon" />
                      Auth Type
                    </label>
                    <span className={`auth-badge ${profile?.auth_type}`}>
                      {profile?.auth_type || 'unknown'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FaCalendarAlt className="label-icon" />
                      Member Since
                    </label>
                    <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {profile?.hedera_accounts?.[0] && (
                <div className="profile-section">
                  <h3>
                    <FaWallet className="section-icon" />
                    Hedera Account Details
                  </h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>
                        <FaWallet className="label-icon" />
                        Account ID
                      </label>
                      <div className="copyable-text">
                        <span className="account-id">{profile.hedera_accounts[0].account_id}</span>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(profile.hedera_accounts[0].account_id)}
                          title="Copy"
                        >
                          <FaCopy />
                        </button>
                        <a
                          href={`https://hashscan.io/testnet/account/${profile.hedera_accounts[0].account_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link"
                          title="View on HashScan"
                        >
                          <FaExternalLinkAlt />
                        </a>
                      </div>
                    </div>
                    <div className="info-item">
                      <label>
                        <FaWallet className="label-icon" />
                        EVM Address
                      </label>
                      <div className="copyable-text">
                        <span className="evm-address">{profile.hedera_accounts[0].evm_address}</span>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(profile.hedera_accounts[0].evm_address)}
                          title="Copy"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div className="tab-content">
              {accountId ? (
                <>
                  <div className="balance-section">
                    <div className="balance-card-large">
                      <div className="balance-header">
                        <FaCoins className="balance-icon-large" />
                        <h3>HBAR Balance</h3>
                      </div>
                      <div className="balance-amount-large">
                        {hbarBalance.toFixed(4)} <span className="hbar-label">HBAR</span>
                      </div>
                      <div className="balance-actions">
                        <button 
                          className="action-btn primary"
                          onClick={() => refreshBalance(accountId)}
                          disabled={refreshing}
                        >
                          {refreshing ? (
                            <><FaSpinner className="spinner-icon" /> Refreshing...</>
                          ) : (
                            <><FaSyncAlt /> Refresh</>
                          )}
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => setShowTransfer(!showTransfer)}
                        >
                          <FaPaperPlane /> Transfer HBAR
                        </button>
                      </div>
                    </div>

                    {showTransfer && (
                      <div className="transfer-modal">
                        <h4>Transfer HBAR</h4>
                        <form onSubmit={handleTransfer}>
                          <div className="form-group">
                            <label>To Account ID</label>
                            <input
                              type="text"
                              value={transferTo}
                              onChange={(e) => setTransferTo(e.target.value)}
                              placeholder="0.0.123456"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Amount (HBAR)</label>
                            <input
                              type="number"
                              step="0.00000001"
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Memo (Optional)</label>
                            <input
                              type="text"
                              value={transferMemo}
                              onChange={(e) => setTransferMemo(e.target.value)}
                              placeholder="Transfer memo"
                            />
                          </div>
                          <div className="form-actions">
                            <button 
                              type="button" 
                              className="cancel-btn"
                              onClick={() => {
                                setShowTransfer(false);
                                setTransferAmount('');
                                setTransferTo('');
                                setTransferMemo('');
                              }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              className="submit-btn"
                              disabled={transferring}
                            >
                              {transferring ? (
                                <><FaSpinner className="spinner-icon" /> Transferring...</>
                              ) : (
                                <><FaPaperPlane /> Send</>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="account-info-card">
                      <div className="info-item">
                        <label>Account ID</label>
                        <div className="copyable-text">
                          <span>{accountId}</span>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(accountId)}
                            title="Copy"
                          >
                            <FaCopy />
                          </button>
                          <a
                            href={`https://hashscan.io/testnet/account/${accountId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                            title="View on HashScan"
                          >
                            <FaExternalLinkAlt /> View on HashScan
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-account-message">
                  <FaWallet className="message-icon" />
                  <h3>No Hedera Account</h3>
                  <p>Create a Hedera account or connect your HashPack wallet to view balance and transfer HBAR.</p>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="tab-content">
              {accountId ? (
                <>
                  {loadingTransactions ? (
                    <div className="loading-state">
                      <FaSpinner className="spinner-icon" />
                      <p>Loading transactions...</p>
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="transactions-list">
                      <h3>Recent Transactions</h3>
                      {transactions.map((tx, idx) => (
                        <div key={idx} className="transaction-item">
                          <div className="transaction-header">
                            <div className="transaction-type">
                              <FaLongArrowAltRight />
                              <span>{tx.type || 'Transaction'}</span>
                            </div>
                            <a
                              href={tx.hashscanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hashscan-link"
                            >
                              View on HashScan <FaExternalLinkAlt />
                            </a>
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-id">
                              <label>Transaction ID:</label>
                              <span>{tx.transactionId}</span>
                            </div>
                            <div className="transaction-date">
                              <label>Date:</label>
                              <span>{formatDate(tx.timestamp)}</span>
                            </div>
                            {tx.memo && (
                              <div className="transaction-memo">
                                <label>Memo:</label>
                                <span>{tx.memo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <FaHistory className="empty-icon" />
                      <p>No transactions found</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-account-message">
                  <FaHistory className="message-icon" />
                  <h3>No Account Available</h3>
                  <p>Connect your wallet or create a Hedera account to view transactions.</p>
                </div>
              )}
            </div>
          )}

          {/* NFTs & Tokens Tab */}
          {activeTab === 'nfts' && (
            <div className="tab-content">
              {accountId ? (
                <>
                  {loadingNfts ? (
                    <div className="loading-state">
                      <FaSpinner className="spinner-icon" />
                      <p>Loading NFTs and tokens...</p>
                    </div>
                  ) : (
                    <>
                      {/* NFTs Section */}
                      <div className="nfts-section">
                        <h3>
                          <FaImage className="section-icon" />
                          NFTs ({nfts.length})
                        </h3>
                        {nfts.length > 0 ? (
                          <div className="nfts-grid">
                            {nfts.map((nft, idx) => (
                              <div key={idx} className="nft-card">
                                <div className="nft-header">
                                  <FaGem className="nft-icon" />
                                  <div className="nft-info">
                                    <div className="nft-token-id">{nft.tokenId}</div>
                                    <div className="nft-serial">Serial #{nft.serialNumber}</div>
                                  </div>
                                </div>
                                <a
                                  href={nft.hashscanUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hashscan-link"
                                >
                                  View on HashScan <FaExternalLinkAlt />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <FaImage className="empty-icon" />
                            <p>No NFTs found</p>
                          </div>
                        )}
                      </div>

                      {/* Tokens Section */}
                      <div className="tokens-section">
                        <h3>
                          <FaLayerGroup className="section-icon" />
                          Tokens ({tokens.length})
                        </h3>
                        {tokens.length > 0 ? (
                          <div className="tokens-list">
                            {tokens.map((token, idx) => (
                              <div key={idx} className="token-item">
                                <div className="token-info">
                                  <div className="token-name">
                                    <strong>{token.tokenName}</strong>
                                    <span className="token-symbol">({token.tokenSymbol})</span>
                                  </div>
                                  <div className="token-balance">
                                    {token.balance / Math.pow(10, token.decimals || 0)} {token.tokenSymbol}
                                  </div>
                                </div>
                                <a
                                  href={token.hashscanUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hashscan-link"
                                >
                                  View on HashScan <FaExternalLinkAlt />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <FaLayerGroup className="empty-icon" />
                            <p>No tokens found</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="no-account-message">
                  <FaImage className="message-icon" />
                  <h3>No Account Available</h3>
                  <p>Connect your wallet or create a Hedera account to view NFTs and tokens.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
