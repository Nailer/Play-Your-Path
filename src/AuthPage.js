import React, { useEffect } from "react";
import "./App.css";
import LoginScreen from "./LoginScreen.js";
import { createUserProfile } from "./lib/supabase.js";
import { initHashConnect } from "./utils/hashconnect.js";

export const AuthPage = ({ onLogin }) => {
  // AuthPage is only used for login when not authenticated
  // Auth state is managed by parent App component

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

      // Notify parent component of login
      if (onLogin) {
        onLogin(userWithProfile);
      } else {
        // Fallback: save to localStorage if parent doesn't handle it
        localStorage.setItem(
          "pyp-auth",
          JSON.stringify({ user: userWithProfile })
        );
      }
    } catch (error) {
      console.error("Error creating user profile:", error);
      // Still allow login even if profile creation fails
      // Notify parent component of login
      if (onLogin) {
        onLogin(userData);
      } else {
        // Fallback: save to localStorage if parent doesn't handle it
        localStorage.setItem("pyp-auth", JSON.stringify({ user: userData }));
      }
    }
  };

  // AuthPage only shows login screen - authenticated state is handled by App
  return <LoginScreen onLogin={handleLogin} />;
};
