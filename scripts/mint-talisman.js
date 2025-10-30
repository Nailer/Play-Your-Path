#!/usr/bin/env node
/*
  Mint a specific talisman NFT to a user.
  Usage:
    REACT_APP_HEDERA_OPERATOR_ID=0.0.x REACT_APP_HEDERA_OPERATOR_KEY=302e... \
    node scripts/mint-talisman.js <collection_id> <user_account_id> [metadata_json]

  Example:
    node scripts/mint-talisman.js 0.0.123456 0.0.789012 '{"custom_attr":"value"}'
*/

// Load env from project .env if present
try { require('dotenv').config(); } catch (_) {}

const {
  Client,
  PrivateKey,
  AccountId,
  TokenMintTransaction,
  TokenAssociateTransaction,
  AccountBalanceQuery
} = require('@hashgraph/sdk');

async function mintTalismanToUser(collectionId, userAccountId, customMetadata = null) {
  const operatorId = process.env.REACT_APP_HEDERA_OPERATOR_ID
    || process.env.MY_ACCOUNT_ID
    || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID
    || process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.REACT_APP_HEDERA_OPERATOR_KEY
    || process.env.MY_PRIVATE_KEY
    || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY
    || process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    console.error('Missing operator credentials. Set REACT_APP_HEDERA_OPERATOR_ID and REACT_APP_HEDERA_OPERATOR_KEY');
    process.exit(1);
  }

  if (!collectionId || !userAccountId) {
    console.error('Usage: node scripts/mint-talisman.js <collection_id> <user_account_id> [metadata_json]');
    console.error('Example: node scripts/mint-talisman.js 0.0.123456 0.0.789012');
    process.exit(1);
  }

  console.log(`🎨 Minting talisman from collection ${collectionId} to user ${userAccountId}`);

  const client = Client.forTestnet().setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));

  try {
    // Check if user account exists and has balance
    const balanceQuery = new AccountBalanceQuery().setAccountId(AccountId.fromString(userAccountId));
    const balance = await balanceQuery.execute(client);
    console.log(`✅ User account verified. Balance: ${balance.hbars} HBAR`);

    // Associate token with user account (if not already associated)
    try {
      const associateTx = await new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(userAccountId))
        .setTokenIds([AccountId.fromString(collectionId)])
        .execute(client);

      await associateTx.getReceipt(client);
      console.log(`✅ Token associated with user account`);
    } catch (error) {
      if (error.message.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
        console.log(`ℹ️  Token already associated with user account`);
      } else {
        throw error;
      }
    }

    // Prepare metadata
    let metadata = customMetadata;
    if (!metadata) {
      // Default metadata based on collection
      metadata = {
        name: 'Talisman NFT',
        description: 'A powerful talisman with special abilities',
        image: 'https://example.com/talisman.png',
        attributes: [
          { trait_type: 'Minted At', value: new Date().toISOString() },
          { trait_type: 'Recipient', value: userAccountId }
        ]
      };
    } else {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error('Invalid JSON metadata provided');
        process.exit(1);
      }
    }

    // Mint NFT to user
    const mintTx = await new TokenMintTransaction()
      .setTokenId(AccountId.fromString(collectionId))
      .setMetadata([Buffer.from(JSON.stringify(metadata), 'utf8')])
      .execute(client);

    const mintReceipt = await mintTx.getReceipt(client);
    const serialNumber = mintReceipt.serials[0];

    console.log(`🎉 Successfully minted talisman NFT!`);
    console.log(`   Collection ID: ${collectionId}`);
    console.log(`   Serial Number: #${serialNumber}`);
    console.log(`   Recipient: ${userAccountId}`);
    console.log(`   Metadata: ${JSON.stringify(metadata, null, 2)}`);

    // Generate SQL to add to user's collection
    console.log(`\n📝 SQL to add to user's talisman collection:`);
    console.log(`-- Replace USER_PROFILE_ID with actual user profile ID from your database`);
    console.log(`INSERT INTO public.user_talismans (user_id, collection_id, nft_serial_number)`);
    console.log(`SELECT 'USER_PROFILE_ID', id, '${serialNumber}'`);
    console.log(`FROM public.talisman_collections WHERE nft_collection_id = '${collectionId}';`);

    return {
      collectionId,
      serialNumber: serialNumber.toString(),
      userAccountId,
      metadata
    };

  } catch (error) {
    console.error(`❌ Failed to mint talisman:`, error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const [collectionId, userAccountId, metadataJson] = args;

mintTalismanToUser(collectionId, userAccountId, metadataJson);

