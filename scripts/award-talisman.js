#!/usr/bin/env node
/*
  Award a talisman to a user based on achievement/quest completion.
  Usage:
    REACT_APP_HEDERA_OPERATOR_ID=0.0.x REACT_APP_HEDERA_OPERATOR_KEY=302e... \
    node scripts/award-talisman.js <perk_type> <user_account_id> [achievement_name]

  Example:
    node scripts/award-talisman.js daily_planter 0.0.789012 "7 Day Streak"
    node scripts/award-talisman.js scholar 0.0.789012 "Course Completion"
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

const TALISMAN_TYPES = {
  'home_defense': { name: 'Home Defender', emoji: '🏠', rarity: 'rare' },
  'scholar': { name: 'Scholar', emoji: '🧠', rarity: 'common' },
  'daily_planter': { name: 'Daily Planter', emoji: '🌿', rarity: 'epic' },
  'lucky_charm': { name: 'Lucky Charm', emoji: '🍀', rarity: 'legendary' },
  'speed_demon': { name: 'Speed Demon', emoji: '⚡', rarity: 'rare' },
  'guardian_angel': { name: 'Guardian Angel', emoji: '👼', rarity: 'epic' }
};

async function awardTalisman(perkType, userAccountId, achievementName = null) {
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

  if (!perkType || !userAccountId) {
    console.error('Usage: node scripts/award-talisman.js <perk_type> <user_account_id> [achievement_name]');
    console.error('Available perk types:', Object.keys(TALISMAN_TYPES).join(', '));
    console.error('Example: node scripts/award-talisman.js daily_planter 0.0.789012 "7 Day Streak"');
    process.exit(1);
  }

  if (!TALISMAN_TYPES[perkType]) {
    console.error(`Invalid perk type: ${perkType}`);
    console.error('Available types:', Object.keys(TALISMAN_TYPES).join(', '));
    process.exit(1);
  }

  const talismanInfo = TALISMAN_TYPES[perkType];
  console.log(`🏆 Awarding ${talismanInfo.emoji} ${talismanInfo.name} talisman to ${userAccountId}`);

  const client = Client.forTestnet().setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));

  try {
    // Check if user account exists
    const balanceQuery = new AccountBalanceQuery().setAccountId(AccountId.fromString(userAccountId));
    const balance = await balanceQuery.execute(client);
    console.log(`✅ User account verified. Balance: ${balance.hbars} HBAR`);

    // Get collection ID from Supabase (you'd need to query this in a real implementation)
    // For now, we'll use a placeholder - you'll need to update this with actual collection IDs
    console.log(`⚠️  Note: You need to update this script with actual NFT collection IDs from your deployment`);
    console.log(`   Run 'npm run deploy:talismans' first to get the collection IDs`);
    
    // This is a placeholder - replace with actual collection ID
    const collectionId = 'COLLECTION_ID_PLACEHOLDER';
    
    if (collectionId === 'COLLECTION_ID_PLACEHOLDER') {
      console.error('❌ Please update the script with actual collection IDs from your NFT deployment');
      console.error('   Run: npm run deploy:talismans');
      console.error('   Then update this script with the collection IDs');
      process.exit(1);
    }

    // Associate token with user account
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

    // Create achievement metadata
    const metadata = {
      name: `${talismanInfo.name} Talisman`,
      description: `Awarded for ${achievementName || 'achievement'}`,
      image: `https://example.com/${perkType}.png`,
      attributes: [
        { trait_type: 'Perk Type', value: talismanInfo.name },
        { trait_type: 'Rarity', value: talismanInfo.rarity },
        { trait_type: 'Achievement', value: achievementName || 'General Achievement' },
        { trait_type: 'Awarded At', value: new Date().toISOString() },
        { trait_type: 'Recipient', value: userAccountId }
      ]
    };

    // Mint NFT to user
    const mintTx = await new TokenMintTransaction()
      .setTokenId(AccountId.fromString(collectionId))
      .setMetadata([Buffer.from(JSON.stringify(metadata), 'utf8')])
      .execute(client);

    const mintReceipt = await mintTx.getReceipt(client);
    const serialNumber = mintReceipt.serials[0];

    console.log(`🎉 Successfully awarded talisman!`);
    console.log(`   ${talismanInfo.emoji} ${talismanInfo.name} (${talismanInfo.rarity})`);
    console.log(`   Collection ID: ${collectionId}`);
    console.log(`   Serial Number: #${serialNumber}`);
    console.log(`   Recipient: ${userAccountId}`);
    console.log(`   Achievement: ${achievementName || 'General'}`);

    // Generate SQL to add to user's collection
    console.log(`\n📝 SQL to add to user's talisman collection:`);
    console.log(`-- Replace USER_PROFILE_ID with actual user profile ID from your database`);
    console.log(`INSERT INTO public.user_talismans (user_id, collection_id, nft_serial_number)`);
    console.log(`SELECT 'USER_PROFILE_ID', id, '${serialNumber}'`);
    console.log(`FROM public.talisman_collections WHERE perk_type = '${perkType}';`);

    return {
      perkType,
      collectionId,
      serialNumber: serialNumber.toString(),
      userAccountId,
      achievementName,
      metadata
    };

  } catch (error) {
    console.error(`❌ Failed to award talisman:`, error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const [perkType, userAccountId, achievementName] = args;

awardTalisman(perkType, userAccountId, achievementName);

