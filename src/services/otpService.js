const OtpVerification = require('../models/OtpVerification');
const SecurityUtils = require('../utils/security');
const notificationService = require('../utils/notificationService');

class OtpService {
  /**
   * Request / Generate a new OTP and send it via email or SMS
   */
  async requestOtp({ identifier, purpose = 'password_reset', channel = 'email', userId = null }) {
    if (!identifier) {
      throw new Error('Email or mobile number is required.');
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Check rate limit on OTP generation requests (per identifier)
    const rateCheck = SecurityUtils.checkRateLimit(`otp_req_${cleanIdentifier}`, {
      maxRequests: 3,
      windowSeconds: 60,
    });
    if (!rateCheck.allowed) {
      throw new Error(`Too many OTP requests. Please wait ${rateCheck.retryAfterSeconds} seconds.`);
    }

    // Check resend cooldown from existing active OTP
    const existing = await OtpVerification.findLatestActive({
      identifier: cleanIdentifier,
      purpose,
    });

    if (existing && new Date(existing.resendAvailableAt) > new Date()) {
      const waitSeconds = Math.ceil((new Date(existing.resendAvailableAt) - new Date()) / 1000);
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    // Generate secure 6-digit OTP
    const plainOtp = SecurityUtils.generateOtp(6);
    const otpHash = SecurityUtils.hashOtp(plainOtp);

    // Save in database
    const otpRecord = await OtpVerification.createOtp({
      userId,
      identifier: cleanIdentifier,
      channel,
      purpose,
      otpHash,
      expiryMinutes: 10,
      cooldownSeconds: 60,
      maxAttempts: 5,
    });

    // Dispatch OTP through the requested channel
    if (channel === 'sms' || (!cleanIdentifier.includes('@') && SecurityUtils.validatePhone(cleanIdentifier))) {
      await notificationService.sendSms({
        to: cleanIdentifier,
        message: `Your NELEERI Sneakers verification code is: ${plainOtp}. Valid for 10 minutes.`,
        otp: plainOtp,
      });
    } else {
      await notificationService.sendEmail({
        to: cleanIdentifier,
        subject: `Your NELEERI Sneakers Verification Code: ${plainOtp}`,
        html: `
          <div style="font-family: sans-serif; background-color: #0f1115; color: #f3f4f6; padding: 24px; border-radius: 8px;">
            <h2 style="color: #ff4d00; margin-bottom: 8px;">👟 NELEERI SNEAKERS</h2>
            <p>You requested a verification code for: <strong>${purpose.replace('_', ' ').toUpperCase()}</strong></p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #171a21; padding: 16px; border-radius: 6px; display: inline-block; margin: 16px 0;">
              ${plainOtp}
            </div>
            <p style="color: #9ca3af; font-size: 14px;">This code is valid for 10 minutes. Never share this code with anyone.</p>
          </div>
        `,
        otp: plainOtp,
      });
    }

    return {
      otpId: otpRecord.id,
      identifier: cleanIdentifier,
      channel,
      expiresAt: otpRecord.expiresAt,
      resendAvailableAt: otpRecord.resendAvailableAt,
      // Only expose plainOtp in dev mode if explicitly needed for tests/debugging
      devOtp: process.env.NODE_ENV === 'development' ? plainOtp : undefined,
    };
  }

  /**
   * Verify a submitted OTP code
   */
  async verifyOtp({ identifier, purpose, otpCode }) {
    if (!identifier || !otpCode) {
      throw new Error('Identifier and OTP code are required.');
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanOtp = String(otpCode).trim();

    // Check rate limit on OTP verification attempts
    const rateCheck = SecurityUtils.checkRateLimit(`otp_ver_${cleanIdentifier}`, {
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rateCheck.allowed) {
      throw new Error(`Too many verification attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.`);
    }

    const activeOtp = await OtpVerification.findLatestActive({
      identifier: cleanIdentifier,
      purpose,
    });

    if (!activeOtp) {
      throw new Error('No active verification code found or code has expired. Please request a new one.');
    }

    if (activeOtp.isUsed) {
      throw new Error('This verification code has already been used.');
    }

    if (new Date(activeOtp.expiresAt) <= new Date()) {
      throw new Error('Verification code has expired. Please request a new one.');
    }

    if (activeOtp.attemptsCount >= activeOtp.maxAttempts) {
      throw new Error('Maximum verification attempts reached. Please request a new verification code.');
    }

    // Verify OTP using timing-safe hash comparison
    const isMatch = SecurityUtils.verifyOtpHash(cleanOtp, activeOtp.otpHash);

    if (!isMatch) {
      await OtpVerification.recordAttempt(activeOtp.id);
      const remaining = activeOtp.maxAttempts - activeOtp.attemptsCount;
      if (remaining <= 0) {
        throw new Error('Invalid verification code. Maximum attempts reached. Please request a new code.');
      }
      throw new Error(`Invalid verification code. ${remaining} attempts remaining.`);
    }

    // Mark OTP as used
    await OtpVerification.markUsed(activeOtp.id);

    return {
      success: true,
      otpId: activeOtp.id,
      userId: activeOtp.userId,
      identifier: cleanIdentifier,
    };
  }
}

module.exports = new OtpService();
