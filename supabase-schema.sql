-- Supabase Schema for Play Your Path (PYP)
-- Run this in your Supabase SQL editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  auth_type VARCHAR(50) NOT NULL, -- 'email' or 'hashpack'
  wallet_address VARCHAR(255), -- For HashPack users
  tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, diamond
  xp BIGINT DEFAULT 0, -- experience points toward next tier
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hedera_accounts table
CREATE TABLE IF NOT EXISTS hedera_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  account_id VARCHAR(50) UNIQUE NOT NULL, -- Hedera account ID (0.0.123456)
  evm_address VARCHAR(42) UNIQUE NOT NULL, -- Ethereum-compatible address
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL, -- In production, encrypt this field
  balance DECIMAL(20,8) DEFAULT 0, -- HBAR balance
  last_balance_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track PYP token balances (by tokenId)
CREATE TABLE IF NOT EXISTS user_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  token_id VARCHAR(100) NOT NULL,
  token_symbol VARCHAR(20),
  balance DECIMAL(40,8) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token_id)
);

-- Daily points (earnable at flower vase)
CREATE TABLE IF NOT EXISTS user_daily_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  points BIGINT DEFAULT 0,
  last_claimed_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table for NFT badges and rewards
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL, -- 'quiz_completed', 'game_won', 'governance_vote', etc.
  achievement_data JSONB, -- Flexible data storage
  nft_token_id VARCHAR(100), -- If minted as NFT
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_governance table for voting records
CREATE TABLE IF NOT EXISTS user_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  proposal_id VARCHAR(100) NOT NULL,
  vote_choice VARCHAR(50) NOT NULL, -- 'yes', 'no', 'abstain'
  voting_power DECIMAL(20,8) DEFAULT 0, -- Governance tokens used
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends (symmetric opt-in)
CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Direct messages
CREATE TABLE IF NOT EXISTS user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_hedera_accounts_user_id ON hedera_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_hedera_accounts_account_id ON hedera_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_user_token_balances_user ON user_token_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_req ON user_friends(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_add ON user_friends(addressee_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient ON user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_governance_user_id ON user_governance(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hedera_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_governance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own hedera accounts" ON hedera_accounts
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own hedera accounts" ON hedera_accounts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own hedera accounts" ON hedera_accounts
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own token balances" ON user_token_balances
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can upsert own token balances" ON user_token_balances
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own token balances" ON user_token_balances
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own daily points" ON user_daily_points
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can upsert own daily points" ON user_daily_points
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own daily points" ON user_daily_points
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own governance votes" ON user_governance
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own governance votes" ON user_governance
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Friends are visible to the two participants
CREATE POLICY "Users can view friends they are part of" ON user_friends
  FOR SELECT USING (auth.uid()::text = requester_id::text OR auth.uid()::text = addressee_id::text);

CREATE POLICY "Users can insert friend requests" ON user_friends
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id::text);

CREATE POLICY "Users can update own friend edges" ON user_friends
  FOR UPDATE USING (auth.uid()::text = requester_id::text OR auth.uid()::text = addressee_id::text);

-- Messages visible to sender or recipient
CREATE POLICY "Users can view own messages" ON user_messages
  FOR SELECT USING (auth.uid()::text = sender_id::text OR auth.uid()::text = recipient_id::text);

CREATE POLICY "Users can send messages" ON user_messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hedera_accounts_updated_at BEFORE UPDATE ON hedera_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- Summons & Quests
-- =====================

-- Summons: invite/teleport/invasion
CREATE TABLE IF NOT EXISTS summons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  kind VARCHAR(20) NOT NULL DEFAULT 'summon', -- summon | invade
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- open | accepted | expired | cancelled
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quest definitions
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., FISH_DAILY_1
  title TEXT NOT NULL,
  description TEXT,
  reward_points INT DEFAULT 10,
  reward_token_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User quests (assignment)
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, quest_id)
);

-- Quest progress (optional granular steps)
CREATE TABLE IF NOT EXISTS quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  step_code TEXT,
  progress JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summons_owner ON summons(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_user ON quest_progress(user_id);

ALTER TABLE summons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;

-- RLS: allow public read for quests; user-scoped for others (hackathon-friendly)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='summons' AND policyname='summons_read_own'
  ) THEN
    CREATE POLICY "summons_read_own" ON summons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='summons' AND policyname='summons_insert_any'
  ) THEN
    CREATE POLICY "summons_insert_any" ON summons FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quests' AND policyname='quests_public_read'
  ) THEN
    CREATE POLICY "quests_public_read" ON quests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quests' AND policyname='quests_insert_any'
  ) THEN
    CREATE POLICY "quests_insert_any" ON quests FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_quests' AND policyname='user_quests_read_any'
  ) THEN
    CREATE POLICY "user_quests_read_any" ON user_quests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_quests' AND policyname='user_quests_insert_any'
  ) THEN
    CREATE POLICY "user_quests_insert_any" ON user_quests FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quest_progress' AND policyname='quest_progress_read_any'
  ) THEN
    CREATE POLICY "quest_progress_read_any" ON quest_progress FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='quest_progress' AND policyname='quest_progress_insert_any'
  ) THEN
    CREATE POLICY "quest_progress_insert_any" ON quest_progress FOR INSERT WITH CHECK (true);
  END IF;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_token_balances_updated_at BEFORE UPDATE ON user_token_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_friends_updated_at BEFORE UPDATE ON user_friends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();