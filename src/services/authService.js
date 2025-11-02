// import { supabase } from '../lib/supabase.js';

export class AuthService {
  // Email/Password Authentication
  static async signUp(email, password, name) {
    try {
      // For now, we'll use a simple approach since we're not using Supabase Auth
      // In production, you'd use: const { data, error } = await supabase.auth.signUp({ email, password })
      
      // Generate a unique ID for the user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userData = {
        id: userId,
        email,
        name: name || email.split('@')[0],
        authType: 'email',
        walletAddress: null
      };

      return { data: { user: userData }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async signIn(email, password) {
    try {
      // For now, we'll use a simple approach
      // In production, you'd use: const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      // Generate a unique ID for the user (in production, this would come from the database)
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userData = {
        id: userId,
        email,
        name: email.split('@')[0],
        authType: 'email',
        walletAddress: null
      };

      return { data: { user: userData }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // HashPack Wallet Authentication
  static async signInWithHashPack() {
    try {
      // Import initHashConnect dynamically to avoid circular dependencies
      const { initHashConnect, getHashConnect } = await import('../utils/hashconnect.js');
      
      // Ensure HashConnect is initialized
      let hashconnect = getHashConnect();
      if (!hashconnect) {
        hashconnect = await initHashConnect({
          name: "Play Your Path",
          description: "Learn & earn with Hedera",
          icon: `${window.location.origin}/logo192.png`,
          url: window.location.origin,
        });
      }

      if (!hashconnect) {
        throw new Error('Failed to initialize HashConnect. Please ensure HashPack extension is installed.');
      }

      // Check if already connected (HashConnect v3 uses connectedAccountIds)
      if (hashconnect.connectedAccountIds && hashconnect.connectedAccountIds.length > 0) {
        const accountId = hashconnect.connectedAccountIds[0].toString();
        const userId = `hashpack_${accountId}`;
        
        const userData = {
          id: userId,
          name: `HashPack ${accountId.slice(0, 8)}...`,
          email: null,
          authType: 'hashpack',
          walletAddress: accountId,
          accountId: accountId
        };

        return { data: { user: userData }, error: null };
      }

      // Not paired yet - initiate connection and wait for pairing event
      return new Promise((resolve, reject) => {
        let resolved = false;
        
        // Set up a one-time listener for pairing (HashConnect v3)
        const pairingHandler = (pairingData) => {
          if (resolved) return;
          
          if (pairingData && pairingData.accountIds && pairingData.accountIds.length > 0) {
            resolved = true;
            hashconnect.pairingEvent.off(pairingHandler); // Remove listener
            
            const accountId = pairingData.accountIds[0]; // Already a string in SessionData
            const userId = `hashpack_${accountId}`;
            
            const userData = {
              id: userId,
              name: `HashPack ${accountId.slice(0, 8)}...`,
              email: null,
              authType: 'hashpack',
              walletAddress: accountId,
              accountId: accountId
            };

            resolve({ data: { user: userData }, error: null });
          }
        };

        // Listen for pairing events
        hashconnect.pairingEvent.on(pairingHandler);

        // Open pairing modal (HashConnect v3)
        hashconnect.openPairingModal().catch((err) => {
          console.error('Error opening pairing modal:', err);
          hashconnect.pairingEvent.off(pairingHandler);
          reject(new Error('Failed to open wallet connection. Please ensure HashPack extension is installed.'));
        });

        // Set timeout to avoid hanging forever
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            hashconnect.pairingEvent.off(pairingHandler);
            reject(new Error('Wallet connection timed out. Please ensure HashPack extension is installed and try again.'));
          }
        }, 60000); // 60 second timeout
      });
    } catch (error) {
      console.error('HashPack sign-in error:', error);
      return { data: null, error };
    }
  }

  // Sign out
  // eslint-disable-next-line no-unreachable
  static async signOut() {
    // In production, you'd use: await supabase.auth.signOut()
    return { error: null };
  }

  // Get current user
  // eslint-disable-next-line no-unreachable
  static async getCurrentUser() {
    // In production, you'd use: const { data: { user } } = await supabase.auth.getUser()
    return { data: { user: null }, error: null };
  }
}
