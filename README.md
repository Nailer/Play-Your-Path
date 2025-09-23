# Play Your Path (PYP)

Play Your Path (PYP) is an African-inspired, social, play-to-earn world built on Hedera. Players start in the PYP Hub (a house-inspired home base), move between themed rooms and outdoor maps, complete courses and challenges, earn NFT badges and tokens, and participate in community governance.

Built for the Hedera Hackathon across these tracks:

- Play-to-Earn Gaming: Complete quizzes and mini-games to earn tokens and NFT badges
- African Metaverse Worlds: Explore culturally-inspired rooms, villages, festivals, and arenas
- Digital Collectibles & NFTs: Collect, trade, and showcase African art and cultural badges
- Gamified Community Governance: Vote in the Council Room; create meme coins and reward systems

## Demo Summary

- PYP Hub (home) loads inside the app and acts as the starting point
- Mode overlay: Learn, Play, Trade, Govern, Teleport
- External areas: Village Square, Festival Grounds, Arena (with return portals)
- Wallet and Simple Auth: HashPack login or email/password
- Hedera actions: Create account, mint NFT badge (stub UI + live SDK), token services
- Supabase: Profiles + Hedera account storage, balance refresh

## Core Features

- Learn (Study Room): Quizzes/courses award NFT badges (Hedera NFTs)
- Play (Challenge Room): Puzzles and mini-games with token rewards
- Trade (Marketplace Room): NFTs/collectibles, art drops, future market integrations
- Govern (Council Room): Token-based proposals and voting UX
- Teleport (Juju Portal): Move from PYP Hub to external maps (Village, Festival, Arena)

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

## Roadmap (Post-hackathon)

- Replace stubs with full backend flows for quizzes/games and on-chain badge mints
- Persist token/NFT collections in Supabase for each community/guild
- Friend invites to PYP Hub (multi-user session syncing)
- “Consult the fish” AI guide: in-game assistant for quests and lore
- Meme coin creation and liquidity sandbox; “kolo” savings and staking flows

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
