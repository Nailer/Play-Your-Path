# 🏆 Talisman NFT Deployment Guide

This guide will help you deploy all talisman NFT collections to Hedera testnet and set up the complete talisman system.

## 🚀 Quick Start

### 1. Deploy All Talisman Collections

```bash
# Make sure your .env has Hedera credentials
npm run deploy:talismans
```

This will create 6 NFT collections:
- 🏠 **Home Defender** (Rare) - +50 defense, 24h cooldown
- 🧠 **Scholar** (Common) - +25% XP bonus, 10% course discount  
- 🌿 **Daily Planter** (Epic) - +2% bonus for 7-day streaks
- 🍀 **Lucky Charm** (Legendary) - +15% drop rate, +1 rarity boost
- ⚡ **Speed Demon** (Rare) - 30% cooldown reduction, +20 energy
- 👼 **Guardian Angel** (Epic) - +40% healing, 60min protection

### 2. Update Supabase Database

The deployment script will output SQL commands. Run them in your Supabase SQL editor:

```sql
-- Update talisman collections with NFT collection IDs
UPDATE public.talisman_collections
SET nft_collection_id = '0.0.123456'
WHERE perk_type = 'home_defense';

-- ... (more updates for each collection)
```

### 3. Test the System

1. **Open Talisman Collection**: Click "Talismans" button in game
2. **Award Test Talismans**: Use the award script to give users talismans
3. **Test Activation**: Activate talismans and see perks in action

## 📋 Detailed Commands

### Deploy All Collections
```bash
npm run deploy:talismans
```

### Mint Specific Talisman
```bash
# Mint a talisman from a collection to a user
npm run mint:talisman 0.0.123456 0.0.789012

# With custom metadata
npm run mint:talisman 0.0.123456 0.0.789012 '{"achievement":"7 Day Streak"}'
```

### Award Talisman for Achievement
```bash
# Award Daily Planter for 7-day streak
npm run award:talisman daily_planter 0.0.789012 "7 Day Streak"

# Award Scholar for course completion
npm run award:talisman scholar 0.0.789012 "Course Completion"

# Award Lucky Charm for rare achievement
npm run award:talisman lucky_charm 0.0.789012 "Legendary Discovery"
```

## 🎮 Integration Points

### Daily Rewards
- **Daily Planter** talisman automatically gives bonus points for streaks
- Enhanced daily claim UI shows talisman bonus messages

### Quest System (Future)
- Award talismans for completing achievements
- Different talismans for different quest types

### User Interface
- **Talisman Collection Modal**: View, activate, and manage talismans
- **Rarity System**: Visual indicators for Common/Rare/Epic/Legendary
- **Perk Descriptions**: Clear explanations of each talisman's abilities

## 🔧 Configuration

### Environment Variables
```env
REACT_APP_HEDERA_OPERATOR_ID=0.0.xxxxxx
REACT_APP_HEDERA_OPERATOR_KEY=302e0201...
```

### Supabase Setup
1. Run `supabase-talisman-schema.sql` to create tables
2. Update collection IDs after deployment
3. Set up RLS policies (included in schema)

## 🎯 Next Steps

1. **Deploy Collections**: Run `npm run deploy:talismans`
2. **Update Database**: Copy SQL output to Supabase
3. **Test System**: Award talismans and test activation
4. **Quest Integration**: Build achievement system to award talismans
5. **UI Polish**: Add more visual effects and animations

## 🐛 Troubleshooting

### Common Issues

**"Missing operator credentials"**
- Check your `.env` file has correct Hedera credentials
- Restart the terminal after updating `.env`

**"Token already associated"**
- This is normal - means the user already has the token associated

**"Collection not found"**
- Make sure you've run the deployment script first
- Check the collection IDs in your Supabase database

**"Talisman modal not showing"**
- Check browser console for errors
- Verify the talisman button is sending messages correctly
- Ensure you're logged in with a valid user

### Debug Commands

```bash
# Check if collections exist
npm run deploy:talismans

# Test minting to a specific user
npm run mint:talisman COLLECTION_ID USER_ACCOUNT_ID

# Test awarding for achievement
npm run award:talisman daily_planter USER_ACCOUNT_ID "Test Achievement"
```

## 🎉 Success!

Once deployed, your talisman system will provide:
- **6 Unique NFT Collections** with special metadata
- **Perk System** that automatically applies bonuses
- **Beautiful UI** for collection management
- **Achievement Integration** for awarding talismans
- **Rarity System** with visual indicators

Users can now collect, activate, and benefit from powerful talisman NFTs that enhance their gameplay experience!

