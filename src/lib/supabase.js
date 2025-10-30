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
    .upsert(
      { user_id: userId, token_id: tokenId, token_symbol: tokenSymbol, balance },
      { 
        onConflict: 'user_id,token_id',
        ignoreDuplicates: false
      }
    )
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
  if (error && error.code !== 'PGRST116' && error.status !== 406) throw error;
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
  console.log('Attempting to create Hedera account with data:', {
    userProfileId,
    hederaData: {
      accountId: hederaData.accountId,
      evmAddress: hederaData.evmAddress,
      balance: hederaData.balance,
      created: hederaData.created
    }
  });

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

  if (error) {
    console.error('Supabase error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
      statusText: error.statusText
    });
    throw error;
  }
  
  console.log('Successfully created Hedera account:', data);
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

// =====================
// Talisman System
// =====================
export const getTalismanCollections = async () => {
  const { data, error } = await supabase
    .from('talisman_collections')
    .select('*')
    .order('rarity', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getUserTalismans = async (userId) => {
  const { data, error } = await supabase
    .from('user_talismans')
    .select(`
      *,
      talisman_collections (
        name,
        description,
        emoji,
        perk_type,
        perk_config,
        rarity
      )
    `)
    .eq('user_id', userId)
    .order('minted_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getActiveTalisman = async (userId) => {
  const { data, error } = await supabase
    .from('user_talismans')
    .select(`
      *,
      talisman_collections (
        name,
        description,
        emoji,
        perk_type,
        perk_config,
        rarity
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

export const mintTalisman = async ({ userId, collectionId, nftSerialNumber }) => {
  const { data, error } = await supabase
    .from('user_talismans')
    .insert({
      user_id: userId,
      collection_id: collectionId,
      nft_serial_number: nftSerialNumber
    })
    .select(`
      *,
      talisman_collections (
        name,
        description,
        emoji,
        perk_type,
        perk_config,
        rarity
      )
    `)
    .single();
  if (error) throw error;
  return data;
};

export const activateTalisman = async ({ userId, talismanId }) => {
  // First deactivate all other talismans for this user
  await supabase
    .from('user_talismans')
    .update({ is_active: false })
    .eq('user_id', userId);

  // Then activate the selected talisman
  const { data, error } = await supabase
    .from('user_talismans')
    .update({ 
      is_active: true,
      activated_at: new Date().toISOString()
    })
    .eq('id', talismanId)
    .eq('user_id', userId)
    .select(`
      *,
      talisman_collections (
        name,
        description,
        emoji,
        perk_type,
        perk_config,
        rarity
      )
    `)
    .single();
  if (error) throw error;

  // Log activation
  await supabase
    .from('talisman_activations')
    .insert({
      user_id: userId,
      talisman_id: talismanId
    });

  return data;
};

export const deactivateTalisman = async ({ userId, talismanId }) => {
  const { data, error } = await supabase
    .from('user_talismans')
    .update({ is_active: false })
    .eq('id', talismanId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;

  // Log deactivation
  await supabase
    .from('talisman_activations')
    .update({ deactivated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('talisman_id', talismanId)
    .is('deactivated_at', null);

  return data;
};

export const logTalismanPerkUsage = async ({ userId, talismanId, perkType, usageData = {} }) => {
  const { data, error } = await supabase
    .from('talisman_perk_usage')
    .insert({
      user_id: userId,
      talisman_id: talismanId,
      perk_type: perkType,
      usage_data: usageData
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// =====================
// HTS Treasury & Token Config
// =====================
export const getHtsConfig = async () => {
  const { data, error } = await supabase
    .from('hts_config')
    .select('*')
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

export const upsertHtsConfig = async ({
  reward_token_id,
  token_symbol,
  decimals,
  daily_amount,
  use_supply_on_claim,
  treasury_account_id,
  treasury_private_key,
  supply_private_key
}) => {
  const { data, error } = await supabase
    .from('hts_config')
    .upsert({
      id: 1,
      reward_token_id,
      token_symbol,
      decimals,
      daily_amount,
      use_supply_on_claim,
      treasury_account_id,
      treasury_private_key,
      supply_private_key
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

