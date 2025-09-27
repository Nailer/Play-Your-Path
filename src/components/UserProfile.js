import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { getUserProfile, updateHederaBalance, getTokenBalances, getDailyPoints, listFriends, fetchInbox } from '../lib/supabase';
import { getAccountBalance } from '../services/hederaService';

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
            <div className="spinner"></div>
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
          <h2>User Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="profile-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          <div className="profile-section">
            <h3>Account Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <span>{profile?.name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{profile?.email}</span>
              </div>
              <div className="info-item">
                <label>Auth Type</label>
                <span className={`auth-badge ${profile?.auth_type}`}>
                  {profile?.auth_type}
                </span>
              </div>
              <div className="info-item">
                <label>Member Since</label>
                <span>{new Date(profile?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {profile?.hedera_accounts?.[0] && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Hedera Account</h3>
                <button 
                  className="refresh-btn"
                  onClick={refreshBalance}
                  disabled={refreshing}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Balance'}
                </button>
              </div>
              
              <div className="hedera-info">
                <div className="balance-card">
                  <div className="balance-amount">
                    {formatBalance(profile.hedera_accounts[0].balance)} HBAR
                  </div>
                  <div className="balance-label">Current Balance</div>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Tier</label>
                    <span>{profile?.tier || 'bronze'}</span>
                  </div>
                  <div className="info-item">
                    <label>XP</label>
                    <span>{profile?.xp || 0}</span>
                  </div>
                  <div className="info-item">
                    <label>Daily Points</label>
                    <span>{daily?.points || 0}</span>
                  </div>
                </div>

                <div className="info-grid" style={{ marginTop: '12px' }}>
                  <div className="info-item">
                    <label>Account ID</label>
                    <span className="account-id">
                      {formatAccountId(profile.hedera_accounts[0].account_id)}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>EVM Address</label>
                    <span className="evm-address">
                      {profile.hedera_accounts[0].evm_address}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Last Balance Check</label>
                    <span>
                      {new Date(profile.hedera_accounts[0].last_balance_check).toLocaleString()}
                    </span>
                  </div>
                </div>

                {balances?.length > 0 && (
                  <div className="profile-section" style={{ marginTop: '16px' }}>
                    <h3>Tokens</h3>
                    <div className="info-grid">
                      {balances.map((t) => (
                        <div key={t.token_id} className="info-item">
                          <label>{t.token_symbol || t.token_id}</label>
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
                <h3>Hedera Account</h3>
                <p>You haven't created a Hedera account yet.</p>
                <p>Create one to start earning NFT rewards and participating in governance!</p>
              </div>
            </div>
          )}
        </div>

        {friends && friends.length > 0 && (
          <div className="profile-section">
            <h3>Friends</h3>
            <div className="info-grid">
              {friends.map((f) => (
                <div key={f.id} className="info-item">
                  <label>Status</label>
                  <span>{f.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {inbox && inbox.length > 0 && (
          <div className="profile-section">
            <h3>Messages</h3>
            <div className="info-grid">
              {inbox.map((m) => (
                <div key={m.id} className="info-item">
                  <label>{new Date(m.sent_at).toLocaleString()}</label>
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
