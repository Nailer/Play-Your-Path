import { HashConnect } from "hashconnect";

let hashConnectInstance = null;

export const initHashConnect = async (options = {}) => {
  // Return existing instance if already initialized
  if (hashConnectInstance) {
    return hashConnectInstance;
  }

  try {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('HashConnect can only be initialized in a browser environment');
    }

    const hashconnect = new HashConnect();

    // Get the current origin for the URL - ensure it's a valid string
    const currentUrl = window.location.origin || options.url || "http://localhost:3000";

    // ✅ appMetadata must include all required fields as strings
    const appMetadata = {
      name: String(options.name || "Play Your Path"),
      description: String(options.description || "A blockchain learning game"),
      icon: String(options.icon || `${currentUrl}/logo192.png`),
      url: String(currentUrl) // ✅ This is REQUIRED and must be a string
    };

    // Validate appMetadata before passing to init
    if (!appMetadata.name || !appMetadata.url) {
      throw new Error('App metadata must include name and url');
    }

    console.log('Initializing HashConnect with metadata:', appMetadata);

    // ✅ Initialize HashConnect with metadata, network, and debug flag
    // HashConnect v3 expects: init(metadata, network, debug)
    await hashconnect.init(appMetadata, "testnet", false);
    
    // Store instance globally and locally
    hashConnectInstance = hashconnect;
    window.hashconnect = hashconnect;
    
    console.log('HashConnect initialized successfully');
    
    return hashconnect;
  } catch (error) {
    console.error("Error initializing HashConnect:", error);
    // Don't throw - allow the app to continue without HashConnect
    return null;
  }
};

// Get the current HashConnect instance
export const getHashConnect = () => {
  return hashConnectInstance || window.hashconnect || null;
};
