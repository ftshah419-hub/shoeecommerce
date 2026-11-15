const { db } = require('../config/db');

class EmailVerification {
  static async createVerification({ userId, email, token, otpCode = null, expiryMinutes = 60 * 24 }) {
    const cleanEmail = String(email).trim().toLowerCase();
    const now = Date.now();

    const record = {
      id: `ev_${now}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      email: cleanEmail,
      token,
      otpCode,
      isUsed: false,
      expiresAt: new Date(now + expiryMinutes * 60 * 1000).toISOString(),
      verifiedAt: null,
      createdAt: new Date(now).toISOString(),
    };

    db.email_verifications.push(record);
    return record;
  }

  static async findValidByToken(token) {
    if (!token) return null;
    const now = new Date();
    return db.email_verifications.find(
      (e) => e.token === token && !e.isUsed && new Date(e.expiresAt) > now
    ) || null;
  }

  static async markUsed(token) {
    const record = await EmailVerification.findValidByToken(token);
    if (!record) return false;
    record.isUsed = true;
    record.verifiedAt = new Date().toISOString();
    return true;
  }
}

module.exports = EmailVerification;
