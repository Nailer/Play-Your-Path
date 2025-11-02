# Play Your Path (PYP) 🌍

Players play to progress as they learn about Hedera and earn points
🏆 Hackathon Track: Gaming and NFTs

PYP is more than a game — it's a proof-of-game platform, tracking user activities, rewarding progress with NFTs & tokens, and building a blockchain reputation.

## HASHGRAPH HACKATHON SUBMISSION CERTIFICATE
<a href="https://drive.google.com/file/d/1sOhaOhmrroKDrVZCI5MKa9dxdYDkEekH/view?usp=sharing">View Certificate</a>

## Demo Video
<a href="https://youtu.be/TLMQPFt7dDs">View Demo Video</a>

## Presentation Slides
<a href="https://play-your-path-pyp-the-c-2ewouu5.gamma.site/">View Presentation</a>

## Hedera Integration Summary

### Hedera Token Service (HTS):
**In Play Your Path**, we leveraged HTS to create and manage in-game tokens and reward systems. Players **earn Hedera tokens** for completing tasks, learning modules, or interacting with other users — turning engagement into tangible on-chain value. **HTS was chosen for its scalability**, cost-efficiency, and **token programmability**, enabling seamless reward distribution and NFT minting without gas volatility. This empowers users to own, trade, and utilize assets natively on Hedera, fostering a sustainable play-to-earn economy.

### Hedera Consensus Service (HCS):
**HCS powers PYP’s Proof-of-Game system** — every player action, achievement, or AI interaction is logged immutably to establish a verifiable record of participation. This provides players with on-chain credentials that serve as digital reputations and proof of progress. **We chose HCS for its high throughput, timestamp accuracy, and low transaction cost**, ensuring that even complex, multi-player interactions remain transparent and cost-stable. The result is a gamified ecosystem that is fair, transparent, and trusted by design.


## 🕹️ Core Features

### 1. The House (Main Hub)
**Rooms = Activities:**
- **📖 Study Room**: Take quizzes, complete courses → earn NFTs
- **🛋️ Work Bench/Table**: Simulate working → generate meme tokens, collectibles, NFTs
- **🐟 Aquarium (Fish Oracle)**: AI-powered fish that answers questions, analyzes your wallet, gives insights, assigns tasks, and distributes rewards
- **🌱 Garden/Weed Planting**: Plant daily → earn token rewards (daily engagement loop)
- **🛍️ Marketplace**: Trade NFTs and meme tokens
- **🗳️ Council Room**: Participate in governance via tokens

### 2. Social & Community
- Friend system to connect with others
- Shared spaces for interaction, chats, and events
- Mini-games and challenges for community bonding

### 3. AI Integration
The Fish Oracle acts as an in-game mentor:
- Wallet analysis
- Learning assistance
- Task generation
- Reward distribution

### 4. Proof of Game & Reputation
- Every action (planting, learning, quizzes, meme creation, working, invasions) is tracked
- Progress builds a reputation system (blockchain-based)
- Rewards include NFTs, tokens, and increased security tiers for your house

### 5. Gameplay & Strategy
- Invade other players' houses (tier-based system)
- Higher-tier players can interact with lower-tier houses (check progress, compete, challenge)
- Upgrade your house's security by minting more

## 🎮 Demo Summary

- **PYP Hub (The House)**: Central hub with interactive rooms
- **Mode Overlay**: Learn, Play, Trade, Govern, Teleport
- **External Worlds**:
  - Village Square (community events)
  - Festival Grounds (seasonal events)
  - Arena (player vs player challenges)
- **Wallet Integration**: HashPack login with Hedera token support
- **AI Companion**: Fish Oracle for guidance and rewards
- **Blockchain Features**:
  - NFT badge minting
  - Token rewards system
  - On-chain reputation tracking

## Architecture

- React app shell hosts the original game in an iframe
- Legacy game assets live in `public/game` and remain fully static
- Overlay UI injects PYP modes/teleport and Hedera hooks
- Hedera SDK service provides account creation, token and NFT operations
- Supabase stores user profiles and Hedera account metadata

Directory highlights:

- `src/services/hederaService.js`: client init, create account, token/NFT helpers
- `src/lib/supabase.js`: profile + hedera_accounts CRUD
- `src/HederaAccountSetup.js`: guided flow to create testnet accounts
- `public/game/*.html`: original The House scenes, rethemed as PYP Hub + maps

## Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **React Router 7.9.2** - Client-side routing
- **React Icons 5.5.0** - Icon library
- **CSS3** - Styling and animations

### Blockchain & Web3
- **Hedera SDK 2.75.0** - Hedera Hashgraph integration
- **HashConnect 3.0.13** - HashPack wallet integration
- **Hedera Token Service (HTS)** - Token and NFT creation
- **Hedera Consensus Service (HCS)** - Proof-of-Game logging

### Backend & Database
- **Supabase** - PostgreSQL database and authentication
- **Express.js** - API server (if needed)

### Infrastructure
- **IPFS (Pinata)** - Decentralized storage for NFT metadata and images
- **Hedera Mirror Node API** - Blockchain data queries

### Development Tools
- **Node.js** - Runtime environment
- **npm** - Package management
- **React Scripts** - Build tooling

## Hedera Integrations (Testnet)

- Create Hedera Account (funded with 20 HBAR from operator)
- NFT Collections (create/mint) for badges
- Fungible Token helpers (create/mint/transfer/associate)
- Balance sync via Mirror Node (read-only)

Environment variables (add to `.env`):

```
REACT_APP_HEDERA_OPERATOR_ID=0.0.xxxxxx
REACT_APP_HEDERA_OPERATOR_KEY=302e02...
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
REACT_APP_PINATA_JWT_TOKEN=your-pinata-jwt-token (optional, for IPFS)
```

## Deployed Contracts & Tokens

### Plant Reward Token (Fungible Token)

The PYP Plant Token is used for daily rewards and in-game rewards.

**Token Details:**
- **Name**: PYP Plant Token
- **Symbol**: PYP
- **Type**: Fungible Token (HTS)
- **Decimals**: 0
- **Supply Type**: Infinite
- **Token ID**: `0.0.XXXXXX` *(Update with actual deployed token ID)*
- **HashScan**: [View on HashScan](https://hashscan.io/testnet/token/0.0.XXXXXX) *(Update with actual token ID)*

**Configuration:**
- Used for daily planting rewards
- Mintable by operator account
- Transferred to users as rewards

**To Find Your Token ID:**
1. Check your Supabase `hts_config` table: `SELECT reward_token_id FROM hts_config WHERE id = 1;`
2. Or check the output from `npm run create:plant` script
3. View in HashPack wallet after deployment

---

### Talisman NFT Collections

Talismans are special NFT collectibles that provide in-game perks and bonuses.

#### 1. 🏠 Home Defender (Rare)
- **Collection ID**: `0.0.XXXXXX` *(Update with actual token ID)*
- **Symbol**: HOMEDEF
- **Rarity**: Rare
- **Perk**: +50 defense, 24h cooldown protection
- **HashScan**: [View Collection](https://hashscan.io/testnet/token/0.0.XXXXXX) *(Update with actual token ID)*

#### 2. 🧠 Scholar (Common)
- **Collection ID**: `0.0.XXXXXX` *(Update with actual token ID)*
- **Symbol**: SCHOLAR
- **Rarity**: Common
- **Perk**: +25% XP bonus, 10% course discount
- **HashScan**: [View Collection](https://hashscan.io/testnet/token/0.0.XXXXXX) *(Update with actual token ID)*

#### 3. 🌿 Daily Planter (Epic)
- **Collection ID**: `0.0.XXXXXX` *(Update with actual token ID)*
- **Symbol**: PLANTER
- **Rarity**: Epic
- **Perk**: +2% bonus for 7-day streaks
- **HashScan**: [View Collection](https://hashscan.io/testnet/token/0.0.XXXXXX) *(Update with actual token ID)*

#### 4. 🍀 Lucky Charm (Legendary)
- **Collection ID**: `0.0.XXXXXX` *(Update with actual token ID)*
- **Symbol**: LUCKY
- **Rarity**: Legendary
- **Perk**: +15% drop rate, +1 rarity boost
- **HashScan**: [View Collection](https://hashscan.io/testnet/token/0.0.XXXXXX) *(Update with actual token ID)*

#### 5. ⚡ Speed Demon (Rare)
- **Collection ID**: `0.0.XXXXXX` *(Update with actual token ID)*
- **Symbol**: SPEED
- **Rarity**: Rare
- **Perk**: 30% cooldown reduction, +20 energy
- **HashScan**: [View Collection](https://hashscan.io/testnet/token/0.0.XXXXXX) *(Update with actual token ID)*

#### 6. 👼 Guardian Angel (Epic)
- **Collection ID**: `0.0.XXXXXX` *(Update with actual token ID)*
- **Symbol**: GUARDIAN
- **Rarity**: Epic
- **Perk**: +40% healing, 60min protection
- **HashScan**: [View Collection](https://hashscan.io/testnet/token/0.0.XXXXXX) *(Update with actual token ID)*

### Finding Deployed Token IDs

**Method 1: From Deployment Scripts**
```bash
# Deploy talisman collections and check output
npm run deploy:talismans

# Deploy plant token and check output
npm run create:plant
```

**Method 2: From Supabase Database**
```sql
-- Get Plant Token ID
SELECT reward_token_id FROM hts_config WHERE id = 1;

-- Get Talisman Collection IDs
SELECT perk_type, name, nft_collection_id 
FROM talisman_collections 
ORDER BY perk_type;
```

**Method 3: From HashScan**
1. Visit [HashScan Testnet](https://hashscan.io/testnet)
2. Enter your operator account ID
3. View "Tokens" tab to see all created tokens
4. Click on each token to view details and copy Token ID

### Deployment Commands

```bash
# Deploy Plant Token
npm run create:plant

# Deploy All Talisman Collections
npm run deploy:talismans

# Mint a Talisman to User
npm run mint:talisman COLLECTION_ID USER_ACCOUNT_ID

# Award Talisman for Achievement
npm run award:talisman daily_planter USER_ACCOUNT_ID "7 Day Streak"
```

See [TALISMAN_DEPLOYMENT_GUIDE.md](./TALISMAN_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Supabase Schema

See `supabase-schema.sql`:

- `user_profiles`: id (UUID), email, name, auth_type, wallet_address
- `hedera_accounts`: user_id (UUID), account_id, evm_address, keys, balance
- `user_achievements`: badge/event logs, optional NFT linkage
- `user_governance`: proposal votes and power

Row-Level Security (RLS) policies included for user scoping.

## Getting Started

1) Install dependencies
```
npm install
```

2) Create `.env` from `env.example`, set Hedera + Supabase vars, then restart dev server
```
npm start
```

3) Login
- HashPack: browser extension
- Email/Password: simple local flow that also creates a profile record

4) Create a Hedera account (email users)
- Click Create Hedera Account (top bar) → copy private key safely

5) Play
- Use the overlay to choose Learn/Play/Trade/Govern or Teleport
- Earn badges/tokens (demo flows)

## Roadmap

### Hackathon MVP (25 days)
- [.] Functional House with 3-4 active rooms
- [x] Hedera wallet login + NFT minting for quizzes
- [x] Daily rewards via planting system
- [x] Fish Oracle with AI (basic Q&A + task issuing)
- [x] Simple Proof of Game tracking

### Next Steps (Post-hackathon)
- **World Expansion**:
  - Add Arena for PvP challenges
  - Create Festival Grounds for community events
  - Develop more interactive village spaces
- **Gameplay**:
  - Player invasions & tiered security system
  - Advanced AI features for personalized quests
  - Voice/video chat for community events
- **Economy**:
  - Full NFT marketplace integration
  - Meme token creation tools
  - DeFi features for staking and yield farming

## Why This Matters

- **African Identity**: inspired by cultural symbolism (juju portals, village interactions, communal play)
- **Education + Play**: Learn Web3 and real-world skills through gamified quests
- **Community Economy**: Meme tokens, NFT trading, governance — all user-driven
- **AI x Blockchain**: A fun and practical bridge between intelligence and decentralized ownership

## Vision

Africa is one of the fastest-growing adopters of Web3. Play Your Path reimagines how learning, gaming, and community can blend in a culturally rooted, blockchain-powered environment.

PYP creates a world where every action counts, every player owns their path, and every community thrives together.

## Credits and Licensing

This project is a respectful derivative and re-theme of the open-source game "The House" by Artur Kot.

- The House repository and licenses are included under `public/game/README.*`.
- Original license: MIT (code) and CC BY 3.0 (artwork). See the included notices.

We thank Artur Kot and contributors for making the original work available to the community.

All new PYP application code (React shell, services, and integrations) is provided under MIT unless otherwise noted.

## Security Notes

- Private keys shown in the demo are for testnet only. Never share mainnet keys.
- In production, always encrypt private keys at rest and avoid exposing them to the client.

# DEVELOPMENT OPERATOR KEY
```3030020100300706052b8104000a04220420d3ec05860012e4c43f2672b47d11e2304c166c672c41ab2673c04c3baa1b585b```

## Contact

For hackathon judging and collaboration inquiries, please reach out via the repository issues or the team’s point-of-contact.
