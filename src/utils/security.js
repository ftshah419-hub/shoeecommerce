const crypto = require('crypto');
const config = require('../config/config');

class SecurityUtils {
  /**
   * In-memory Rate Limiter map for IP & Identifier brute-force throttling
   */
  static rateLimitStore = new Map();

  /**
   * Generate cryptographically secure 6-digit numeric OTP
   */
  static generateOtp(digits = 6) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return String(crypto.randomInt(min, max + 1));
  }

  /**
   * Securely hash an OTP before storage
   */
  static hashOtp(otp) {
    const secret = config.jwtSecret || 'neleeri_secure_salt';
    return crypto.createHmac('sha256', secret).update(String(otp)).digest('hex');
  }

  /**
   * Timing-safe verification of plain OTP against stored hash
   */
  static verifyOtpHash(plainOtp, storedHash) {
    if (!plainOtp || !storedHash) return false;
    const computedHash = SecurityUtils.hashOtp(plainOtp);
    const bufA = Buffer.from(computedHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Generate secure random string token (e.g. for reset tokens or sessions)
   */
  static generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Validate password strength according to buildathon specs:
   * - Minimum 8 characters
   * - At least one number
   * - At least one special character
   */
  static validatePasswordStrength(password) {
    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        score: 0,
        feedback: 'Password is required.',
        checks: { minLength: false, hasNumber: false, hasSpecial: false, hasUppercase: false },
      };
    }

    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);

    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (hasNumber) score += 20;
    if (hasSpecial) score += 20;
    if (hasUppercase && hasLowercase) score += 20;

    const isValid = minLength && hasNumber && hasSpecial;

    let feedback = 'Strong password.';
    if (!minLength) feedback = 'Password must be at least 8 characters long.';
    else if (!hasNumber) feedback = 'Password must include at least one number (0-9).';
    else if (!hasSpecial) feedback = 'Password must include at least one special character (!@#$%^&*).';

    return {
      isValid,
      score: Math.min(score, 100),
      feedback,
      checks: { minLength, hasNumber, hasSpecial, hasUppercase, hasLowercase },
    };
  }

  /**
   * Validate phone format (allowing international +country code)
   */
  static validatePhone(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // Standard international or E.164 phone regex (7 to 15 digits, optional leading +)
    return /^\+?[0-9]{7,15}$/.test(cleaned);
  }

  /**
   * Validate RFC email format
   */
  static validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Prevent Open Redirect vulnerabilities
   */
  static getSafeRedirectUrl(redirect, fallback = '/') {
    if (!redirect || typeof redirect !== 'string') return fallback;
    const clean = redirect.trim();
    // Must begin with a single slash, not followed by / or \ (protocol relative or domain bypass)
    if (clean.startsWith('/') && !clean.startsWith('//') && !clean.startsWith('/\\') && !clean.includes('://')) {
      return clean;
    }
    return fallback;
  }

  /**
   * Rate limiting check: returns { allowed: boolean, remainingAttempts: number, retryAfterSeconds: number }
   */
  static checkRateLimit(key, { maxRequests = 5, windowSeconds = 60 } = {}) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const record = SecurityUtils.rateLimitStore.get(key) || { timestamps: [] };

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    record.timestamps.push(now);
    SecurityUtils.rateLimitStore.set(key, record);

    return {
      allowed: true,
      remainingAttempts: maxRequests - record.timestamps.length,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Clear rate limit for a key (e.g. upon successful authentication)
   */
  static clearRateLimit(key) {
    SecurityUtils.rateLimitStore.delete(key);
  }
}

module.exports = SecurityUtils;
