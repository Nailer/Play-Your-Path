import {
  Client,
  AccountCreateTransaction,
  PrivateKey,
  Hbar,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  TokenId,
} from '@hashgraph/sdk';

// Hedera service for creating real accounts on testnet
export class HederaService {
  constructor() {
    this.client = null;
    // Support multiple env names for convenience (samples/other stacks)
    this.operatorId = process.env.REACT_APP_HEDERA_OPERATOR_ID
      || process.env.MY_ACCOUNT_ID
      || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
    this.operatorKey = process.env.REACT_APP_HEDERA_OPERATOR_KEY
      || process.env.MY_PRIVATE_KEY
      || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;
    this.rewardTokenId = process.env.REACT_APP_PYP_REWARD_TOKEN_ID || null; // optional persisted reward token
  }

  // Initialize the Hedera client
  initializeClient() {
    if (!this.operatorId || !this.operatorKey) {
      throw new Error('Hedera operator credentials not found. Please set REACT_APP_HEDERA_OPERATOR_ID and REACT_APP_HEDERA_OPERATOR_KEY environment variables.');
    }

    try {
      this.client = Client.forTestnet()
        .setOperator(AccountId.fromString(this.operatorId), PrivateKey.fromString(this.operatorKey));
      
      console.log('Hedera client initialized for testnet');
      return true;
    } catch (error) {
      console.error('Failed to initialize Hedera client:', error);
      throw new Error(`Failed to initialize Hedera client: ${error.message}`);
    }
  }

  // Create a new Hedera account
  async createAccount() {
    try {
      if (!this.client) {
        this.initializeClient();
      }

      // Generate a new key pair for the user
      const newPrivateKey = PrivateKey.generateECDSA();
      const newPublicKey = newPrivateKey.publicKey;

      console.log('Generated new key pair for user');

      // Build and execute the account creation transaction
      const transaction = new AccountCreateTransaction()
        .setKey(newPublicKey)
        .setInitialBalance(new Hbar(20)); // Fund with 20 HBAR

      console.log('Executing account creation transaction...');
      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const newAccountId = receipt.accountId;

      if (!newAccountId) {
        throw new Error('Failed to create Hedera account - no account ID returned');
      }

      console.log('Account created successfully:', newAccountId.toString());

      // Wait for Mirror Node to populate data
      console.log('Waiting for Mirror Node to sync...');
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Get initial balance
      const balance = await this.getAccountBalance(newAccountId.toString());

      return {
        accountId: newAccountId.toString(),
        evmAddress: `0x${newPublicKey.toEvmAddress()}`,
        privateKey: newPrivateKey.toString(),
        publicKey: newPublicKey.toString(),
        balance: balance,
        created: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating Hedera account:', error);
      if (error instanceof Error) {
        throw new Error(`Hedera account creation failed: ${error.message}`);
      }
      throw new Error('Hedera account creation failed for an unknown reason');
    }
  }

  // Get account balance from Mirror Node
  async getAccountBalance(accountId) {
    try {
      if (!accountId) {
        console.error('No account ID provided to getAccountBalance');
        return 0;
      }

      // Clean up the account ID format if needed
      const cleanAccountId = accountId.trim();
      console.log(`Fetching balance for account: ${cleanAccountId}`);
      
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${cleanAccountId}`;
      console.log(`Making request to: ${mirrorNodeUrl}`);
      
      const response = await fetch(mirrorNodeUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from mirror node (${response.status}):`, errorText);
        return 0;
      }
      
      const data = await response.json();
      console.log('Mirror node response:', data);

      if (data.balances && data.balances.length > 0) {
        const balanceInTinybars = data.balances[0].balance;
        const balanceInHbar = balanceInTinybars / 100000000;
        console.log(`Balance for ${cleanAccountId}: ${balanceInHbar} HBAR`);
        return balanceInHbar;
      }
      
      console.log('No balance found for account:', cleanAccountId);
      return 0;
    } catch (error) {
      console.error('Error in getAccountBalance:', error);
      return 0;
    }
  }

  // Close the client connection
  close() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }

  // ================================
  //           TOKENS / NFTS
  // ================================

  /**
   * Create a fungible token (HBAR-like) on Hedera.
   * Returns { tokenId: string }
   */
  async createFungibleToken({ name, symbol, decimals = 8, initialSupply = 0 }) {
    if (!this.client) this.initializeClient();

    const adminKey = PrivateKey.fromString(this.operatorKey);

    const tx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setTreasuryAccountId(AccountId.fromString(this.operatorId))
      .setAdminKey(adminKey.publicKey)
      .setSupplyKey(adminKey.publicKey)
      .setDecimals(decimals)
      .setInitialSupply(initialSupply)
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .freezeWith(this.client)
      .sign(adminKey);

    const submit = await tx.execute(this.client);
    const receipt = await submit.getReceipt(this.client);
    const tokenId = receipt.tokenId;

    if (!tokenId) throw new Error('Failed to create fungible token');
    return { tokenId: tokenId.toString() };
  }

  /**
   * Mint additional fungible supply.
   */
  async mintFungible({ tokenId, amount }) {
    if (!this.client) this.initializeClient();
    const supplyKey = PrivateKey.fromString(this.operatorKey);

    const tx = await new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setAmount(amount)
      .freezeWith(this.client)
      .sign(supplyKey);

    const submit = await tx.execute(this.client);
    await submit.getReceipt(this.client);
    return { tokenId };
  }

  /**
   * Create a Non-Fungible Token (collection). Returns { tokenId }
   */
  async createNftCollection({ name, symbol, maxSupply = 0 /* 0 = infinite */ }) {
    if (!this.client) this.initializeClient();
    const adminKey = PrivateKey.fromString(this.operatorKey);

    const tx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setTreasuryAccountId(AccountId.fromString(this.operatorId))
      .setAdminKey(adminKey.publicKey)
      .setSupplyKey(adminKey.publicKey)
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(maxSupply > 0 ? TokenSupplyType.Finite : TokenSupplyType.Infinite)
      .setMaxSupply(maxSupply > 0 ? maxSupply : null)
      .freezeWith(this.client)
      .sign(adminKey);

    const submit = await tx.execute(this.client);
    const receipt = await submit.getReceipt(this.client);
    const tokenId = receipt.tokenId;

    if (!tokenId) throw new Error('Failed to create NFT collection');
    return { tokenId: tokenId.toString() };
  }

  /**
   * Mint NFTs with metadata list (array of Uint8Array or Buffer of bytes).
   * Returns { tokenId, serials: number[] }
   */
  async mintNfts({ tokenId, metadataList }) {
    if (!this.client) this.initializeClient();
    const supplyKey = PrivateKey.fromString(this.operatorKey);

    const tx = await new TokenMintTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setMetadata(metadataList)
      .freezeWith(this.client)
      .sign(supplyKey);

    const submit = await tx.execute(this.client);
    const receipt = await submit.getReceipt(this.client);
    const serials = receipt.serials ? receipt.serials.map(s => Number(s)) : [];
    return { tokenId, serials };
  }

  /**
   * Associate a token/NFT to an account (so it can receive it).
   */
  async associateToken({ accountId, accountPrivateKey, tokenId }) {
    if (!this.client) this.initializeClient();
    const userKey = PrivateKey.fromString(accountPrivateKey);

    const tx = await new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([TokenId.fromString(tokenId)])
      .freezeWith(this.client)
      .sign(userKey);

    const submit = await tx.execute(this.client);
    await submit.getReceipt(this.client);
    return { accountId, tokenId };
  }

  /**
   * Transfer fungible tokens or a single NFT serial from treasury to user.
   * For NFTs, provide serial number via tokenId like `0.0.x@serial` or use the nftSerial param.
   */
  async transferToken({ tokenId, amount = 0, fromAccountId, toAccountId, nftSerial }) {
    if (!this.client) this.initializeClient();

    const fromId = AccountId.fromString(fromAccountId || this.operatorId);
    const fromKey = PrivateKey.fromString(this.operatorKey);
    const toId = AccountId.fromString(toAccountId);

    let tx = new TransferTransaction();

    if (nftSerial) {
      // NFT transfer
      const nftId = TokenId.fromString(tokenId).toNonFungibleToken(nftSerial);
      tx = tx.addNftTransfer(nftId, fromId, toId);
    } else {
      // Fungible transfer (amount in smallest units according to decimals)
      tx = tx.addTokenTransfer(TokenId.fromString(tokenId), fromId, -amount)
             .addTokenTransfer(TokenId.fromString(tokenId), toId, amount);
    }

    const frozen = await tx.freezeWith(this.client).sign(fromKey);
    const submit = await frozen.execute(this.client);
    await submit.getReceipt(this.client);
    return { tokenId, to: toId.toString(), amount, nftSerial: nftSerial || null };
  }

  /**
   * Send HBAR from a sender (defaults to operator) to a recipient.
   */
  async sendHbar({ senderAccountId, senderPrivateKey, receiverAccountId, amount, memo }) {
    if (!receiverAccountId || !amount || amount <= 0) {
      throw new Error('Invalid input parameters for HBAR transfer');
    }
    const fromId = AccountId.fromString(senderAccountId || this.operatorId);
    const fromKey = PrivateKey.fromString(senderPrivateKey || this.operatorKey);
    if (!this.client) this.initializeClient();

    const tx = new TransferTransaction()
      .addHbarTransfer(fromId, new Hbar(-amount))
      .addHbarTransfer(AccountId.fromString(receiverAccountId), new Hbar(amount));
    if (memo) tx.setTransactionMemo(memo);

    const signed = await tx.freezeWith(this.client).sign(fromKey);
    const res = await signed.execute(this.client);
    const receipt = await res.getReceipt(this.client);
    const txId = res.transactionId.toString();
    const status = receipt.status.toString();
    const hashscanUrl = `https://hashscan.io/testnet/transaction/${txId}`;
    return { transactionId: txId, status, hashscanUrl };
  }
}

// Create a singleton instance
export const hederaService = new HederaService();

// Utility functions for easy use
export const createHederaAccount = async () => {
  return await hederaService.createAccount();
};

export const getAccountBalance = async (accountId) => {
  return await hederaService.getAccountBalance(accountId);
};

// SAMPLE-COMPAT WRAPPERS (matching the user-provided signatures)
export async function createFungibleToken(input) {
  // input: { tokenName, tokenSymbol, initialSupply, decimals? }
  const res = await hederaService.createFungibleToken({
    name: input.tokenName,
    symbol: input.tokenSymbol,
    initialSupply: input.initialSupply,
    decimals: input.decimals ?? 2,
  });
  return { tokenId: res.tokenId };
}

export async function createNftAndMint(input) {
  // input: { tokenName, tokenSymbol, maxSupply, metadataCids[] }
  const { tokenId } = await hederaService.createNftCollection({
    name: input.tokenName,
    symbol: input.tokenSymbol,
    maxSupply: input.maxSupply,
  });
  const metadataList = (input.metadataCids || []).map((c) => Buffer.from(c));
  const minted = await hederaService.mintNfts({ tokenId, metadataList });
  return { tokenId, mintedSerials: minted.serials };
}

export async function mintCertificateNFT(input) {
  // Uses a pre-deployed NFT token id as the "certificate" collection
  const certificateTokenId = process.env.CERTIFICATE_CONTRACT_ID || process.env.REACT_APP_CERTIFICATE_TOKEN_ID;
  if (!certificateTokenId) throw new Error('Missing CERTIFICATE token id env: CERTIFICATE_CONTRACT_ID');
  const minted = await hederaService.mintNfts({
    tokenId: certificateTokenId,
    metadataList: [Buffer.from(input.metadataUrl)],
  });
  if (!minted.serials || minted.serials.length === 0) {
    throw new Error('Failed to mint certificate NFT');
  }
  return { tokenId: certificateTokenId, serialNumber: minted.serials[0] };
}

export async function sendHbar(input) {
  return await hederaService.sendHbar(input);
}

// Convenience wrappers for badges and rewards
export const createBadgeCollection = async ({ name = 'PYP Badge', symbol = 'PYPB', maxSupply = 0 }) => {
  return await hederaService.createNftCollection({ name, symbol, maxSupply });
};

export const mintBadgeNfts = async ({ tokenId, metadataJsonArray }) => {
  // Convert JSON metadata strings to bytes
  const metadataList = metadataJsonArray.map((m) => Buffer.from(typeof m === 'string' ? m : JSON.stringify(m)));
  return await hederaService.mintNfts({ tokenId, metadataList });
};

export const rewardFungibleTokens = async ({ name = 'PYP Reward', symbol = 'PYPR', decimals = 8, initialSupply = 0, toAccountId, amount }) => {
  // Create token if needed externally; here just an example of mint+transfer if token exists
  // This function assumes the token already exists and is associated by the recipient
  // Consider persisting tokenId in Supabase and passing it here
  throw new Error('Implement reward flow by persisting tokenId and calling mintFungible + transferToken');
};
