import {
  Client,
  AccountCreateTransaction,
  PrivateKey,
  Hbar,
  AccountId,
} from '@hashgraph/sdk';

// Hedera service for creating real accounts on testnet
export class HederaService {
  constructor() {
    this.client = null;
    this.operatorId = process.env.REACT_APP_HEDERA_OPERATOR_ID;
    this.operatorKey = process.env.REACT_APP_HEDERA_OPERATOR_KEY;
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
