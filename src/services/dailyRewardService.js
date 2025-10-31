import { hederaService } from './hederaService';
import { getDailyPoints, updateDailyPoints, upsertTokenBalance, getHtsConfig, getUserHederaAccount } from '../lib/supabase';
import TalismanService from './talismanService';

// Claim daily points (flower vase). Optionally mint fungible reward and update balances.
export async function claimDailyReward({ userProfileId, hederaAccountId }) {
  // Load current points
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const pointsRow = await getDailyPoints(userProfileId);

  // Unlimited claims for testing: skip one-claim-per-day restriction

  // Add points with talisman bonus
  const basePoints = 10;
  const talismanBonus = await TalismanService.applyDailyPlanterPerk(userProfileId, basePoints);
  const newPoints = Number(pointsRow.points || 0) + talismanBonus.points;
  const updated = await updateDailyPoints(userProfileId, { points: newPoints, last_claimed_date: todayStr });

  // Optional: also grant fungible tokens via HTS if configured in Supabase
  const hts = await getHtsConfig();
  console.log('HTS Config:', hts);
  console.log('Hedera Account ID:', hederaAccountId);
  
  if (hts && hts.reward_token_id && hts.treasury_account_id && hederaAccountId) {
    try {
      const amount = Number(hts.daily_amount || 1000);
      const canMint = Boolean(hts.use_supply_on_claim && hts.supply_private_key);
      const canTransfer = Boolean(hts.treasury_private_key);
      
      console.log('Token minting/transfer config:', {
        amount,
        canMint,
        canTransfer,
        use_supply_on_claim: hts.use_supply_on_claim,
        has_supply_key: !!hts.supply_private_key,
        has_treasury_key: !!hts.treasury_private_key
      });

      // Best-effort auto-associate on first claim using stored user key (dev/hackathon convenience)
      try {
        const userHedera = await getUserHederaAccount(userProfileId);
        if (userHedera?.account_id && userHedera?.private_key) {
          await hederaService.associateToken({
            accountId: userHedera.account_id,
            accountPrivateKey: userHedera.private_key,
            tokenId: hts.reward_token_id
          });
        }
      } catch (e) {
        // ignore if already associated or fails; transfer may still succeed
        console.warn('Auto-association skipped/failed', e?.message || e);
      }

      if (canMint) {
        await hederaService.mintFungible({ tokenId: hts.reward_token_id, amount, supplyPrivateKey: hts.supply_private_key });
      }

      if (canTransfer) {
        try {
          await hederaService.transferToken({
            tokenId: hts.reward_token_id,
            amount,
            fromAccountId: hts.treasury_account_id,
            fromPrivateKey: hts.treasury_private_key,
            toAccountId: hederaAccountId
          });
        } catch (err) {
          const msg = String(err?.message || err || '');
          const insufficient = msg.includes('INSUFFICIENT_TOKEN_BALANCE');
          if (insufficient && hts.supply_private_key) {
            // Mint, then retry once
            try {
              await hederaService.mintFungible({ tokenId: hts.reward_token_id, amount, supplyPrivateKey: hts.supply_private_key });
              await hederaService.transferToken({
                tokenId: hts.reward_token_id,
                amount,
                fromAccountId: hts.treasury_account_id,
                fromPrivateKey: hts.treasury_private_key,
                toAccountId: hederaAccountId
              });
            } catch (e2) {
              console.warn('Retry transfer after mint failed', e2);
              throw err; // propagate original
            }
          } else {
            throw err;
          }
        }

        // Update local balance cache
        await upsertTokenBalance({
          userId: userProfileId,
          tokenId: hts.reward_token_id,
          tokenSymbol: hts.token_symbol || 'PLANT',
          balance: Number(newPoints)
        });
      } else {
        console.warn('HTS transfer skipped: missing treasury_private_key in hts_config');
      }
    } catch (e) {
      // Non-fatal to the points award path
      console.warn('Token reward mint/transfer failed', e);
    }
  }

  return { 
    ok: true, 
    points: newPoints,
    basePoints: basePoints,
    bonus: talismanBonus.bonus,
    bonusMessage: talismanBonus.message
  };
}



