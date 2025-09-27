import { hederaService } from './hederaService';
import { getDailyPoints, updateDailyPoints, upsertTokenBalance } from '../lib/supabase';

// Claim daily points (flower vase). Optionally mint fungible reward and update balances.
export async function claimDailyReward({ userProfileId, hederaAccountId }) {
  // Load current points
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const pointsRow = await getDailyPoints(userProfileId);

  if (pointsRow.last_claimed_date === todayStr) {
    return { ok: false, message: 'Already claimed today' };
  }

  // Add points
  const newPoints = Number(pointsRow.points || 0) + 10; // base daily 10
  const updated = await updateDailyPoints(userProfileId, { points: newPoints, last_claimed_date: todayStr });

  // Optional: also grant fungible tokens if reward token configured
  if (hederaService.rewardTokenId && hederaAccountId) {
    try {
      // Ensure association was done elsewhere
      await hederaService.transferToken({
        tokenId: hederaService.rewardTokenId,
        amount: 1000, // eg. 0.00001000 if 8 decimals
        toAccountId: hederaAccountId
      });

      // Update local balance cache
      await upsertTokenBalance({
        userId: userProfileId,
        tokenId: hederaService.rewardTokenId,
        tokenSymbol: 'PYPR',
        balance: Number((updated.points || newPoints)) // demo linkage
      });
    } catch (e) {
      // Non-fatal
      console.warn('Token reward transfer failed', e);
    }
  }

  return { ok: true, points: newPoints };
}



