const { db } = require('../config/db');

class PasswordReset {
  /**
   * Create a password reset ticket
   */
  static async createRequest({ userId, identifier, resetToken, otpId = null, expiryMinutes = 15 }) {
    const cleanId = String(identifier).trim().toLowerCase();
    const now = Date.now();

    // Invalidate prior unused reset tickets for this user
    db.password_resets.forEach((p) => {
      if (p.identifier === cleanId && !p.usedAt) {
        p.usedAt = new Date().toISOString();
      }
    });

    const record = {
      id: `pwd_rst_${now}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      identifier: cleanId,
      resetToken,
      otpId,
      expiresAt: new Date(now + expiryMinutes * 60 * 1000).toISOString(),
      usedAt: null,
      createdAt: new Date(now).toISOString(),
    };

    db.password_resets.push(record);
    return record;
  }

  /**
   * Find a valid, unexpired, unused reset token
   */
  static async findValidByToken(resetToken) {
    if (!resetToken) return null;
    const now = new Date();
    return (
      db.password_resets.find(
        (p) => p.resetToken === resetToken && !p.usedAt && new Date(p.expiresAt) > now
      ) || null
    );
  }

  /**
   * Mark token as used
   */
  static async markUsed(resetToken) {
    const record = await PasswordReset.findValidByToken(resetToken);
    if (!record) return false;
    record.usedAt = new Date().toISOString();
    return true;
  }
}

module.exports = PasswordReset;
