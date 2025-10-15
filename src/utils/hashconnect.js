import { HashConnect } from "hashconnect";

export const initHashConnect = async () => {
  const hashconnect = new HashConnect();

  // ✅ appMetadata must include all required fields
  const appMetadata = {
    name: "My Hedera dApp",
    description: "A blockchain learning game",
    icon: "https://hedera.com/favicon.ico", // or your project logo
    url: "http://localhost:3000"            // ✅ This is REQUIRED
  };

  // ✅ Make sure you pass all 3 arguments properly
  await hashconnect.init(appMetadata, "testnet", false);
  await hashconnect.connect();
  return hashconnect;
};
