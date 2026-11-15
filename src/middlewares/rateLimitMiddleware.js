const SecurityUtils = require('../utils/security');

/**
 * Express middleware for endpoint rate limiting
 */
const createRateLimiter = ({ keyPrefix, maxRequests = 5, windowSeconds = 60, message }) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const identifier = req.body?.email || req.body?.identifier || req.body?.phone || ip;
    const rateKey = `${keyPrefix}_${ip}_${identifier}`.toLowerCase();

    const rateResult = SecurityUtils.checkRateLimit(rateKey, { maxRequests, windowSeconds });

    if (!rateResult.allowed) {
      const errorMsg = message || `Too many requests. Please wait ${rateResult.retryAfterSeconds} seconds before retrying.`;
      if (req.accepts('html') && !req.is('json') && !req.xhr) {
        return res.status(429).render('error', {
          title: 'Too Many Requests',
          errorCode: 429,
          errorMessage: errorMsg,
        });
      }
      return res.status(429).json({
        success: false,
        message: errorMsg,
        retryAfterSeconds: rateResult.retryAfterSeconds,
      });
    }

    res.setHeader('X-RateLimit-Remaining', rateResult.remainingAttempts);
    next();
  };
};

module.exports = {
  createRateLimiter,
  loginRateLimiter: createRateLimiter({
    keyPrefix: 'mw_login',
    maxRequests: 5,
    windowSeconds: 60,
    message: 'Too many login attempts. Please wait 1 minute before trying again.',
  }),
  otpRateLimiter: createRateLimiter({
    keyPrefix: 'mw_otp',
    maxRequests: 3,
    windowSeconds: 60,
    message: 'Too many OTP requests. Please wait 1 minute before requesting another code.',
  }),
};
