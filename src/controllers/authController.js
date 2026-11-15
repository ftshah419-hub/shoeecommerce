const authService = require('../services/authService');
const otpService = require('../services/otpService');
const SecurityUtils = require('../utils/security');
const config = require('../config/config');

// Helper to determine if a request expects JSON or is accessing /api/*
const isApiOrJson = (req) => {
  return (
    (req.originalUrl && req.originalUrl.startsWith('/api/')) ||
    req.is('json') ||
    req.xhr ||
    (req.headers?.accept && req.headers.accept.includes('application/json'))
  );
};

class AuthController {
  /**
   * Render Login Page
   */
  renderLogin(req, res) {
    if (req.user) {
      return res.redirect(req.user.role === 'admin' ? '/admin/dashboard' : '/');
    }

    const safeRedirect = SecurityUtils.getSafeRedirectUrl(req.query.redirect || req.query.returnTo || '');

    res.render('auth/login', {
      title: 'Sign In - Neleeri Sneakers',
      error: req.query.error || null,
      success: req.query.success || null,
      redirect: safeRedirect,
      identifier: req.query.identifier || '',
    });
  }

  /**
   * Render Registration (Sign Up) Page
   */
  renderRegister(req, res) {
    if (req.user) {
      return res.redirect('/');
    }

    res.render('auth/register', {
      title: 'Join Neleeri Sneakers - Create Account',
      error: req.query.error || null,
      formData: {},
    });
  }

  /**
   * Handle Registration Form Submission & JSON API
   */
  async register(req, res, next) {
    try {
      const {
        firstName,
        lastName,
        name,
        email,
        phone,
        password,
        confirmPassword,
        shoeSize,
        marketingOptIn,
        termsAgreed,
      } = req.body;

      const { token, user } = await authService.register({
        firstName,
        lastName,
        name,
        email,
        phone,
        password,
        confirmPassword,
        shoeSize,
        marketingOptIn,
        termsAgreed,
      });

      // Set secure HTTP-only session cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
      });

      if (isApiOrJson(req)) {
        return res.status(201).json({
          success: true,
          message: 'Account created successfully.',
          user,
          token,
        });
      }

      res.redirect('/?welcome=true');
    } catch (error) {
      if (isApiOrJson(req)) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.render('auth/register', {
        title: 'Join Neleeri Sneakers - Create Account',
        error: error.message,
        formData: req.body || {},
      });
    }
  }

  /**
   * Handle Login Form Submission & JSON API
   */
  async login(req, res, next) {
    try {
      const { identifier, email, phone, password, rememberMe, redirect } = req.body;
      const resolvedIdentifier = identifier || email || phone;
      const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';

      const { token, user } = await authService.login({
        identifier: resolvedIdentifier,
        password,
        rememberMe,
        ipAddress,
        userAgent,
      });

      const rememberBool = Boolean(rememberMe && (rememberMe === 'true' || rememberMe === true || rememberMe === 'on'));
      const cookieDuration = rememberBool
        ? 30 * 24 * 60 * 60 * 1000 // 30 days
        : 7 * 24 * 60 * 60 * 1000;  // 7 days

      res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        maxAge: cookieDuration,
        sameSite: 'lax',
      });

      if (isApiOrJson(req)) {
        return res.json({
          success: true,
          message: 'Authentication successful.',
          user,
          token,
        });
      }

      const safeRedirect = SecurityUtils.getSafeRedirectUrl(redirect, null);
      if (safeRedirect) {
        return res.redirect(safeRedirect);
      }

      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }

      res.redirect('/');
    } catch (error) {
      if (isApiOrJson(req)) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.render('auth/login', {
        title: 'Sign In - Neleeri Sneakers',
        error: error.message,
        success: null,
        redirect: req.body.redirect || '',
        identifier: req.body.identifier || req.body.email || '',
      });
    }
  }

  /**
   * Render Forgot Password Page
   */
  renderForgotPassword(req, res) {
    res.render('auth/forgot-password', {
      title: 'Reset Password - Neleeri Sneakers',
      error: req.query.error || null,
      success: req.query.success || null,
      identifier: req.query.identifier || '',
    });
  }

  /**
   * Process Forgot Password Request (generates OTP)
   */
  async forgotPassword(req, res, next) {
    try {
      const { identifier } = req.body;
      const result = await authService.forgotPassword({ identifier });

      if (isApiOrJson(req)) {
        return res.json(result);
      }

      res.redirect(
        `/auth/verify-otp?identifier=${encodeURIComponent(identifier)}&purpose=password_reset&channel=${result.channel || 'email'}`
      );
    } catch (error) {
      if (isApiOrJson(req)) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.render('auth/forgot-password', {
        title: 'Reset Password - Neleeri Sneakers',
        error: error.message,
        success: null,
        identifier: req.body.identifier || '',
      });
    }
  }

  /**
   * Render OTP Verification Screen
   */
  renderVerifyOtp(req, res) {
    const { identifier, purpose, channel } = req.query;

    if (!identifier) {
      return res.redirect('/auth/forgot-password');
    }

    res.render('auth/verify-otp', {
      title: 'Verify Code - Neleeri Sneakers',
      identifier: identifier || '',
      purpose: purpose || 'password_reset',
      channel: channel || (identifier.includes('@') ? 'email' : 'sms'),
      error: req.query.error || null,
      success: req.query.success || null,
    });
  }

  /**
   * Verify Submitted OTP Code
   */
  async verifyOtp(req, res, next) {
    try {
      const { identifier, purpose, otpCode } = req.body;

      if (!otpCode) {
        throw new Error('Please enter the 6-digit verification code.');
      }

      if (purpose === 'password_reset') {
        const result = await authService.verifyResetOtp({ identifier, otpCode });

        if (isApiOrJson(req)) {
          return res.json(result);
        }

        return res.redirect(
          `/auth/reset-password?token=${encodeURIComponent(result.resetToken)}&identifier=${encodeURIComponent(identifier)}`
        );
      }

      // General OTP verification (e.g. mobile or email confirmation)
      const result = await otpService.verifyOtp({ identifier, purpose, otpCode });

      if (isApiOrJson(req)) {
        return res.json(result);
      }

      res.redirect('/auth/login?success=' + encodeURIComponent('Verification successful. Please sign in.'));
    } catch (error) {
      if (isApiOrJson(req)) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.render('auth/verify-otp', {
        title: 'Verify Code - Neleeri Sneakers',
        identifier: req.body.identifier || '',
        purpose: req.body.purpose || 'password_reset',
        channel: req.body.channel || 'email',
        error: error.message,
        success: null,
      });
    }
  }

  /**
   * Resend OTP Code
   */
  async resendOtp(req, res, next) {
    try {
      const { identifier, purpose, channel } = req.body;
      const result = await otpService.requestOtp({
        identifier,
        purpose: purpose || 'password_reset',
        channel: channel || 'email',
      });

      if (isApiOrJson(req)) {
        return res.json({ success: true, message: 'New verification code dispatched.', ...result });
      }

      res.redirect(
        `/auth/verify-otp?identifier=${encodeURIComponent(identifier)}&purpose=${purpose || 'password_reset'}&success=${encodeURIComponent('A new 6-digit code has been sent.')}`
      );
    } catch (error) {
      if (isApiOrJson(req)) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.render('auth/verify-otp', {
        title: 'Verify Code - Neleeri Sneakers',
        identifier: req.body.identifier || '',
        purpose: req.body.purpose || 'password_reset',
        channel: req.body.channel || 'email',
        error: error.message,
        success: null,
      });
    }
  }

  /**
   * Render New Password Reset Screen
   */
  renderResetPassword(req, res) {
    const { token, identifier } = req.query;

    if (!token) {
      return res.redirect('/auth/forgot-password?error=' + encodeURIComponent('Missing reset token. Please request a new code.'));
    }

    res.render('auth/reset-password', {
      title: 'Set New Password - Neleeri Sneakers',
      resetToken: token,
      identifier: identifier || '',
      error: req.query.error || null,
    });
  }

  /**
   * Set New Password
   */
  async resetPassword(req, res, next) {
    try {
      const { resetToken, password, confirmPassword } = req.body;
      const result = await authService.resetPassword({ resetToken, password, confirmPassword });

      if (isApiOrJson(req)) {
        return res.json(result);
      }

      res.redirect('/auth/login?success=' + encodeURIComponent('Password reset successful! Please log in with your new password.'));
    } catch (error) {
      if (isApiOrJson(req)) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.render('auth/reset-password', {
        title: 'Set New Password - Neleeri Sneakers',
        resetToken: req.body.resetToken || '',
        identifier: req.body.identifier || '',
        error: error.message,
      });
    }
  }

  /**
   * Verify Email
   */
  async verifyEmail(req, res, next) {
    try {
      const token = req.query.token || req.body.token;
      await authService.verifyEmail(token);

      if (isApiOrJson(req)) {
        return res.json({ success: true, message: 'Email address verified.' });
      }

      res.redirect('/auth/login?success=' + encodeURIComponent('Your email has been verified! Welcome to Neleeri Sneakers.'));
    } catch (error) {
      if (isApiOrJson(req)) {
        return res.status(400).json({ success: false, message: error.message });
      }

      res.render('error', {
        title: 'Email Verification Failed',
        errorCode: 400,
        errorMessage: error.message,
      });
    }
  }

  /**
   * Logout user & revoke session in database
   */
  async logout(req, res) {
    const sessionToken = req.sessionToken || req.cookies?.token;
    await authService.logout(sessionToken);

    res.clearCookie('token');

    if (isApiOrJson(req)) {
      return res.json({ success: true, message: 'Logged out successfully.' });
    }

    res.redirect('/auth/login?success=' + encodeURIComponent('Logged out successfully.'));
  }

  /**
   * API Endpoint: Get Current Authenticated User & Permissions
   */
  async getCurrentUser(req, res) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const profile = await authService.getProfile(req.user.id);
    return res.json({ success: true, user: profile });
  }

  /**
   * Social Authentication Handler (Google / Apple)
   */
  async socialLogin(req, res, next) {
    try {
      const { provider } = req.params;
      const { providerUserId, profile } = req.body;

      if (!providerUserId) {
        return res.status(400).json({
          success: false,
          message: `Social login for ${provider} requires client configuration (Client ID & Secret). Use the credentials API or buildathon simulated social login.`,
        });
      }

      const ipAddress = req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Social Client';

      const result = await authService.socialLogin({
        provider,
        providerUserId,
        profile: profile || {},
        ipAddress,
        userAgent,
      });

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });

      if (isApiOrJson(req)) {
        return res.json(result);
      }

      res.redirect('/');
    } catch (error) {
      if (isApiOrJson(req)) {
        return res.status(400).json({ success: false, message: error.message });
      }
      res.redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * Social OAuth initiation redirect / dev simulator
   */
  socialAuthRedirect(req, res) {
    const { provider } = req.params;
    const isGoogle = provider.toLowerCase() === 'google';
    const hasLiveOauth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

    if (hasLiveOauth && isGoogle) {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&response_type=code&scope=openid%20email%20profile&redirect_uri=${encodeURIComponent('http://localhost:' + config.port + '/auth/social/google/callback')}`;
      return res.redirect(authUrl);
    }

    res.render('auth/social-simulator', {
      title: `${isGoogle ? 'Google' : 'Apple'} Sign-In - NELEERI Sneakers`,
      provider: isGoogle ? 'Google' : 'Apple',
      providerKey: provider.toLowerCase(),
    });
  }
}

module.exports = new AuthController();
