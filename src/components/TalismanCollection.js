import React, { useState, useEffect } from 'react';
import { 
  FaGem, 
  FaStar, 
  FaCrown, 
  FaBrain, 
  FaLeaf, 
  FaDice, 
  FaBolt, 
  FaAngellist,
  FaHome,
  FaTimes,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaWallet
} from 'react-icons/fa';
import { 
  getUserTalismans, 
  getTalismanCollections, 
  activateTalisman, 
  deactivateTalisman,
  getUserHederaAccount
} from '../lib/supabase';
import TalismanMintService from '../services/talismanMintService';
import './TalismanCollection.css';

const RARITY_COLORS = {
  common: '#6b7280',
  rare: '#3b82f6', 
  epic: '#8b5cf6',
  legendary: '#f59e0b'
};

const RARITY_ICONS = {
  common: FaGem,
  rare: FaStar,
  epic: FaCrown,
  legendary: FaCrown
};

const PERK_ICONS = {
  home_defense: FaHome,
  scholar: FaBrain,
  daily_planter: FaLeaf,
  lucky_charm: FaDice,
  speed_demon: FaBolt,
  guardian_angel: FaAngellist
};

export default function TalismanCollection({ isOpen, onClose, userId }) {
  const [talismans, setTalismans] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeTalisman, setActiveTalisman] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minting, setMinting] = useState(false);
  const [mintingCollectionId, setMintingCollectionId] = useState(null);

  console.log('TalismanCollection render:', { isOpen, userId });

  useEffect(() => {
    if (isOpen && userId) {
      loadTalismanData();
    }
  }, [isOpen, userId]);

  const loadTalismanData = async () => {
    try {
      setLoading(true);
      const [userTalismans, availableCollections] = await Promise.all([
        getUserTalismans(userId),
        getTalismanCollections()
      ]);
      
      setTalismans(userTalismans);
      setCollections(availableCollections);
      
      // Find active talisman
      const active = userTalismans.find(t => t.is_active);
      setActiveTalisman(active || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTalisman = async (talismanId) => {
    try {
      setLoading(true);
      const activatedTalisman = await activateTalisman({ userId, talismanId });
      setActiveTalisman(activatedTalisman);
      
      // Update local state
      setTalismans(prev => prev.map(t => ({
        ...t,
        is_active: t.id === talismanId
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateTalisman = async (talismanId) => {
    try {
      setLoading(true);
      await deactivateTalisman({ userId, talismanId });
      setActiveTalisman(null);
      
      // Update local state
      setTalismans(prev => prev.map(t => ({
        ...t,
        is_active: false
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMintTalisman = async (collection) => {
    if (minting) return;
    
    try {
      setMinting(true);
      setMintingCollectionId(collection.id);
      setError('');

      // Check if user already owns this talisman
      const alreadyOwned = talismans.some(t => t.collection_id === collection.id);
      if (alreadyOwned) {
        setError('You already own this talisman!');
        return;
      }

      // Get user's Hedera account
      const hederaAccount = await getUserHederaAccount(userId);
      if (!hederaAccount || !hederaAccount.account_id) {
        setError('Please create a Hedera account first. Go to your profile to create one.');
        return;
      }

      console.log('Minting talisman with account:', hederaAccount.account_id);

      // Check if collection has NFT ID deployed
      if (!collection.nft_collection_id) {
        setError('This talisman collection has not been deployed yet. Please contact the administrator.');
        return;
      }

      // Mint the talisman
      if (collection.perk_type === 'daily_planter') {
        // Pass private key if available (for app-created accounts)
        const result = await TalismanMintService.mintDailyPlanterTalisman(
          userId,
          hederaAccount.account_id,
          collection,
          hederaAccount.private_key || null
        );

        if (result.success) {
          // Reload talismans to show the new one
          await loadTalismanData();
          
          // Show success message with HashScan link and association instructions
          const hashscanUrl = result.hashscanNftUrl || `https://hashscan.io/testnet/token/${collection.nft_collection_id}?serial=${result.nftSerialNumber}`;
          const transferUrl = result.transferHashscanUrl;
          
          let successMessage = `🎉 Daily Planter Talisman minted successfully!\n\n` +
            `NFT Serial: #${result.nftSerialNumber}\n` +
            `Collection: ${collection.name}\n\n` +
            `View NFT: ${hashscanUrl}`;
          
          if (transferUrl) {
            successMessage += `\nTransfer Tx: ${transferUrl}`;
          }
          
          successMessage += `\n\n⚠️ IMPORTANT: If you don't see the NFT in your wallet:\n` +
            `1. Open HashPack wallet\n` +
            `2. Go to Assets tab\n` +
            `3. Click "Add Token" or search for: ${collection.nft_collection_id}\n` +
            `4. Associate the token with your account\n` +
            `5. The NFT will then appear in your wallet\n\n` +
            `The NFT has been minted and transferred - you just need to associate the token to see it!`;
          
          alert(successMessage);
          
          // Optionally open HashScan in new tab
          if (window.confirm('Would you like to view your NFT on HashScan?')) {
            window.open(hashscanUrl, '_blank');
          }
        }
      } else {
        setError('Only Daily Planter talisman can be minted from this interface for now.');
      }
    } catch (err) {
      console.error('Minting error:', err);
      setError(err.message || 'Failed to mint talisman. Make sure your Hedera account is set up and has sufficient balance.');
    } finally {
      setMinting(false);
      setMintingCollectionId(null);
    }
  };

  const getRarityIcon = (rarity) => {
    const IconComponent = RARITY_ICONS[rarity] || FaGem;
    return <IconComponent className="rarity-icon" style={{ color: RARITY_COLORS[rarity] }} />;
  };

  const getPerkIcon = (perkType) => {
    const IconComponent = PERK_ICONS[perkType] || FaGem;
    return <IconComponent className="perk-icon" />;
  };

  const formatPerkConfig = (perkType, config) => {
    switch (perkType) {
      case 'daily_planter':
        return `+${config.streak_bonus || 2}% bonus for ${config.required_streak || 7}-day streaks`;
      case 'scholar':
        return `+${config.xp_bonus || 25}% XP bonus, ${Math.round((config.course_discount || 0.1) * 100)}% course discount`;
      case 'home_defense':
        return `+${config.defense_bonus || 50} defense, ${config.cooldown_hours || 24}h cooldown`;
      case 'lucky_charm':
        return `+${Math.round((config.drop_rate_bonus || 0.15) * 100)}% drop rate, +${config.rarity_boost || 1} rarity boost`;
      case 'speed_demon':
        return `${Math.round((config.cooldown_reduction || 0.3) * 100)}% cooldown reduction, +${config.energy_boost || 20} energy`;
      case 'guardian_angel':
        return `+${config.healing_bonus || 40}% healing, ${Math.round((config.protection_duration || 3600) / 60)}min protection`;
      default:
        return 'Special abilities';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="talisman-modal-overlay">
      <div className="talisman-modal">
        <div className="talisman-header">
          <h2>
            <FaGem className="header-icon" />
            Talisman Collection
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <FaExclamationTriangle className="error-icon" />
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <FaSpinner className="spinner-icon" />
            Loading talismans...
          </div>
        )}

        {/* Active Talisman */}
        {activeTalisman && (
          <div className="active-talisman-section">
            <h3>Currently Active</h3>
            <div className="talisman-card active">
              <div className="talisman-emoji">{activeTalisman.talisman_collections.emoji}</div>
              <div className="talisman-info">
                <div className="talisman-name">
                  {activeTalisman.talisman_collections.name}
                  {getRarityIcon(activeTalisman.talisman_collections.rarity)}
                </div>
                <div className="talisman-description">
                  {activeTalisman.talisman_collections.description}
                </div>
                <div className="talisman-perks">
                  {getPerkIcon(activeTalisman.talisman_collections.perk_type)}
                  <span>{formatPerkConfig(activeTalisman.talisman_collections.perk_type, activeTalisman.talisman_collections.perk_config)}</span>
                </div>
              </div>
              <button 
                className="deactivate-btn"
                onClick={() => handleDeactivateTalisman(activeTalisman.id)}
                disabled={loading}
              >
                Deactivate
              </button>
            </div>
          </div>
        )}

        {/* Available Talismans */}
        <div className="talisman-collection-section">
          <h3>Your Talismans ({talismans.length})</h3>
          {talismans.length === 0 ? (
            <div className="empty-state">
              <FaGem className="empty-icon" />
              <p>No talismans yet. Complete quests or achievements to earn them!</p>
            </div>
          ) : (
            <div className="talisman-grid">
              {talismans.map(talisman => (
                <div 
                  key={talisman.id} 
                  className={`talisman-card ${talisman.is_active ? 'active' : 'inactive'}`}
                >
                  <div className="talisman-emoji">{talisman.talisman_collections.emoji}</div>
                  <div className="talisman-info">
                    <div className="talisman-name">
                      {talisman.talisman_collections.name}
                      {getRarityIcon(talisman.talisman_collections.rarity)}
                    </div>
                    <div className="talisman-description">
                      {talisman.talisman_collections.description}
                    </div>
                    <div className="talisman-perks">
                      {getPerkIcon(talisman.talisman_collections.perk_type)}
                      <span>{formatPerkConfig(talisman.talisman_collections.perk_type, talisman.talisman_collections.perk_config)}</span>
                    </div>
                    <div className="talisman-meta">
                      <span className="mint-date">
                        Minted: {new Date(talisman.minted_at).toLocaleDateString()}
                      </span>
                      {talisman.nft_serial_number && (
                        <span className="serial-number">
                          Serial: {talisman.nft_serial_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="talisman-actions">
                    {talisman.is_active ? (
                      <div className="active-badge">
                        <FaCheckCircle />
                        Active
                      </div>
                    ) : (
                      <button 
                        className="activate-btn"
                        onClick={() => handleActivateTalisman(talisman.id)}
                        disabled={loading}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Collections (for minting) */}
        <div className="available-collections-section">
          <h3>Available Collections</h3>
          <div className="collections-grid">
            {collections.map(collection => {
              const isOwned = talismans.some(t => t.collection_id === collection.id);
              const isMinting = minting && mintingCollectionId === collection.id;
              const canMint = collection.perk_type === 'daily_planter' && !isOwned;
              
              return (
                <div key={collection.id} className="collection-card">
                  <div className="collection-emoji">{collection.emoji}</div>
                  <div className="collection-info">
                    <div className="collection-name">
                      {collection.name}
                      {getRarityIcon(collection.rarity)}
                    </div>
                    <div className="collection-description">{collection.description}</div>
                    <div className="collection-perks">
                      {getPerkIcon(collection.perk_type)}
                      <span>{formatPerkConfig(collection.perk_type, collection.perk_config)}</span>
                    </div>
                  </div>
                  <div className="collection-actions">
                    {isOwned ? (
                      <span className="owned-badge">
                        <FaCheckCircle /> Owned
                      </span>
                    ) : canMint ? (
                      <button
                        className="mint-btn"
                        onClick={() => handleMintTalisman(collection)}
                        disabled={minting || loading}
                      >
                        {isMinting ? (
                          <>
                            <FaSpinner className="spinner-icon" />
                            Minting...
                          </>
                        ) : (
                          <>
                            <FaPlus />
                            Mint NFT
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="not-owned-badge">Not Available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
