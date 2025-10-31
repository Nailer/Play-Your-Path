# Talisman NFT Deployment with Pinata IPFS

This guide covers deploying talisman NFT collections to Hedera testnet with metadata and images stored on IPFS via Pinata.

## Prerequisites

1. **Hedera Testnet Account**: You need a Hedera testnet account with HBAR for transaction fees
2. **Pinata Account**: Sign up at [pinata.cloud](https://pinata.cloud) for IPFS storage
3. **Environment Variables**: Set up your `.env` file with the required credentials

## Environment Setup

Add these variables to your `.env` file:

```bash
# Hedera Testnet Credentials
REACT_APP_HEDERA_OPERATOR_ID=0.0.xxxxx
REACT_APP_HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...

# Pinata IPFS Credentials
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key
REACT_APP_PINATA_JWT_TOKEN=your_pinata_jwt_token
REACT_APP_PINATA_GATEWAY=https://gateway.pinata.cloud
```

### Getting Pinata Credentials

1. **Sign up** at [pinata.cloud](https://pinata.cloud)
2. **Get API Key**: Go to API Keys section and create a new key
3. **Get JWT Token**: Use the JWT token for authentication (recommended)
4. **Gateway URL**: Use `https://gateway.pinata.cloud` or your custom gateway

## Installation

Install the required dependencies:

```bash
npm install axios form-data dotenv
```

## Deployment Process

### 1. Deploy Talisman NFT Collections

Run the deployment script:

```bash
npm run deploy:talismans
```

This will:
- ✅ Download images from Unsplash URLs
- ✅ Upload images to Pinata IPFS
- ✅ Create metadata JSON with IPFS image URLs
- ✅ Upload metadata to Pinata IPFS
- ✅ Create 6 NFT collections on Hedera testnet
- ✅ Mint initial NFTs for each collection
- ✅ Generate SQL to update Supabase

### 2. Update Supabase Database

The script will output SQL statements like:

```sql
-- Update talisman collections with NFT collection IDs
UPDATE public.talisman_collections
SET nft_collection_id = '0.0.1234567',
    metadata_ipfs_url = 'https://gateway.pinata.cloud/ipfs/QmXxx...',
    image_ipfs_url = 'https://gateway.pinata.cloud/ipfs/QmYyy...'
WHERE perk_type = 'home_defense';
```

Run these SQL statements in your Supabase SQL editor.

### 3. Test Talisman System

1. **Award a talisman** to a test user:
   ```bash
   npm run award:talisman USER_ID home_defense
   ```

2. **Check the game UI** - the talisman should appear in the collection
3. **Activate a talisman** - only one can be active at a time
4. **Test daily rewards** - Daily Planter talisman should provide bonus points

## Talisman Collections

The deployment creates 6 NFT collections:

| Name | Symbol | Rarity | Perk | Image Theme |
|------|--------|--------|------|-------------|
| 🏠 Home Defender | HOMEDEF | Rare | +50 defense, 24h protection | Castle/fortress |
| 🧠 Scholar | SCHOLAR | Common | +25% XP, 10% course discount | Student/learning |
| 🌿 Daily Planter | PLANTER | Epic | +2% bonus for 7-day streaks | Plant/garden |
| 🍀 Lucky Charm | LUCKY | Legendary | +15% drop rate, +1 rarity | Lucky charm |
| ⚡ Speed Demon | SPEED | Rare | 30% cooldown reduction, +20 energy | Lightning/speed |
| 👼 Guardian Angel | GUARDIAN | Epic | +40% healing, 60min protection | Angel/guardian |

## IPFS Storage Details

### Images
- **Source**: High-quality images from Unsplash
- **Format**: PNG, 400x400px, optimized
- **Storage**: Pinata IPFS with metadata tags
- **Access**: Public via Pinata gateway

### Metadata
- **Format**: JSON following NFT metadata standards
- **Content**: Name, description, image URL, attributes
- **Storage**: Pinata IPFS with metadata tags
- **Access**: Public via Pinata gateway

## Troubleshooting

### Common Issues

1. **"Missing operator credentials"**
   - Check your `.env` file has `REACT_APP_HEDERA_OPERATOR_ID` and `REACT_APP_HEDERA_OPERATOR_KEY`
   - Ensure the account has sufficient HBAR for transaction fees

2. **"Failed to upload to Pinata"**
   - Verify your Pinata credentials in `.env`
   - Check your Pinata account has sufficient storage quota
   - Ensure JWT token is valid and not expired

3. **"Image download failed"**
   - Check internet connection
   - Verify Unsplash URLs are accessible
   - Try running the script again (images are cached)

4. **"NFT creation failed"**
   - Ensure Hedera account has sufficient HBAR
   - Check network connectivity to Hedera testnet
   - Verify operator credentials are correct

### Debug Mode

Add debug logging by setting:
```bash
DEBUG=1 npm run deploy:talismans
```

## File Structure

```
scripts/
├── deploy-talisman-nfts.js    # Main deployment script
├── mint-talisman.js          # Mint specific talisman
├── award-talisman.js          # Award talisman to user
└── temp/                      # Temporary image downloads (auto-cleaned)
```

## Next Steps

After successful deployment:

1. **Test the UI** - Verify talisman collection modal works
2. **Test activation** - Ensure only one talisman can be active
3. **Test perks** - Verify Daily Planter bonus in daily rewards
4. **Implement quests** - Create quests that award talismans
5. **Add rarity system** - Implement drop rates based on rarity

## Support

- **Hedera Docs**: [docs.hedera.com](https://docs.hedera.com)
- **Pinata Docs**: [docs.pinata.cloud](https://docs.pinata.cloud)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

## Cost Estimation

- **Hedera Testnet**: Free (testnet HBAR)
- **Pinata IPFS**: Free tier includes 1GB storage
- **Images**: ~6 images × 100KB = 600KB
- **Metadata**: ~6 JSON files × 1KB = 6KB
- **Total**: Well within free tier limits

