import { getHashConnect } from '../utils/hashconnect';
import { hederaService } from './hederaService';

/**
 * Wallet Service - Handles HashConnect wallet interactions
 * Supports HBAR transfers, balance checks, and transaction history
 */
export class WalletService {
  /**
   * Get current HashConnect instance
   */
  static getHashConnect() {
    return getHashConnect();
  }

  /**
   * Check if wallet is connected
   */
  static isConnected() {
    const hashconnect = this.getHashConnect();
    return hashconnect && hashconnect.connectedAccountIds && hashconnect.connectedAccountIds.length > 0;
  }

  /**
   * Get connected account ID
   */
  static getConnectedAccountId() {
    const hashconnect = this.getHashConnect();
    if (!hashconnect || !hashconnect.connectedAccountIds || hashconnect.connectedAccountIds.length === 0) {
      return null;
    }
    // connectedAccountIds is an array of AccountId objects, convert to string
    return hashconnect.connectedAccountIds[0].toString();
  }

  /**
   * Get HBAR balance for an account
   */
  static async getBalance(accountId) {
    if (!accountId) {
      accountId = this.getConnectedAccountId();
      if (!accountId) {
        throw new Error('No account ID provided and wallet not connected');
      }
    }
    return await hederaService.getAccountBalance(accountId);
  }

  /**
   * Transfer HBAR using HashConnect wallet
   */
  static async transferHbar({ toAccountId, amount, memo = '' }) {
    const hashconnect = this.getHashConnect();
    if (!hashconnect || !this.isConnected()) {
      throw new Error('Wallet not connected. Please connect your HashPack wallet first.');
    }

    const fromAccountId = this.getConnectedAccountId();
    if (!fromAccountId) {
      throw new Error('Could not determine sender account ID');
    }

    if (!toAccountId || !amount || amount <= 0) {
      throw new Error('Invalid transfer parameters');
    }

    try {
      // Import Hedera SDK
      const {
        TransferTransaction,
        AccountId,
        Hbar,
        Client,
        TransactionId
      } = await import('@hashgraph/sdk');

      // Create client for transaction setup
      const client = Client.forTestnet();
      
      // Create transfer transaction
      const fromAccount = AccountId.fromString(fromAccountId);
      const toAccount = AccountId.fromString(toAccountId);
      
      const transaction = new TransferTransaction()
        .setTransactionId(TransactionId.generate(fromAccount))
        .addHbarTransfer(fromAccount, new Hbar(-amount))
        .addHbarTransfer(toAccount, new Hbar(amount));

      if (memo) {
        transaction.setTransactionMemo(memo);
      }
      
      // Set node account IDs for the transaction
      const nodeIds = await client.getNodeAccountIdsForExecute();
      transaction.setNodeAccountIds(nodeIds);

      // HashConnect v3 uses sendTransaction which signs and executes
      // Freeze the transaction
      const frozenTransaction = await transaction.freezeWith(client);

      // Use HashConnect's sendTransaction which handles signing and execution
      const receipt = await hashconnect.sendTransaction(fromAccount, frozenTransaction);
      
      // Get transaction ID from receipt
      const txId = receipt.transactionId.toString();
      const status = receipt.status.toString();
      const hashscanUrl = `https://hashscan.io/testnet/transaction/${txId}`;

      return {
        success: true,
        transactionId: txId,
        status,
        hashscanUrl,
        receipt
      };
    } catch (error) {
      console.error('Transfer error:', error);
      // Check if it's a user cancellation
      if (error.message && error.message.includes('cancel')) {
        throw new Error('Transfer was cancelled');
      }
      throw new Error(`Transfer failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get transaction history from Mirror Node
   */
  static async getTransactionHistory(accountId, limit = 25) {
    if (!accountId) {
      accountId = this.getConnectedAccountId();
      if (!accountId) {
        throw new Error('No account ID provided and wallet not connected');
      }
    }

    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/transactions?account.id=${accountId}&limit=${limit}&order=desc`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      return transactions.map(tx => ({
        transactionId: tx.transaction_id,
        hashscanUrl: `https://hashscan.io/testnet/transaction/${tx.transaction_id}`,
        timestamp: tx.consensus_timestamp,
        type: tx.name,
        result: tx.result,
        transfers: tx.transfers || [],
        memo: tx.memo_base64 ? atob(tx.memo_base64) : null
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Get NFT collection for an account - Simplified and faster
   */
  static async getNftCollection(accountId) {
    if (!accountId) {
      accountId = this.getConnectedAccountId();
      if (!accountId) {
        throw new Error('No account ID provided and wallet not connected');
      }
    }

    try {
      // Clean account ID
      const cleanAccountId = accountId.trim();
      
      // Use simpler endpoint with better error handling
      const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${cleanAccountId}/nfts?limit=100&order=desc`;
      console.log('Fetching NFTs from:', url);
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`NFT fetch failed (${response.status}):`, errorText);
        // Return empty array instead of throwing for better UX
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch NFTs: ${response.status}`);
      }

      const data = await response.json();
      console.log('NFT data received:', data);
      
      const nfts = data.nfts || data || [];
      console.log(`Found ${nfts.length} NFTs`);

      return nfts.map(nft => ({
        tokenId: nft.token_id || nft.tokenId,
        serialNumber: nft.serial_number || nft.serialNumber,
        hashscanUrl: `https://hashscan.io/testnet/token/${nft.token_id || nft.tokenId}?serial=${nft.serial_number || nft.serialNumber}`,
        accountHashscanUrl: `https://hashscan.io/testnet/token/${nft.token_id || nft.tokenId}`,
        metadata: nft.metadata || null,
        timestamp: nft.created_timestamp || nft.timestamp
      }));
    } catch (error) {
      console.error('Error fetching NFT collection:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get token balances for an account - Simplified and faster
   */
  static async getTokenBalances(accountId) {
    if (!accountId) {
      accountId = this.getConnectedAccountId();
      if (!accountId) {
        throw new Error('No account ID provided and wallet not connected');
      }
    }

    try {
      // Clean account ID
      const cleanAccountId = accountId.trim();
      
      // Use balances endpoint which includes all tokens
      const url = `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${cleanAccountId}`;
      console.log('Fetching token balances from:', url);
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token balance fetch failed (${response.status}):`, errorText);
        // Return empty array instead of throwing for better UX
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch token balances: ${response.status}`);
      }

      const data = await response.json();
      console.log('Token balance data received:', data);
      
      // The balances endpoint returns balances array
      const balances = data.balances || [];
      
      if (balances.length === 0) {
        return [];
      }

      // Get the first balance object (for the account)
      const accountBalance = balances[0];
      const tokens = accountBalance.tokens || [];
      
      console.log(`Found ${tokens.length} tokens`);

      // Transform token data
      const tokenBalances = await Promise.all(
        tokens.map(async (token) => {
          try {
            // Get token info for name and symbol
            const tokenInfoUrl = `https://testnet.mirrornode.hedera.com/api/v1/tokens/${token.token_id}`;
            let tokenInfo = null;
            
            try {
              const infoResponse = await fetch(tokenInfoUrl);
              if (infoResponse.ok) {
                tokenInfo = await infoResponse.json();
              }
            } catch (err) {
              console.warn(`Could not fetch token info for ${token.token_id}:`, err);
            }

            // Calculate actual balance considering decimals
            const decimals = tokenInfo?.decimals || 0;
            const rawBalance = parseInt(token.balance || '0');
            const actualBalance = decimals > 0 ? rawBalance / Math.pow(10, decimals) : rawBalance;

            return {
              tokenId: token.token_id,
              tokenSymbol: tokenInfo?.symbol || token.symbol || 'N/A',
              tokenName: tokenInfo?.name || token.name || 'Unknown Token',
              balance: actualBalance,
              rawBalance: rawBalance,
              decimals: decimals,
              hashscanUrl: `https://hashscan.io/testnet/token/${token.token_id}`
            };
          } catch (err) {
            console.error(`Error processing token ${token.token_id}:`, err);
            // Return basic info even if details fail
            return {
              tokenId: token.token_id,
              tokenSymbol: 'N/A',
              tokenName: 'Unknown Token',
              balance: parseInt(token.balance || '0'),
              rawBalance: parseInt(token.balance || '0'),
              decimals: 0,
              hashscanUrl: `https://hashscan.io/testnet/token/${token.token_id}`
            };
          }
        })
      );

      return tokenBalances.filter(b => b && b.balance > 0); // Only return tokens with balance
    } catch (error) {
      console.error('Error fetching token balances:', error);
      // Return empty array instead of throwing
      return [];
    }
  }
}

export default WalletService;

