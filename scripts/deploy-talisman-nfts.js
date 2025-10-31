#!/usr/bin/env node
/*
  Deploy all talisman NFT collections to Hedera testnet.
  Usage:
    REACT_APP_HEDERA_OPERATOR_ID=0.0.x REACT_APP_HEDERA_OPERATOR_KEY=302e... \
    node scripts/deploy-talisman-nfts.js

  This script will:
  1. Create 6 NFT collections (one for each talisman type)
  2. Mint initial NFTs for each collection
  3. Output SQL to update Supabase with collection IDs
*/

// Load env from project .env if present
try { require('dotenv').config(); } catch (_) {}

const {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  NftId,
  FileCreateTransaction,
  FileAppendTransaction,
  FileContentsQuery
} = require('@hashgraph/sdk');

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Pinata IPFS configuration
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT_TOKEN;
const PINATA_GATEWAY = process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

// Pinata IPFS functions
async function uploadToPinata(filePath, fileName) {
  if (!PINATA_JWT) {
    console.warn('⚠️ PINATA_JWT not found, using placeholder URLs');
    return `${PINATA_GATEWAY}/ipfs/placeholder-${fileName}`;
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'talisman-image'
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0
    });
    formData.append('pinataOptions', options);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders()
      }
    });

    const ipfsHash = response.data.IpfsHash;
    console.log(`✅ Uploaded ${fileName} to IPFS: ${ipfsHash}`);
    return `${PINATA_GATEWAY}/ipfs/${ipfsHash}`;
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName} to Pinata:`, error.message);
    return `${PINATA_GATEWAY}/ipfs/placeholder-${fileName}`;
  }
}

async function uploadMetadataToPinata(metadata, fileName) {
  if (!PINATA_JWT) {
    console.warn('⚠️ PINATA_JWT not found, using placeholder metadata');
    return `${PINATA_GATEWAY}/ipfs/placeholder-metadata-${fileName}`;
  }

  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      pinataContent: metadata,
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          type: 'talisman-metadata'
        }
      },
      pinataOptions: {
        cidVersion: 0
      }
    }, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json'
      }
    });

    const ipfsHash = response.data.IpfsHash;
    console.log(`✅ Uploaded metadata ${fileName} to IPFS: ${ipfsHash}`);
    return `${PINATA_GATEWAY}/ipfs/${ipfsHash}`;
  } catch (error) {
    console.error(`❌ Failed to upload metadata ${fileName} to Pinata:`, error.message);
    return `${PINATA_GATEWAY}/ipfs/placeholder-metadata-${fileName}`;
  }
}

const TALISMAN_COLLECTIONS = [
  {
    name: 'Home Defender',
    symbol: 'HOMEDEF',
    description: 'Protects your virtual home from invasions and raids',
    emoji: '🏠',
    perkType: 'home_defense',
    rarity: 'rare',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=400&fit=crop&crop=center', // Castle/fortress image
    metadata: {
      name: 'Home Defender Talisman',
      description: 'A powerful talisman that provides +50 defense and 24h cooldown protection for your virtual home.',
      image: '', // Will be set to IPFS URL
      attributes: [
        { trait_type: 'Perk Type', value: 'Home Defense' },
        { trait_type: 'Defense Bonus', value: 50 },
        { trait_type: 'Cooldown Hours', value: 24 },
        { trait_type: 'Rarity', value: 'Rare' }
      ]
    }
  },
  {
    name: 'Scholar',
    symbol: 'SCHOLAR',
    description: 'Enhances learning and knowledge acquisition',
    emoji: '🧠',
    perkType: 'scholar',
    rarity: 'common',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center', // Scholar/student image
    metadata: {
      name: 'Scholar Talisman',
      description: 'A wise talisman that provides +25% XP bonus and 10% course discount.',
      image: '', // Will be set to IPFS URL
      attributes: [
        { trait_type: 'Perk Type', value: 'Scholar' },
        { trait_type: 'XP Bonus', value: '25%' },
        { trait_type: 'Course Discount', value: '10%' },
        { trait_type: 'Rarity', value: 'Common' }
      ]
    }
  },
  {
    name: 'Daily Planter',
    symbol: 'PLANTER',
    description: 'Rewards consistent daily engagement',
    emoji: '🌿',
    perkType: 'daily_planter',
    rarity: 'epic',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&crop=center', // Plant/garden image
    metadata: {
      name: 'Daily Planter Talisman',
      description: 'A nurturing talisman that provides +2% bonus for 7-day streaks.',
      image: '', // Will be set to IPFS URL
      attributes: [
        { trait_type: 'Perk Type', value: 'Daily Planter' },
        { trait_type: 'Streak Bonus', value: '2%' },
        { trait_type: 'Required Streak', value: 7 },
        { trait_type: 'Rarity', value: 'Epic' }
      ]
    }
  },
  {
    name: 'Lucky Charm',
    symbol: 'LUCKY',
    description: 'Increases rare item drop rates',
    emoji: '🍀',
    perkType: 'lucky_charm',
    rarity: 'legendary',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=center', // Lucky charm image
    metadata: {
      name: 'Lucky Charm Talisman',
      description: 'A mystical talisman that provides +15% drop rate and +1 rarity boost.',
      image: '', // Will be set to IPFS URL
      attributes: [
        { trait_type: 'Perk Type', value: 'Lucky Charm' },
        { trait_type: 'Drop Rate Bonus', value: '15%' },
        { trait_type: 'Rarity Boost', value: 1 },
        { trait_type: 'Rarity', value: 'Legendary' }
      ]
    }
  },
  {
    name: 'Speed Demon',
    symbol: 'SPEED',
    description: 'Reduces cooldowns and wait times',
    emoji: '⚡',
    perkType: 'speed_demon',
    rarity: 'rare',
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop&crop=center', // Lightning/speed image
    metadata: {
      name: 'Speed Demon Talisman',
      description: 'A lightning-fast talisman that provides 30% cooldown reduction and +20 energy.',
      image: '', // Will be set to IPFS URL
      attributes: [
        { trait_type: 'Perk Type', value: 'Speed Demon' },
        { trait_type: 'Cooldown Reduction', value: '30%' },
        { trait_type: 'Energy Boost', value: 20 },
        { trait_type: 'Rarity', value: 'Rare' }
      ]
    }
  },
  {
    name: 'Guardian Angel',
    symbol: 'GUARDIAN',
    description: 'Provides protection and healing bonuses',
    emoji: '👼',
    perkType: 'guardian_angel',
    rarity: 'epic',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=center', // Angel/guardian image
    metadata: {
      name: 'Guardian Angel Talisman',
      description: 'A divine talisman that provides +40% healing and 60min protection.',
      image: '', // Will be set to IPFS URL
      attributes: [
        { trait_type: 'Perk Type', value: 'Guardian Angel' },
        { trait_type: 'Healing Bonus', value: '40%' },
        { trait_type: 'Protection Duration', value: '60min' },
        { trait_type: 'Rarity', value: 'Epic' }
      ]
    }
  }
];

// Download image from URL and upload to IPFS
async function downloadAndUploadImage(imageUrl, fileName) {
  try {
    console.log(`📥 Downloading image: ${imageUrl}`);
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    
    // Create temporary file
    const tempPath = path.join(__dirname, 'temp', fileName);
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        try {
          const ipfsUrl = await uploadToPinata(tempPath, fileName);
          // Clean up temp file
          fs.unlinkSync(tempPath);
          resolve(ipfsUrl);
        } catch (error) {
          reject(error);
        }
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Failed to download image ${imageUrl}:`, error.message);
    return `${PINATA_GATEWAY}/ipfs/placeholder-${fileName}`;
  }
}

async function createMetadataFile(client, metadata) {
  const metadataJson = JSON.stringify(metadata, null, 2);
  const metadataBytes = Buffer.from(metadataJson, 'utf8');

  // Create file
  const fileCreateTx = await new FileCreateTransaction()
    .setContents(metadataBytes)
    .setKeys([client.operatorPublicKey])
    .execute(client);

  const fileReceipt = await fileCreateTx.getReceipt(client);
  const fileId = fileReceipt.fileId;

  console.log(`Created metadata file: ${fileId}`);
  return fileId;
}

async function createNftCollection(client, collection, operatorAccountId, operatorPrivateKey, operatorPublicKey) {
  console.log(`\n🏗️  Creating NFT collection: ${collection.name}`);

  // Download and upload image to IPFS
  const imageFileName = `${collection.symbol.toLowerCase()}-image.png`;
  const imageIpfsUrl = await downloadAndUploadImage(collection.imageUrl, imageFileName);
  
  // Update metadata with IPFS image URL
  const updatedMetadata = {
    ...collection.metadata,
    image: imageIpfsUrl
  };

  // Upload metadata to IPFS
  const metadataFileName = `${collection.symbol.toLowerCase()}-metadata.json`;
  const metadataIpfsUrl = await uploadMetadataToPinata(updatedMetadata, metadataFileName);

  console.log(`📄 Metadata uploaded to IPFS: ${metadataIpfsUrl}`);

  // Create NFT collection
  const tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName(collection.name)
    .setTokenSymbol(collection.symbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setTreasuryAccountId(operatorAccountId)
    .setSupplyKey(operatorPrivateKey)
    .freezeWith(client);

  // Sign the transaction with the token treasury account private key
  const signTxTokenCreate = await tokenCreateTx.sign(operatorPrivateKey);

  // Sign the transaction with the client operator private key and submit to a Hedera network
  const tokenCreateSubmit = await signTxTokenCreate.execute(client);

  // Get the receipt of the transaction
  const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
  const tokenId = tokenCreateReceipt.tokenId;

  console.log(`✅ Created NFT collection: ${tokenId}`);

  // Mint initial NFT with IPFS metadata
  const mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([Buffer.from(JSON.stringify(updatedMetadata), 'utf8')])
    .execute(client);

  const mintReceipt = await mintTx.getReceipt(client);
  const serialNumber = mintReceipt.serials[0];

  console.log(`🎨 Minted initial NFT: Serial #${serialNumber}`);

  return {
    tokenId: tokenId.toString(),
    serialNumber: serialNumber.toString(),
    metadataIpfsUrl: metadataIpfsUrl,
    imageIpfsUrl: imageIpfsUrl
  };
}

async function main() {
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

  // Create temp directory for image downloads
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log(`🚀 Deploying talisman NFT collections with operator: ${operatorId}`);
  console.log(`📁 Using temp directory: ${tempDir}`);

  const client = Client.forTestnet().setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));
  
  // Create public key from private key for NFT creation
  const operatorPrivateKey = PrivateKey.fromString(operatorKey);
  const operatorPublicKey = operatorPrivateKey.publicKey;

  const deployedCollections = [];

  for (const collection of TALISMAN_COLLECTIONS) {
    try {
      const result = await createNftCollection(client, collection, AccountId.fromString(operatorId), operatorPrivateKey, operatorPublicKey);
      deployedCollections.push({
        ...collection,
        ...result
      });
    } catch (error) {
      console.error(`❌ Failed to create ${collection.name}:`, error.message);
    }
  }

  // Clean up temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('🧹 Cleaned up temp directory');
  }

  console.log('\n🎉 Deployment Summary:');
  console.log('====================');

  deployedCollections.forEach(collection => {
    console.log(`\n${collection.emoji} ${collection.name} (${collection.rarity.toUpperCase()})`);
    console.log(`   Collection ID: ${collection.tokenId}`);
    console.log(`   Initial Serial: #${collection.serialNumber}`);
    console.log(`   Perk: ${collection.perkType}`);
    console.log(`   📄 Metadata: ${collection.metadataIpfsUrl}`);
    console.log(`   🖼️  Image: ${collection.imageIpfsUrl}`);
  });

  // Generate SQL to update Supabase
  console.log('\n📝 SQL to update Supabase:');
  console.log('==========================');
  console.log('-- Update talisman collections with NFT collection IDs');
  console.log('');

  deployedCollections.forEach(collection => {
    console.log(`UPDATE public.talisman_collections`);
    console.log(`SET nft_collection_id = '${collection.tokenId}',`);
    console.log(`    metadata_ipfs_url = '${collection.metadataIpfsUrl}',`);
    console.log(`    image_ipfs_url = '${collection.imageIpfsUrl}'`);
    console.log(`WHERE perk_type = '${collection.perkType}';`);
    console.log('');
  });

  console.log('-- Insert initial minted NFTs (optional - for testing)');
  console.log('-- Replace USER_ID with actual user ID');
  console.log('');

  deployedCollections.forEach(collection => {
    console.log(`INSERT INTO public.user_talismans (user_id, collection_id, nft_serial_number)`);
    console.log(`SELECT 'USER_ID', id, '${collection.serialNumber}'`);
    console.log(`FROM public.talisman_collections WHERE perk_type = '${collection.perkType}';`);
    console.log('');
  });

  console.log('🎯 Next steps:');
  console.log('1. Run the SQL above in your Supabase SQL editor');
  console.log('2. Replace USER_ID with actual user IDs for testing');
  console.log('3. Test talisman activation in the game UI');
  console.log('4. Implement quest/achievement system to award talismans');

  process.exit(0);
}

main().catch((e) => { 
  console.error('Deployment failed:', e); 
  process.exit(1); 
});
