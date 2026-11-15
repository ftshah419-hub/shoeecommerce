const User = require('../models/User');
const UserSession = require('../models/UserSession');
const LoginLog = require('../models/LoginLog');
const PasswordReset = require('../models/PasswordReset');
const EmailVerification = require('../models/EmailVerification');
const SocialAccount = require('../models/SocialAccount');
const Role = require('../models/Role');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const SecurityUtils = require('../utils/security');
const otpService = require('./otpService');
const notificationService = require('../utils/notificationService');
const ROLES = require('../constants/roles');

class AuthService {
  /**
   * Customer Registration (Sign Up)
   */
  async register({
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
  }) {
    // 1. Required field validation
    const resolvedFirstName = (firstName || (name ? name.split(' ')[0] : '')).trim();
    const resolvedLastName = (lastName || (name ? name.split(' ').slice(1).join(' ') : '')).trim();

    if (!resolvedFirstName) {
      throw new Error('First name is required.');
    }
    if (!resolvedLastName) {
      throw new Error('Last name is required.');
    }
    if (!email) {
      throw new Error('Email address is required.');
    }
    if (!phone) {
      throw new Error('Mobile number with country code is required.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }
    if (!confirmPassword) {
      throw new Error('Confirm password is required.');
    }

    // Terms agreement validation
    if (termsAgreed === false || termsAgreed === 'false') {
      throw new Error('You must accept the Terms and Conditions to create an account.');
    }

    // 2. Format validation
    if (!SecurityUtils.validateEmail(email)) {
      throw new Error('Please enter a valid email address (e.g. name@domain.com).');
    }

    if (!SecurityUtils.validatePhone(phone)) {
      throw new Error('Please enter a valid mobile number with country code (e.g. +1234567890).');
    }

    // Password confirmation match
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    // Password strength check
    const strength = SecurityUtils.validatePasswordStrength(password);
    if (!strength.isValid) {
      throw new Error(strength.feedback);
    }

    // 3. Duplicate checks
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      throw new Error('An account with this email address already exists.');
    }

    const existingPhone = await User.findByPhone(phone);
    if (existingPhone) {
      throw new Error('An account with this mobile phone number already exists.');
    }

    // 4. Secure Password Hashing
    const hashedPassword = await hashPassword(password);

    // 5. Create user record (strictly assigned customer/user role, never admin)
    const user = await User.create({
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      name: `${resolvedFirstName} ${resolvedLastName}`,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      role: ROLES.USER,
      shoeSize: shoeSize ? parseFloat(shoeSize) : null,
      marketingOptIn: Boolean(marketingOptIn),
      termsAgreed: true,
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
    });

    // 6. Assign customer role in user_roles table
    await Role.assignRoleToUser(user.id, ROLES.USER);

    // 7. Generate email verification ticket & send welcome notification
    const emailToken = SecurityUtils.generateSecureToken(24);
    await EmailVerification.createVerification({
      userId: user.id,
      email: user.email,
      token: emailToken,
    });

    await notificationService.sendEmail({
      to: user.email,
      subject: 'Welcome to NELEERI Sneakers – Confirm Your Email',
      html: `
        <div style="font-family: sans-serif; background-color: #0f1115; color: #f3f4f6; padding: 24px; border-radius: 8px;">
          <h1 style="color: #ff4d00;">👟 Welcome to NELEERI Sneakers, ${resolvedFirstName}!</h1>
          <p>Your account is ready. Access exclusive sneaker drops, manage your bag, and track orders.</p>
          <p><a href="/auth/verify-email?token=${emailToken}" style="background-color: #2563eb; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a></p>
        </div>
      `,
    });

    // 8. Establish session and generate JWT
    const expiresInMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionToken = SecurityUtils.generateSecureToken(32);
    const session = await UserSession.createSession({
      userId: user.id,
      sessionToken,
      ipAddress: '127.0.0.1',
      userAgent: 'Registration Flow',
      rememberMe: false,
      expiresInMs,
    });

    const token = generateToken({
      id: user.id,
      sessionId: session.id,
      sessionToken,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      session,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shoeSize: user.shoeSize,
        status: user.status,
      },
    };
  }

  /**
   * Customer / Administrator Login
   */
  async login({ identifier, password, rememberMe = false, ipAddress = '127.0.0.1', userAgent = 'Unknown' }) {
    if (!identifier || !password) {
      throw new Error('Email or mobile number and password are required.');
    }

    const cleanIdentifier = identifier.trim();

    // 1. Rate limiting / Brute-force protection
    const rateCheck = SecurityUtils.checkRateLimit(`login_${cleanIdentifier.toLowerCase()}`, {
      maxRequests: 5,
      windowSeconds: 60,
    });

    if (!rateCheck.allowed) {
      await LoginLog.record({
        identifier: cleanIdentifier,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: 'Rate limit exceeded: too many failed login attempts.',
      });
      throw new Error(`Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`);
    }

    // 2. Identify user by email OR mobile phone
    const user = await User.findByIdentifier(cleanIdentifier);

    // Timing-safe response: compare against dummy hash if user doesn't exist to prevent timing attacks
    const dummyHash = '$2a$10$wT0XqXqVvG79m4aC.YyG9ue9gW1v2iN/E4L/8c6eTzB4kP7pX0v.m';
    const targetHash = user ? user.password : dummyHash;
    const isMatch = await comparePassword(password, targetHash);

    if (!user || !isMatch) {
      await LoginLog.record({
        userId: user ? user.id : null,
        identifier: cleanIdentifier,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: 'Invalid credentials provided.',
      });
      // Safe generic message — never disclose if email/phone exists
      throw new Error('Invalid email, mobile number, or password.');
    }

    // 3. Verify Account Status
    if (user.status && user.status !== 'active') {
      await LoginLog.record({
        userId: user.id,
        identifier: cleanIdentifier,
        ipAddress,
        userAgent,
        status: 'FAILED',
        failureReason: `Account status is ${user.status}`,
      });
      throw new Error(`Account access restricted (${user.status}). Please contact Neleeri support.`);
    }

    // Clear rate limit on successful credentials
    SecurityUtils.clearRateLimit(`login_${cleanIdentifier.toLowerCase()}`);

    // 4. Record successful login log
    await LoginLog.record({
      userId: user.id,
      identifier: cleanIdentifier,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    // 5. Establish Authenticated Session in user_sessions table
    const rememberBool = Boolean(rememberMe && (rememberMe === 'true' || rememberMe === true || rememberMe === 'on'));
    const expiresInMs = rememberBool
      ? 30 * 24 * 60 * 60 * 1000 // 30 days for Remember Me
      : 7 * 24 * 60 * 60 * 1000;  // 7 days default

    const sessionToken = SecurityUtils.generateSecureToken(32);
    const session = await UserSession.createSession({
      userId: user.id,
      sessionToken,
      ipAddress,
      userAgent,
      rememberMe: rememberBool,
      expiresInMs,
    });

    // 6. Generate JWT signed token with session ID
    const token = generateToken(
      {
        id: user.id,
        sessionId: session.id,
        sessionToken,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      rememberBool ? '30d' : '7d'
    );

    return {
      token,
      session,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shoeSize: user.shoeSize,
        status: user.status,
      },
    };
  }

  /**
   * User Logout: Revoke session and clear state
   */
  async logout(sessionToken) {
    if (sessionToken) {
      await UserSession.revokeSession(sessionToken);
    }
    return { success: true };
  }

  /**
   * Initiate Forgot Password flow
   */
  async forgotPassword({ identifier }) {
    if (!identifier) {
      throw new Error('Please enter your registered email address or mobile number.');
    }

    const cleanIdentifier = identifier.trim();

    // Find user by email or mobile
    const user = await User.findByIdentifier(cleanIdentifier);

    // Security practice: Always return identical message regardless of whether account was found
    const safeResponse = {
      success: true,
      identifier: cleanIdentifier,
      message: 'If an account is associated with this contact, a 6-digit verification code has been dispatched.',
    };

    if (!user) {
      return safeResponse;
    }

    // Determine delivery channel
    const channel = cleanIdentifier.includes('@') ? 'email' : 'sms';

    // Dispatch OTP via OTP Service
    const otpResult = await otpService.requestOtp({
      identifier: cleanIdentifier,
      purpose: 'password_reset',
      channel,
      userId: user.id,
    });

    return {
      ...safeResponse,
      otpId: otpResult.otpId,
      channel: otpResult.channel,
      devOtp: otpResult.devOtp,
    };
  }

  /**
   * Verify Reset OTP and generate a secure password reset token
   */
  async verifyResetOtp({ identifier, otpCode }) {
    const verified = await otpService.verifyOtp({
      identifier,
      purpose: 'password_reset',
      otpCode,
    });

    const user = await User.findByIdentifier(identifier);
    if (!user) {
      throw new Error('User account not found.');
    }

    // Generate secure password reset token
    const resetToken = SecurityUtils.generateSecureToken(32);
    await PasswordReset.createRequest({
      userId: user.id,
      identifier,
      resetToken,
      otpId: verified.otpId,
      expiryMinutes: 15,
    });

    return {
      success: true,
      resetToken,
      identifier,
      message: 'OTP verified successfully. You may now set a new password.',
    };
  }

  /**
   * Reset Password: validate token, hash new password, invalidate sessions
   */
  async resetPassword({ resetToken, password, confirmPassword }) {
    if (!resetToken) {
      throw new Error('Invalid or missing password reset token.');
    }
    if (!password) {
      throw new Error('New password is required.');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const strength = SecurityUtils.validatePasswordStrength(password);
    if (!strength.isValid) {
      throw new Error(strength.feedback);
    }

    // Validate reset ticket
    const ticket = await PasswordReset.findValidByToken(resetToken);
    if (!ticket) {
      throw new Error('Password reset link or code has expired or already been used. Please start over.');
    }

    const user = await User.findById(ticket.userId);
    if (!user) {
      throw new Error('User account not found.');
    }

    // Hash new password and update user record
    const hashedPassword = await hashPassword(password);
    await User.update(user.id, { password: hashedPassword });

    // Mark reset ticket as used (cannot be reused)
    await PasswordReset.markUsed(resetToken);

    // Invalidate all active user sessions for security
    await UserSession.revokeAllUserSessions(user.id);

    // Send confirmation notification
    await notificationService.sendEmail({
      to: user.email,
      subject: 'Security Alert: Your NELEERI Password Was Changed',
      html: `
        <div style="font-family: sans-serif; background-color: #0f1115; color: #f3f4f6; padding: 24px; border-radius: 8px;">
          <h2 style="color: #ff4d00;">👟 Password Reset Notice</h2>
          <p>Hi ${user.firstName || user.name},</p>
          <p>The password for your Neleeri Sneakers account was successfully changed.</p>
          <p>If you did not make this change, please contact our security team immediately.</p>
        </div>
      `,
    });

    return {
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    };
  }

  /**
   * Verify Email Address via token
   */
  async verifyEmail(token) {
    if (!token) {
      throw new Error('Verification token is required.');
    }

    const verification = await EmailVerification.findValidByToken(token);
    if (!verification) {
      throw new Error('Verification link is invalid or has expired.');
    }

    await User.update(verification.userId, { emailVerified: true });
    await EmailVerification.markUsed(token);

    return { success: true, message: 'Email address verified successfully!' };
  }

  /**
   * Social Authentication (Google / Apple)
   */
  async socialLogin({ provider, providerUserId, profile = {}, ipAddress = '127.0.0.1', userAgent = 'Unknown' }) {
    if (!provider || !providerUserId) {
      throw new Error('Provider and Provider User ID are required.');
    }

    const validProviders = ['google', 'apple'];
    if (!validProviders.includes(provider.toLowerCase())) {
      throw new Error(`Unsupported social provider: ${provider}`);
    }

    // Check if social account is already linked
    let socialRecord = await SocialAccount.findByProvider(provider, providerUserId);
    let user = null;

    if (socialRecord) {
      user = await User.findById(socialRecord.userId);
    } else if (profile.email) {
      // Check if user with that email already exists
      user = await User.findByEmail(profile.email);
      if (user) {
        // Link existing user to social account
        await SocialAccount.linkAccount({
          userId: user.id,
          provider,
          providerUserId,
          profileData: profile,
        });
      }
    }

    // If still no user, create a new customer account
    if (!user) {
      const email = profile.email || `${provider}_${providerUserId}@social.neleerisneakers.com`;
      const firstName = profile.firstName || (profile.name ? profile.name.split(' ')[0] : 'Sneakerhead');
      const lastName = profile.lastName || (profile.name ? profile.name.split(' ').slice(1).join(' ') : 'VIP');
      const randomPass = SecurityUtils.generateSecureToken(16);
      const hashedPassword = await hashPassword(randomPass);

      user = await User.create({
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        role: ROLES.USER,
        status: 'active',
        emailVerified: true,
      });

      await Role.assignRoleToUser(user.id, ROLES.USER);

      await SocialAccount.linkAccount({
        userId: user.id,
        provider,
        providerUserId,
        profileData: profile,
      });
    }

    // Establish session
    const expiresInMs = 7 * 24 * 60 * 60 * 1000;
    const sessionToken = SecurityUtils.generateSecureToken(32);
    const session = await UserSession.createSession({
      userId: user.id,
      sessionToken,
      ipAddress,
      userAgent,
      rememberMe: false,
      expiresInMs,
    });

    const token = generateToken({
      id: user.id,
      sessionId: session.id,
      sessionToken,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await LoginLog.record({
      userId: user.id,
      identifier: `${provider}:${providerUserId}`,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return {
      token,
      session,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Get safe profile information
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }
    const permissions = await Role.getUserPermissions(userId);
    const activeSessions = await UserSession.findActiveByUserId(userId);

    const { password, ...safeUser } = user;
    return {
      ...safeUser,
      permissions,
      activeSessionsCount: activeSessions.length,
    };
  }
}

module.exports = new AuthService();
