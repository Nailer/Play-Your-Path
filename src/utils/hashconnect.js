import { HashConnect } from "hashconnect";
import { LedgerId } from "@hashgraph/sdk";

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

    // Get the current origin for the URL - ensure it's a valid string
    const currentUrl = window.location.origin || options.url || "http://localhost:3000";
    const iconUrl = options.icon || `${currentUrl}/logo192.png`;

    // ✅ HashConnect v3 requires DappMetadata with icons array (not icon string)
    const metadata = {
      name: String(options.name || "Play Your Path"),
      description: String(options.description || "A blockchain learning game"),
      icons: [String(iconUrl)], // Array of icon URLs
      url: String(currentUrl)
    };

    // Validate metadata
    if (!metadata.name || !metadata.url || !metadata.icons || metadata.icons.length === 0) {
      throw new Error('Metadata must include name, url, and at least one icon');
    }

    console.log('Initializing HashConnect v3 with metadata:', metadata);

    // ✅ HashConnect v3 constructor: new HashConnect(LedgerId, projectId, metadata, debug)
    // Note: projectId is required but HashConnect v3 might work with an empty string or placeholder
    // If you have a WalletConnect project ID, use it here
    const projectId = options.projectId || process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || "";
    const debug = options.debug || false;

    // Create HashConnect instance with LedgerId.TESTNET
    const hashconnect = new HashConnect(
      LedgerId.TESTNET,
      projectId,
      metadata,
      debug
    );

    // Initialize HashConnect (v3 init() takes no parameters)
    await hashconnect.init();
    
    // Store instance globally and locally
    hashConnectInstance = hashconnect;
    window.hashconnect = hashconnect;
    
    console.log('HashConnect initialized successfully');
    
    return hashconnect;
  } catch (error) {
    console.error("Error initializing HashConnect:", error);
    // Reset instance on error so we can retry
    hashConnectInstance = null;
    // Don't throw - allow the app to continue without HashConnect
    return null;
  }
};

// Get the current HashConnect instance
export const getHashConnect = () => {
  return hashConnectInstance || window.hashconnect || null;
};
