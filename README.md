# Play Your Path (PYP) 🌍

Players play to progress as they learn about Hedera and earn points
🏆 Hackathon Track: Gaming and NFTs

PYP is more than a game — it's a proof-of-game platform, tracking user activities, rewarding progress with NFTs & tokens, and building a blockchain reputation.

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
```

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

## Contact

For hackathon judging and collaboration inquiries, please reach out via the repository issues or the team’s point-of-contact.
