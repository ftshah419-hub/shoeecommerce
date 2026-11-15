const { db } = require('../config/db');

class OtpVerification {
  /**
   * Create a new OTP verification record
   */
  static async createOtp({
    userId = null,
    identifier,
    channel = 'email',
    purpose = 'password_reset',
    otpHash,
    expiryMinutes = 10,
    cooldownSeconds = 60,
    maxAttempts = 5,
  }) {
    const cleanId = String(identifier).trim().toLowerCase();

    // Invalidate prior pending OTPs for the same identifier & purpose
    await OtpVerification.invalidatePending({ identifier: cleanId, purpose });

    const now = Date.now();
    const record = {
      id: `otp_${now}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      identifier: cleanId,
      channel, // 'email' or 'sms'
      purpose, // 'registration', 'password_reset', 'email_verification', 'phone_verification', 'login'
      otpHash,
      attemptsCount: 0,
      maxAttempts,
      resendAvailableAt: new Date(now + cooldownSeconds * 1000).toISOString(),
      expiresAt: new Date(now + expiryMinutes * 60 * 1000).toISOString(),
      verifiedAt: null,
      isUsed: false,
      createdAt: new Date(now).toISOString(),
    };

    db.otp_verifications.push(record);
    return record;
  }

  /**
   * Find the latest valid OTP verification for an identifier & purpose
   */
  static async findLatestActive({ identifier, purpose }) {
    if (!identifier) return null;
    const cleanId = String(identifier).trim().toLowerCase();
    const now = new Date();

    const candidates = db.otp_verifications.filter(
      (o) =>
        o.identifier === cleanId &&
        o.purpose === purpose &&
        !o.isUsed &&
        new Date(o.expiresAt) > now
    );

    if (candidates.length === 0) return null;
    return candidates[candidates.length - 1];
  }

  /**
   * Find by ID
   */
  static async findById(id) {
    return db.otp_verifications.find((o) => o.id === id) || null;
  }

  /**
   * Increment attempt counter
   */
  static async recordAttempt(id) {
    const record = await OtpVerification.findById(id);
    if (!record) return null;
    record.attemptsCount += 1;
    return record;
  }

  /**
   * Mark OTP as successfully verified and used
   */
  static async markUsed(id) {
    const record = await OtpVerification.findById(id);
    if (!record) return false;
    record.isUsed = true;
    record.verifiedAt = new Date().toISOString();
    return true;
  }

  /**
   * Invalidate prior OTPs
   */
  static async invalidatePending({ identifier, purpose }) {
    const cleanId = String(identifier).trim().toLowerCase();
    db.otp_verifications.forEach((o) => {
      if (o.identifier === cleanId && o.purpose === purpose && !o.isUsed) {
        o.isUsed = true;
      }
    });
  }
}

module.exports = OtpVerification;
