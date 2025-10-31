import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { getUserProfile, updateHederaBalance, getTokenBalances, getDailyPoints, listFriends, fetchInbox } from '../lib/supabase';
import { getAccountBalance } from '../services/hederaService';
import { 
  FaUser, 
  FaTimes, 
  FaSpinner, 
  FaSyncAlt, 
  FaCoins, 
  FaWallet, 
  FaExclamationTriangle,
  FaEnvelope,
  FaUserFriends,
  FaGem,
  FaTrophy,
  FaCalendarAlt
} from 'react-icons/fa';

const UserProfile = ({ user, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [balances, setBalances] = useState([]);
  const [daily, setDaily] = useState(null);
  const [friends, setFriends] = useState([]);
  const [inbox, setInbox] = useState([]);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile(user.profileId || user.id);
      setProfile(userProfile);
      const [bals, dp, fr, ib] = await Promise.all([
        getTokenBalances(user.profileId || user.id),
        getDailyPoints(user.profileId || user.id),
        listFriends(user.profileId || user.id),
        fetchInbox(user.profileId || user.id)
      ]);
      setBalances(bals);
      setDaily(dp);
      setFriends(fr);
      setInbox(ib);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (!profile?.hedera_accounts?.[0]) return;

    try {
      setRefreshing(true);
      const hederaAccount = profile.hedera_accounts[0];
      
      // Get fresh balance from Hedera
      const newBalance = await getAccountBalance(hederaAccount.account_id);
      
      // Update in Supabase
      await updateHederaBalance(hederaAccount.account_id, newBalance);
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        hedera_accounts: [{
          ...hederaAccount,
          balance: newBalance,
          last_balance_check: new Date().toISOString()
        }]
      }));
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError('Failed to refresh balance');
    } finally {
      setRefreshing(false);
    }
  };

  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(2);
  };

  const formatAccountId = (accountId) => {
    return accountId || 'Not created';
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
                <span>{profile?.email}</span>
              </div>
              <div className="info-item">
                <label>
                  <FaGem className="label-icon" />
                  Auth Type
                </label>
                <span className={`auth-badge ${profile?.auth_type}`}>
                  {profile?.auth_type}
                </span>
              </div>
              <div className="info-item">
                <label>
                  <FaCalendarAlt className="label-icon" />
                  Member Since
                </label>
                <span>{new Date(profile?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {profile?.hedera_accounts?.[0] && (
            <div className="profile-section">
              <div className="section-header">
                <h3>
                  <FaWallet className="section-icon" />
                  Hedera Account
                </h3>
                <button 
                  className="refresh-btn"
                  onClick={refreshBalance}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <FaSpinner className="spinner-icon" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <FaSyncAlt />
                      Refresh Balance
                    </>
                  )}
                </button>
              </div>
              
              <div className="hedera-info">
                <div className="balance-card">
                  <div className="balance-amount">
                    <FaCoins className="balance-icon" />
                    {formatBalance(profile.hedera_accounts[0].balance)} HBAR
                  </div>
                  <div className="balance-label">Current Balance</div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>
                      <FaGem className="label-icon" />
                      Tier
                    </label>
                    <span>{profile?.tier || 'bronze'}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FaTrophy className="label-icon" />
                      XP
                    </label>
                    <span>{profile?.xp || 0}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FaCoins className="label-icon" />
                      Daily Points
                    </label>
                    <span>{daily?.points || 0}</span>
                  </div>
                </div>

                <div className="info-grid" style={{ marginTop: '12px' }}>
                  <div className="info-item">
                    <label>
                      <FaWallet className="label-icon" />
                      Account ID
                    </label>
                    <span className="account-id">
                      {formatAccountId(profile.hedera_accounts[0].account_id)}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FaWallet className="label-icon" />
                      EVM Address
                    </label>
                    <span className="evm-address">
                      {profile.hedera_accounts[0].evm_address}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>
                      <FaCalendarAlt className="label-icon" />
                      Last Balance Check
                    </label>
                    <span>
                      {new Date(profile.hedera_accounts[0].last_balance_check).toLocaleString()}
                    </span>
                  </div>
                </div>

                {balances?.length > 0 && (
                  <div className="profile-section" style={{ marginTop: '16px' }}>
                    <h3>
                      <FaCoins className="section-icon" />
                      Tokens
                    </h3>
                    <div className="info-grid">
                      {balances.map((t) => (
                        <div key={t.token_id} className="info-item">
                          <label>
                            <FaCoins className="label-icon" />
                            {t.token_symbol || t.token_id}
                          </label>
                          <span>{Number(t.balance).toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {profile?.auth_type === 'email' && !profile?.hedera_accounts?.[0] && (
            <div className="profile-section">
              <div className="no-hedera-account">
                <h3>
                  <FaWallet className="section-icon" />
                  Hedera Account
                </h3>
                <p>You haven't created a Hedera account yet.</p>
                <p>Create one to start earning NFT rewards and participating in governance!</p>
              </div>
            </div>
          )}
        </div>

        {friends && friends.length > 0 && (
          <div className="profile-section">
            <h3>
              <FaUserFriends className="section-icon" />
              Friends
            </h3>
            <div className="info-grid">
              {friends.map((f) => (
                <div key={f.id} className="info-item">
                  <label>
                    <FaUserFriends className="label-icon" />
                    Status
                  </label>
                  <span>{f.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {inbox && inbox.length > 0 && (
          <div className="profile-section">
            <h3>
              <FaEnvelope className="section-icon" />
              Messages
            </h3>
            <div className="info-grid">
              {inbox.map((m) => (
                <div key={m.id} className="info-item">
                  <label>
                    <FaCalendarAlt className="label-icon" />
                    {new Date(m.sent_at).toLocaleString()}
                  </label>
                  <span>{m.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
