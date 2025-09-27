import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema helpers
export const createUserProfile = async (userData) => {
  // Only send columns that exist; let DB generate UUID id
  const insertData = {
    email: userData.email,
    name: userData.name,
    auth_type: userData.auth_type,
    wallet_address: userData.wallet_address,
  };

  // Upsert on email so repeated logins don't error
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(insertData, { onConflict: 'email' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserProfile = async (profileId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      hedera_accounts (*)
    `)
    .eq('id', profileId)
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

// Token balances
export const upsertTokenBalance = async ({ userId, tokenId, tokenSymbol, balance }) => {
  const { data, error } = await supabase
    .from('user_token_balances')
    .upsert({ user_id: userId, token_id: tokenId, token_symbol: tokenSymbol, balance })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getTokenBalances = async (userId) => {
  const { data, error } = await supabase
    .from('user_token_balances')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};

// Daily points
export const getDailyPoints = async (userId) => {
  const { data, error } = await supabase
    .from('user_daily_points')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { user_id: userId, points: 0, last_claimed_date: null };
};

export const updateDailyPoints = async (userId, { points, last_claimed_date }) => {
  const { data, error } = await supabase
    .from('user_daily_points')
    .upsert({ user_id: userId, points, last_claimed_date })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Friends
export const sendFriendRequest = async ({ requesterId, addresseeEmail }) => {
  // Find addressee by email
  const { data: user, error: uerr } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', addresseeEmail)
    .single();
  if (uerr) throw uerr;

  const { data, error } = await supabase
    .from('user_friends')
    .upsert({ requester_id: requesterId, addressee_id: user.id, status: 'pending' }, { onConflict: 'requester_id,addressee_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const respondFriendRequest = async ({ requesterId, addresseeId, accept }) => {
  const { data, error } = await supabase
    .from('user_friends')
    .update({ status: accept ? 'accepted' : 'blocked' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const listFriends = async (userId) => {
  const { data, error } = await supabase
    .from('user_friends')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');
  if (error) throw error;
  return data || [];
};

// Messages
export const sendMessage = async ({ senderId, recipientId, content }) => {
  const { data, error } = await supabase
    .from('user_messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, content })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchInbox = async (userId) => {
  const { data, error } = await supabase
    .from('user_messages')
    .select('*')
    .eq('recipient_id', userId)
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return (data || []);
};

// Summons
export const createSummon = async ({ ownerId, targetId, kind = 'summon', ttlMinutes = 15 }) => {
  const invite = Math.random().toString(36).slice(2, 10);
  const expires = new Date(Date.now() + ttlMinutes * 60000).toISOString();
  const { data, error } = await supabase
    .from('summons')
    .insert({ invite_code: invite, owner_id: ownerId, target_id: targetId || null, kind, expires_at: expires })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getSummonByCode = async (code) => {
  const { data, error } = await supabase
    .from('summons')
    .select('*')
    .eq('invite_code', code)
    .single();
  if (error) throw error;
  return data;
};

export const acceptSummon = async (code) => {
  const { data, error } = await supabase
    .from('summons')
    .update({ status: 'accepted' })
    .eq('invite_code', code)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Quests
export const assignQuest = async ({ userId, questCode }) => {
  const { data: quest, error: qErr } = await supabase
    .from('quests')
    .select('id')
    .eq('code', questCode)
    .single();
  if (qErr) throw qErr;
  const { data, error } = await supabase
    .from('user_quests')
    .upsert({ user_id: userId, quest_id: quest.id })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const completeQuest = async ({ userId, questCode }) => {
  const { data: quest, error: qErr } = await supabase
    .from('quests')
    .select('id, reward_points')
    .eq('code', questCode)
    .single();
  if (qErr) throw qErr;
  const { data, error } = await supabase
    .from('user_quests')
    .update({ completed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('quest_id', quest.id)
    .select()
    .single();
  if (error) throw error;
  return { ...data, reward_points: quest.reward_points };
};
export const createHederaAccount = async (userProfileId, hederaData) => {
  const { data, error } = await supabase
    .from('hedera_accounts')
    .insert([{
      user_id: userProfileId,
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

