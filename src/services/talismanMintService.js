import { hederaService } from './hederaService';
import { mintTalisman } from '../lib/supabase';
import { getHashConnect } from '../utils/hashconnect';

/**
 * Service for minting talisman NFTs
 */
export class TalismanMintService {
  /**
   * Mint a talisman NFT for a user
   * @param {Object} params - Minting parameters
   * @param {string} params.userId - User profile ID from Supabase
   * @param {string} params.collectionId - Talisman collection ID from Supabase
   * @param {string} params.nftCollectionId - NFT token ID on Hedera (e.g., "0.0.123456")
   * @param {string} params.userAccountId - User's Hedera account ID
   * @param {string} params.userPrivateKey - Optional: User's private key for association (for app-created accounts)
   * @param {Object} params.metadata - Optional custom metadata
   * @returns {Promise<Object>} - Minted talisman data
   */
  static async mintTalismanNFT({ userId, collectionId, nftCollectionId, userAccountId, userPrivateKey = null, metadata = null }) {
    try {
      if (!userId || !collectionId || !nftCollectionId || !userAccountId) {
        throw new Error('Missing required parameters for minting');
      }

      console.log(`🎨 Minting talisman NFT: collection=${nftCollectionId}, user=${userAccountId}`);

      // Use the provided user account ID
      const accountToUse = userAccountId.trim();

      // Create ultra-compact metadata (Hedera NFT metadata limit is 100 bytes)
      // Use minimal format - just a simple string or number
      let metadataString;
      let metadataBuffer;
      const encoder = new TextEncoder();
      
      if (metadata) {
        // If metadata is already a string, use it directly
        if (typeof metadata === 'string') {
          metadataString = metadata;
        } else {
          // If it's an object, stringify it
          metadataString = JSON.stringify(metadata);
        }
        
        // Validate and compress if needed
        let size = encoder.encode(metadataString).length;
        if (size > 100) {
          // Fallback: just use timestamp
          const timestamp = Date.now().toString().slice(-10);
          metadataString = timestamp;
          size = encoder.encode(metadataString).length;
          
          if (size > 100) {
            throw new Error(`Metadata too large: ${size} bytes (max: 100 bytes)`);
          }
        }
      } else {
        // Default: use minimal format - just a timestamp number as string
        // This is the smallest possible: just digits
        const timestamp = Date.now().toString().slice(-10); // Last 10 digits = 10 bytes
        metadataString = timestamp;
      }
      
      // Convert to buffer
      if (typeof Buffer !== 'undefined') {
        metadataBuffer = Buffer.from(metadataString, 'utf8');
      } else {
        metadataBuffer = encoder.encode(metadataString);
      }
      
      const finalSize = metadataBuffer.length;
      if (finalSize > 100) {
        throw new Error(`Metadata too large: ${finalSize} bytes (max: 100 bytes). Content: "${metadataString}"`);
      }
      
      console.log(`✅ Metadata prepared: "${metadataString}" (${finalSize} bytes, limit: 100)`);

      // Associate token with user's account before minting
      // Priority: 1) Private key (app-created accounts - automatic), 2) HashConnect (HashPack users - requires signature)
      let associationCompleted = false;
      
      try {
        // First, try private key association (for app-created accounts - automatic, no user interaction)
        if (userPrivateKey) {
          console.log(`Associating token ${nftCollectionId} with account ${accountToUse} using private key (app-created account)...`);
          try {
            await hederaService.associateToken({
              accountId: accountToUse,
              accountPrivateKey: userPrivateKey,
              tokenId: nftCollectionId
            });
            console.log(`✅ Token associated successfully using private key`);
            associationCompleted = true;
          } catch (assocError) {
            if (assocError.message && (
              assocError.message.includes('TOKEN_ALREADY_ASSOCIATED') ||
              assocError.message.includes('ALREADY_ASSOCIATED')
            )) {
              console.log('ℹ️ Token already associated (checked via private key)');
              associationCompleted = true;
            } else {
              console.warn('Private key association failed:', assocError.message);
              // Continue to try HashConnect if available
            }
          }
        }
        
        // If private key association didn't work, try HashConnect (for HashPack users)
        if (!associationCompleted) {
          const hashconnect = getHashConnect();
          const isConnected = hashconnect && hashconnect.connectedAccountIds && hashconnect.connectedAccountIds.length > 0;
          const connectedAccountId = isConnected ? hashconnect.connectedAccountIds[0].toString() : null;
          
          if (isConnected && connectedAccountId && connectedAccountId === accountToUse) {
            // User is connected via HashPack - use HashConnect to associate
            console.log(`Associating token ${nftCollectionId} with account ${accountToUse} via HashConnect (HashPack)...`);
            console.log(`   You will be prompted to sign the association transaction in HashPack.`);
            
            try {
              const {
                TokenAssociateTransaction,
                TokenId,
                AccountId,
                Client,
                TransactionId
              } = await import('@hashgraph/sdk');
              
              const client = Client.forTestnet();
              const userAccount = AccountId.fromString(accountToUse);
              const tokenIdObj = TokenId.fromString(nftCollectionId);
              
              // Create association transaction
              const associateTx = new TokenAssociateTransaction()
                .setAccountId(userAccount)
                .setTokenIds([tokenIdObj])
                .setTransactionId(TransactionId.generate(userAccount));
              
              // Set node account IDs
              const nodeIds = await client.getNodeAccountIdsForExecute();
              associateTx.setNodeAccountIds(nodeIds);
              
              // Freeze and send via HashConnect (user will be prompted to sign)
              const frozenTx = await associateTx.freezeWith(client);
              const receipt = await hashconnect.sendTransaction(userAccount, frozenTx);
              
              console.log(`✅ Token associated successfully via HashConnect!`);
              console.log(`   Association transaction: ${receipt.transactionId.toString()}`);
              associationCompleted = true;
            } catch (hashconnectAssocError) {
              if (hashconnectAssocError.message && (
                hashconnectAssocError.message.includes('TOKEN_ALREADY_ASSOCIATED') ||
                hashconnectAssocError.message.includes('ALREADY_ASSOCIATED')
              )) {
                console.log('ℹ️ Token already associated (checked via HashConnect)');
                associationCompleted = true;
              } else {
                console.warn('HashConnect association failed:', hashconnectAssocError.message);
                // User might have rejected the transaction or there was an error
                throw new Error(
                  `Token association required. Please approve the association transaction in HashPack, or associate the token manually. ` +
                  `Token ID: ${nftCollectionId}`
                );
              }
            }
          }
        }
        
        if (!associationCompleted) {
          throw new Error(
            `Could not associate token automatically. Please associate the token ${nftCollectionId} with your account first. ` +
            `For HashPack users: Open HashPack > Assets > Add Token, then search for ${nftCollectionId} and associate it.`
          );
        }
      } catch (assocError) {
        // Association failure should stop the minting process since transfer will fail
        console.error('Association failed:', assocError);
        throw new Error(
          `Failed to associate token: ${assocError.message}. ` +
          `The token must be associated with your account before receiving the NFT.`
        );
      }

      // Mint the NFT (goes to treasury first)
      console.log(`Minting NFT to treasury...`);
      const mintResult = await hederaService.mintNfts({
        tokenId: nftCollectionId,
        metadataList: [metadataBuffer]
      });

      if (!mintResult.serials || mintResult.serials.length === 0) {
        throw new Error('Failed to mint NFT - no serial number returned');
      }

      const serialNumber = mintResult.serials[0];
      console.log(`✅ NFT minted successfully! Serial: ${serialNumber}`);

      // Transfer NFT from treasury to user
      // The mint goes to treasury, so we need to transfer it
      let transferTxId = null;
      try {
        console.log(`Transferring NFT from treasury to user account ${accountToUse}...`);
        const transferResult = await hederaService.transferToken({
          tokenId: nftCollectionId,
          fromAccountId: process.env.REACT_APP_HEDERA_OPERATOR_ID,
          fromPrivateKey: process.env.REACT_APP_HEDERA_OPERATOR_KEY,
          toAccountId: accountToUse,
          nftSerial: serialNumber
        });
        transferTxId = transferResult.transactionId;
        console.log(`✅ NFT transfer transaction completed!`);
        console.log(`   Transaction ID: ${transferTxId}`);
        console.log(`   Status: ${transferResult.status}`);
        console.log(`   View on HashScan: ${transferResult.hashscanUrl}`);
        console.log(`   Transfer result:`, transferResult);
      } catch (transferError) {
        console.error('Transfer error:', transferError);
        
        // Check if error is due to token not being associated
        if (transferError.message && (
          transferError.message.includes('TOKEN_NOT_ASSOCIATED') ||
          transferError.message.includes('NOT_ASSOCIATED') ||
          transferError.message.includes('association') ||
          transferError.message.includes('UNEXPECTED_TOKEN_DELETION') // Sometimes association errors show as this
        )) {
          const hashscanUrl = `https://hashscan.io/testnet/token/${nftCollectionId}?serial=${serialNumber}`;
          throw new Error(
            `❌ Token association required!\n\n` +
            `The NFT has been minted (Serial #${serialNumber}) but cannot be transferred because your account is not associated with the token.\n\n` +
            `To fix this:\n` +
            `1. Open your HashPack wallet\n` +
            `2. Go to the Assets tab\n` +
            `3. Click "Add Token" or search for token ID: ${nftCollectionId}\n` +
            `4. Associate the token with your account\n` +
            `5. The NFT will then be available in your wallet\n\n` +
            `View NFT: ${hashscanUrl}`
          );
        }
        
        // Other transfer errors
        const hashscanUrl = transferError.transactionId 
          ? `https://hashscan.io/testnet/transaction/${transferError.transactionId}`
          : `https://hashscan.io/testnet/token/${nftCollectionId}?serial=${serialNumber}`;
        throw new Error(
          `Failed to transfer NFT to your account: ${transferError.message}\n\n` +
          `The NFT has been minted (Serial #${serialNumber}) but may still be in treasury.\n` +
          `Check: ${hashscanUrl}`
        );
      }
      
      // Verify the transfer succeeded by checking if NFT is in user's account
      // Note: There might be a delay, so this is best-effort
      try {
        console.log(`Verifying NFT ownership...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for propagation
        
        const verifyUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountToUse}/nfts?token.id=${nftCollectionId}&serialnumber=${serialNumber}`;
        const verifyResponse = await fetch(verifyUrl);
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const nfts = verifyData.nfts || [];
          const nftFound = nfts.some(nft => 
            (nft.token_id === nftCollectionId || nft.tokenId === nftCollectionId) &&
            (nft.serial_number === serialNumber || nft.serialNumber === serialNumber)
          );
          
          if (nftFound) {
            console.log(`✅ Verified: NFT is now in user's account`);
          } else {
            console.warn(`⚠️  NFT not yet found in user's account (may need more time to propagate)`);
          }
        }
      } catch (verifyError) {
        console.warn('Verification check failed (non-critical):', verifyError.message);
      }

      // Save to database
      console.log(`Saving talisman to database...`);
      const talismanRecord = await mintTalisman({
        userId,
        collectionId,
        nftSerialNumber: serialNumber.toString()
      });

      console.log(`🎉 Talisman minted and saved successfully!`);
      
      const hashscanNftUrl = `https://hashscan.io/testnet/token/${nftCollectionId}?serial=${serialNumber}`;
      const transferUrl = transferTxId ? `https://hashscan.io/testnet/transaction/${transferTxId}` : null;
      
      return {
        success: true,
        talisman: talismanRecord,
        nftSerialNumber: serialNumber,
        nftCollectionId: nftCollectionId,
        accountId: accountToUse,
        transferTransactionId: transferTxId,
        hashscanNftUrl: hashscanNftUrl,
        transferHashscanUrl: transferUrl,
        message: `✅ Talisman NFT minted successfully!\n\n` +
          `NFT Serial: #${serialNumber}\n` +
          `Collection: ${nftCollectionId}\n\n` +
          `View NFT: ${hashscanNftUrl}\n` +
          (transferUrl ? `Transfer Tx: ${transferUrl}\n` : '') +
          `\nNote: If you don't see the NFT in your wallet, make sure you've associated the token (${nftCollectionId}) with your account in HashPack.`
      };
    } catch (error) {
      console.error('Error minting talisman NFT:', error);
      throw new Error(`Failed to mint talisman: ${error.message}`);
    }
  }

  /**
   * Mint Daily Planter talisman specifically
   * @param {string} userId - User profile ID
   * @param {string} userAccountId - User's Hedera account ID
   * @param {Object} collection - Talisman collection record from database
   * @param {string} userPrivateKey - Optional: User's private key for association
   * @returns {Promise<Object>} - Minted talisman data
   */
  static async mintDailyPlanterTalisman(userId, userAccountId, collection, userPrivateKey = null) {
    if (!collection || collection.perk_type !== 'daily_planter') {
      throw new Error('Invalid collection - must be daily_planter type');
    }

    if (!collection.nft_collection_id) {
      throw new Error('Collection does not have an NFT collection ID. Please deploy the NFT collection first.');
    }

    // Ultra-compact metadata - Hedera limit is 100 bytes
    // Use minimal format: just a timestamp string (10 bytes)
    // All other details (name, description, etc.) are stored in the database
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits = 10 bytes
    const metadata = timestamp; // Simple string, well under 100-byte limit

    return await this.mintTalismanNFT({
      userId,
      collectionId: collection.id,
      nftCollectionId: collection.nft_collection_id,
      userAccountId,
      userPrivateKey,
      metadata
    });
  }
}

export default TalismanMintService;

