import React, { useState, useEffect } from "react";
import "./App.css";
import LoginScreen from "./LoginScreen.js";
import HederaAccountSetup from "./HederaAccountSetup.js";
import UserProfile from "./components/UserProfile.js";
import { createUserProfile, createHederaAccount } from "./lib/supabase.js";
import { initHashConnect } from "./utils/hashconnect.js";
import { useNavigate } from "react-router-dom";
// import CreateTokenForm from "./components/CreateTokenForm";

export const AuthPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showHederaSetup, setShowHederaSetup] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  ////////////////////////////// hashconnect useEffect /////////////////////////////
  useEffect(() => {
    const connectWallet = async () => {
      const hashconnect = await initHashConnect({
        name: "My Hedera dApp",
        description: "Learn & earn with Hedera",
        icon: "https://hedera.com/favicon.ico",
        url: "http://localhost:3000",
      });

      hashconnect.pairingEvent.on((pairingData) => {
        setAccountId(pairingData.accountIds[0]);
        console.log("✅ Wallet connected:", pairingData.accountIds[0]);
      });
    };

    connectWallet();
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
        <span>Welcome, {user?.name || user?.email || "Player"}!</span>
        <div className="user-actions">
          <button
            onClick={() => setShowUserProfile(true)}
            className="profile-btn"
          >
            Profile
          </button>
          {user?.authType === "email" && !user?.hederaAccount && (
            <button
              onClick={() => setShowHederaSetup(true)}
              className="hedera-setup-btn"
            >
              Create Hedera Account
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
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
              await createHederaAccount(profileId, hederaAccount);

              const updatedUser = { ...user, hederaAccount };
              setUser(updatedUser);
              localStorage.setItem(
                "pyp-auth",
                JSON.stringify({ user: updatedUser })
              );
              setShowHederaSetup(false);
            } catch (error) {
              console.error("Error saving Hedera account:", error);
              alert(
                "Account created but failed to save to database. Please try again."
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
