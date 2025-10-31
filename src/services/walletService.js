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
   * Get NFT collection for an account
   */
  static async getNftCollection(accountId) {
    if (!accountId) {
      accountId = this.getConnectedAccountId();
      if (!accountId) {
        throw new Error('No account ID provided and wallet not connected');
      }
    }

    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts?limit=100&order=desc`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch NFTs: ${response.status}`);
      }

      const data = await response.json();
      const nfts = data.nfts || [];

      return nfts.map(nft => ({
        tokenId: nft.token_id,
        serialNumber: nft.serial_number,
        hashscanUrl: `https://hashscan.io/testnet/token/${nft.token_id}?serial=${nft.serial_number}`,
        accountHashscanUrl: `https://hashscan.io/testnet/token/${nft.token_id}`,
        metadata: nft.metadata || null,
        timestamp: nft.created_timestamp
      }));
    } catch (error) {
      console.error('Error fetching NFT collection:', error);
      throw error;
    }
  }

  /**
   * Get token balances for an account
   */
  static async getTokenBalances(accountId) {
    if (!accountId) {
      accountId = this.getConnectedAccountId();
      if (!accountId) {
        throw new Error('No account ID provided and wallet not connected');
      }
    }

    try {
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens?limit=100`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch token balances: ${response.status}`);
      }

      const data = await response.json();
      const tokens = data.tokens || [];

      // Get balance for each token
      const balances = await Promise.all(
        tokens.map(async (token) => {
          try {
            const balanceResponse = await fetch(
              `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens/${token.token_id}`
            );
            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              return {
                tokenId: token.token_id,
                tokenSymbol: token.symbol || 'N/A',
                tokenName: token.name || 'Unknown Token',
                balance: balanceData.balance || 0,
                decimals: token.decimals || 0,
                hashscanUrl: `https://hashscan.io/testnet/token/${token.token_id}`
              };
            }
          } catch (err) {
            console.error(`Error fetching balance for token ${token.token_id}:`, err);
          }
          return null;
        })
      );

      return balances.filter(b => b !== null);
    } catch (error) {
      console.error('Error fetching token balances:', error);
      throw error;
    }
  }
}

export default WalletService;

