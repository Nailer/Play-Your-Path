-- Fix RLS policies for hedera_accounts table
-- Run this in your Supabase SQL editor to allow the app to save Hedera accounts

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own hedera accounts" ON hedera_accounts;
DROP POLICY IF EXISTS "Users can insert own hedera accounts" ON hedera_accounts;
DROP POLICY IF EXISTS "Users can update own hedera accounts" ON hedera_accounts;

-- Create more permissive policies for development
-- These allow any authenticated user to insert/update hedera accounts
-- In production, you should make these more restrictive

CREATE POLICY "Allow insert hedera accounts" ON hedera_accounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select hedera accounts" ON hedera_accounts
  FOR SELECT USING (true);

CREATE POLICY "Allow update hedera accounts" ON hedera_accounts
  FOR UPDATE USING (true);

-- Alternative: If you want to disable RLS entirely for hedera_accounts (less secure but simpler for development)
-- ALTER TABLE hedera_accounts DISABLE ROW LEVEL SECURITY;
