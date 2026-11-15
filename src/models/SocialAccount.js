const { db } = require('../config/db');

class SocialAccount {
  static async findByProvider(provider, providerUserId) {
    if (!provider || !providerUserId) return null;
    return (
      db.social_accounts.find(
        (s) =>
          s.provider.toLowerCase() === provider.toLowerCase() &&
          s.providerUserId === String(providerUserId)
      ) || null
    );
  }

  static async findByUserId(userId) {
    if (!userId) return [];
    return db.social_accounts.filter((s) => s.userId === userId);
  }

  static async linkAccount({ userId, provider, providerUserId, profileData = {} }) {
    const existing = await SocialAccount.findByProvider(provider, providerUserId);
    if (existing) {
      existing.userId = userId;
      existing.profileData = profileData;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newAccount = {
      id: `soc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      provider: provider.toLowerCase(),
      providerUserId: String(providerUserId),
      profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.social_accounts.push(newAccount);
    return newAccount;
  }
}

module.exports = SocialAccount;
