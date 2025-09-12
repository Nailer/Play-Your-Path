import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema helpers
export const createUserProfile = async (userData) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([userData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      hedera_accounts (*)
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createHederaAccount = async (userId, hederaData) => {
  const { data, error } = await supabase
    .from('hedera_accounts')
    .insert([{
      user_id: userId,
      account_id: hederaData.accountId,
      evm_address: hederaData.evmAddress,
      public_key: hederaData.publicKey,
      private_key: hederaData.privateKey, // Note: In production, encrypt this
      balance: hederaData.balance,
      created_at: hederaData.created
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateHederaBalance = async (accountId, newBalance) => {
  const { data, error } = await supabase
    .from('hedera_accounts')
    .update({ 
      balance: newBalance,
      last_balance_check: new Date().toISOString()
    })
    .eq('account_id', accountId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserHederaAccount = async (userId) => {
  const { data, error } = await supabase
    .from('hedera_accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data;
};

