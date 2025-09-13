-- Supabase Schema for Play Your Path (PYP)
-- Run this in your Supabase SQL editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  auth_type VARCHAR(50) NOT NULL, -- 'email' or 'hashpack'
  wallet_address VARCHAR(255), -- For HashPack users
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_hedera_accounts_user_id ON hedera_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_hedera_accounts_account_id ON hedera_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_governance_user_id ON user_governance(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hedera_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_governance ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own governance votes" ON user_governance
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own governance votes" ON user_governance
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

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