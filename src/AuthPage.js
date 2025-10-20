import React, { useState, useEffect } from "react";
import "./App.css";
import LoginScreen from "./LoginScreen";
import HederaAccountSetup from "./HederaAccountSetup";
import UserProfile from "./components/UserProfile";
import { createUserProfile, createHederaAccount } from "./lib/supabase";
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
    </div>
  );
};
