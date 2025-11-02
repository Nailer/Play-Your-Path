import React, { useState, useEffect } from "react";
import "./App.css";
import LoginScreen from "./LoginScreen.js";
import HederaAccountSetup from "./HederaAccountSetup.js";
import UserProfile from "./components/UserProfile.js";
import { createUserProfile, createHederaAccount } from "./lib/supabase.js";
import { initHashConnect } from "./utils/hashconnect.js";
// import CreateTokenForm from "./components/CreateTokenForm";
import { FaSignOutAlt, FaUser, FaWallet } from 'react-icons/fa';

export const AuthPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showHederaSetup, setShowHederaSetup] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    // Check for existing auth state
    const savedAuth = localStorage.getItem("pyp-auth");
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setUser(authData.user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem("pyp-auth");
      }
    }
  }, []);

  ////////////////////////////// hashconnect useEffect /////////////////////////////
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Only initialize if we're in the browser
        if (typeof window === 'undefined') {
          return;
        }

        // Initialize HashConnect (this will be used when user clicks "Connect with HashPack")
        const hashconnect = await initHashConnect({
          name: "Play Your Path",
          description: "Learn & earn with Hedera",
          icon: `${window.location.origin}/logo192.png`,
          url: window.location.origin,
        });

        if (hashconnect && hashconnect.pairingEvent) {
          // Listen for pairing events (HashConnect v3)
          hashconnect.pairingEvent.on((pairingData) => {
            if (pairingData && pairingData.accountIds && pairingData.accountIds.length > 0) {
              const accountIdStr = pairingData.accountIds[0]; // Already string in v3
              console.log("✅ Wallet connected:", accountIdStr);
            }
          });

          // Check if already connected (HashConnect v3)
          if (hashconnect.connectedAccountIds && hashconnect.connectedAccountIds.length > 0) {
            const existingAccountId = hashconnect.connectedAccountIds[0].toString();
            if (existingAccountId) {
              console.log("✅ Wallet already connected:", existingAccountId);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing HashConnect:", error);
        // Don't block the app if HashConnect fails to initialize
      }
    };

    initializeWallet();
  }, []);

  const handleLogin = async (userData) => {
    try {
      // Create user profile in Supabase
      const profileData = {
        email: userData.email,
        name: userData.name,
        auth_type: userData.authType,
        wallet_address: userData.walletAddress,
      };

      const savedProfile = await createUserProfile(profileData);
      const userWithProfile = { ...userData, profileId: savedProfile.id };

      setUser(userWithProfile);
      setIsAuthenticated(true);
      localStorage.setItem(
        "pyp-auth",
        JSON.stringify({ user: userWithProfile })
      );
    } catch (error) {
      console.error("Error creating user profile:", error);
      // Still allow login even if profile creation fails
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("pyp-auth", JSON.stringify({ user: userData }));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("pyp-auth");
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
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
          >
            <FaUser />
            Profile
          </button>
          {user?.authType === "email" && !user?.hederaAccount && (
            <button
              onClick={() => setShowHederaSetup(true)}
              className="hedera-setup-btn"
            >
              <FaWallet />
              Create Hedera Account
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
      {showHederaSetup && (
        <HederaAccountSetup
          user={user}
          onAccountCreated={async (hederaAccount) => {
            try {
              // Save Hedera account to Supabase
              const profileId = user.profileId;
              console.log('Saving Hedera account to database:', {
                profileId,
                hederaAccount: {
                  accountId: hederaAccount.accountId,
                  evmAddress: hederaAccount.evmAddress,
                  balance: hederaAccount.balance,
                  created: hederaAccount.created
                }
              });
              
              const savedAccount = await createHederaAccount(profileId, hederaAccount);
              console.log('Successfully saved Hedera account:', savedAccount);

              const updatedUser = { ...user, hederaAccount };
              setUser(updatedUser);
              localStorage.setItem(
                "pyp-auth",
                JSON.stringify({ user: updatedUser })
              );
              setShowHederaSetup(false);
            } catch (error) {
              console.error("Error saving Hedera account:", error);
              console.error("Error details:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
              });
              alert(
                `Account created but failed to save to database: ${error.message}. Please try again.`
              );
            }
          }}
          onClose={() => setShowHederaSetup(false)}
        />
      )}

      {showUserProfile && (
        <UserProfile user={user} onClose={() => setShowUserProfile(false)} />
      )}

      {/* <div>
        <h1>🚀 Hedera Token Creator</h1>
        {accountId ? (
          <CreateTokenForm />
        ) : (
          <p>Please connect your HashPack wallet to continue.</p>
        )}
      </div> */}
    </div>
  );
};
