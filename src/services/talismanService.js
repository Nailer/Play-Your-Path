import { 
  getActiveTalisman, 
  logTalismanPerkUsage,
  getUserTalismans,
  getTalismanCollections 
} from '../lib/supabase';

// Talisman perk system
export class TalismanService {
  
  // Get active talisman for a user
  static async getActiveTalisman(userId) {
    return await getActiveTalisman(userId);
  }

  // Check if user has a specific talisman type
  static async hasTalismanType(userId, perkType) {
    const talismans = await getUserTalismans(userId);
    return talismans.some(t => t.talisman_collections.perk_type === perkType);
  }

  // Apply daily planter perk (bonus points for streaks)
  static async applyDailyPlanterPerk(userId, basePoints) {
    const activeTalisman = await this.getActiveTalisman(userId);
    
    if (!activeTalisman || activeTalisman.talisman_collections.perk_type !== 'daily_planter') {
      return { points: basePoints, bonus: 0, message: '' };
    }

    const config = activeTalisman.talisman_collections.perk_config;
    const streakBonus = config.streak_bonus || 2;
    const requiredStreak = config.required_streak || 7;
    
    // Check if user has the required streak (simplified - you'd check actual streak data)
    const hasStreak = true; // TODO: Implement actual streak checking
    
    if (hasStreak) {
      const bonusPoints = Math.floor(basePoints * (streakBonus / 100));
      const totalPoints = basePoints + bonusPoints;
      
      // Log perk usage
      await logTalismanPerkUsage({
        userId,
        talismanId: activeTalisman.id,
        perkType: 'daily_planter',
        usageData: { basePoints, bonusPoints, totalPoints }
      });

      return {
        points: totalPoints,
        bonus: bonusPoints,
        message: `🌿 Daily Planter bonus: +${bonusPoints} points!`
      };
    }

    return { points: basePoints, bonus: 0, message: '' };
  }

  // Apply scholar perk (XP bonus)
  static async applyScholarPerk(userId, baseXP) {
    const activeTalisman = await this.getActiveTalisman(userId);
    
    if (!activeTalisman || activeTalisman.talisman_collections.perk_type !== 'scholar') {
      return { xp: baseXP, bonus: 0, message: '' };
    }

    const config = activeTalisman.talisman_collections.perk_config;
    const xpBonus = config.xp_bonus || 25;
    const bonusXP = Math.floor(baseXP * (xpBonus / 100));
    const totalXP = baseXP + bonusXP;

    // Log perk usage
    await logTalismanPerkUsage({
      userId,
      talismanId: activeTalisman.id,
      perkType: 'scholar',
      usageData: { baseXP, bonusXP, totalXP }
    });

    return {
      xp: totalXP,
      bonus: bonusXP,
      message: `🧠 Scholar bonus: +${bonusXP} XP!`
    };
  }

  // Apply lucky charm perk (drop rate bonus)
  static async applyLuckyCharmPerk(userId, baseDropRate) {
    const activeTalisman = await this.getActiveTalisman(userId);
    
    if (!activeTalisman || activeTalisman.talisman_collections.perk_type !== 'lucky_charm') {
      return { dropRate: baseDropRate, bonus: 0, message: '' };
    }

    const config = activeTalisman.talisman_collections.perk_config;
    const dropRateBonus = config.drop_rate_bonus || 0.15;
    const bonusDropRate = baseDropRate * dropRateBonus;
    const totalDropRate = Math.min(baseDropRate + bonusDropRate, 1.0); // Cap at 100%

    // Log perk usage
    await logTalismanPerkUsage({
      userId,
      talismanId: activeTalisman.id,
      perkType: 'lucky_charm',
      usageData: { baseDropRate, bonusDropRate, totalDropRate }
    });

    return {
      dropRate: totalDropRate,
      bonus: bonusDropRate,
      message: `🍀 Lucky Charm: +${Math.round(bonusDropRate * 100)}% drop rate!`
    };
  }

  // Apply speed demon perk (cooldown reduction)
  static async applySpeedDemonPerk(userId, baseCooldownMs) {
    const activeTalisman = await this.getActiveTalisman(userId);
    
    if (!activeTalisman || activeTalisman.talisman_collections.perk_type !== 'speed_demon') {
      return { cooldownMs: baseCooldownMs, reduction: 0, message: '' };
    }

    const config = activeTalisman.talisman_collections.perk_config;
    const cooldownReduction = config.cooldown_reduction || 0.3;
    const reductionMs = Math.floor(baseCooldownMs * cooldownReduction);
    const newCooldownMs = Math.max(baseCooldownMs - reductionMs, 0);

    // Log perk usage
    await logTalismanPerkUsage({
      userId,
      talismanId: activeTalisman.id,
      perkType: 'speed_demon',
      usageData: { baseCooldownMs, reductionMs, newCooldownMs }
    });

    return {
      cooldownMs: newCooldownMs,
      reduction: reductionMs,
      message: `⚡ Speed Demon: ${Math.round(reductionMs / 1000)}s cooldown reduction!`
    };
  }

  // Apply home defender perk (defense bonus)
  static async applyHomeDefenderPerk(userId, baseDefense) {
    const activeTalisman = await this.getActiveTalisman(userId);
    
    if (!activeTalisman || activeTalisman.talisman_collections.perk_type !== 'home_defense') {
      return { defense: baseDefense, bonus: 0, message: '' };
    }

    const config = activeTalisman.talisman_collections.perk_config;
    const defenseBonus = config.defense_bonus || 50;
    const totalDefense = baseDefense + defenseBonus;

    // Log perk usage
    await logTalismanPerkUsage({
      userId,
      talismanId: activeTalisman.id,
      perkType: 'home_defense',
      usageData: { baseDefense, defenseBonus, totalDefense }
    });

    return {
      defense: totalDefense,
      bonus: defenseBonus,
      message: `🏠 Home Defender: +${defenseBonus} defense!`
    };
  }

  // Apply guardian angel perk (healing bonus)
  static async applyGuardianAngelPerk(userId, baseHealing) {
    const activeTalisman = await this.getActiveTalisman(userId);
    
    if (!activeTalisman || activeTalisman.talisman_collections.perk_type !== 'guardian_angel') {
      return { healing: baseHealing, bonus: 0, message: '' };
    }

    const config = activeTalisman.talisman_collections.perk_config;
    const healingBonus = config.healing_bonus || 40;
    const bonusHealing = Math.floor(baseHealing * (healingBonus / 100));
    const totalHealing = baseHealing + bonusHealing;

    // Log perk usage
    await logTalismanPerkUsage({
      userId,
      talismanId: activeTalisman.id,
      perkType: 'guardian_angel',
      usageData: { baseHealing, bonusHealing, totalHealing }
    });

    return {
      healing: totalHealing,
      bonus: bonusHealing,
      message: `👼 Guardian Angel: +${bonusHealing} healing!`
    };
  }

  // Get all available talisman collections
  static async getAvailableCollections() {
    return await getTalismanCollections();
  }

  // Get user's talisman collection
  static async getUserCollection(userId) {
    return await getUserTalismans(userId);
  }
}

export default TalismanService;

