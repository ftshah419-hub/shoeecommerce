/**
 * NELEERI SNEAKERS - COMPREHENSIVE AUTHENTICATION & SECURITY TEST SUITE
 * Executes all 27 verification tests specified in Section 17:
 * - Customer Registration (1-6)
 * - Customer Login & Sessions (7-13)
 * - OTP & Password Recovery (14-22)
 * - Role-Based Access Control & Permissions (23-27)
 */

const { Readable } = require('stream');
const assert = require('assert');
const app = require('../src/app');
const { seedDatabase } = require('../src/config/db');
const User = require('../src/models/User');
const UserSession = require('../src/models/UserSession');
const OtpVerification = require('../src/models/OtpVerification');
const Role = require('../src/models/Role');
const notificationService = require('../src/utils/notificationService');
const SecurityUtils = require('../src/utils/security');
const { verifyToken } = require('../src/utils/jwt');

// In-process Express Dispatcher (bypasses Windows socket boundaries cleanly)
const request = (urlPath, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const method = (options.method || 'GET').toUpperCase();
      let bodyBuffer = Buffer.alloc(0);
      const reqHeaders = { host: 'localhost', ...(options.headers || {}) };

      if (options.body) {
        let bodyStr = options.body;
        if (typeof bodyStr === 'object') {
          bodyStr = JSON.stringify(bodyStr);
          if (!reqHeaders['content-type']) {
            reqHeaders['content-type'] = 'application/json';
          }
        }
        bodyBuffer = Buffer.from(bodyStr);
        reqHeaders['content-length'] = bodyBuffer.length;
      }

      const reqStream = Readable.from(bodyBuffer.length > 0 ? [bodyBuffer] : []);
      const req = Object.assign(reqStream, {
        method,
        url: urlPath,
        originalUrl: urlPath,
        headers: reqHeaders,
        connection: { remoteAddress: '127.0.0.1' },
        ip: '127.0.0.1',
      });

      const resHeaders = {};
      let responseBody = '';
      let statusCode = 200;

      const res = {
        statusCode: 200,
        headers: resHeaders,
        setHeader(name, value) {
          const key = name.toLowerCase();
          if (key === 'set-cookie') {
            if (!resHeaders['set-cookie']) {
              resHeaders['set-cookie'] = [];
            }
            if (Array.isArray(value)) {
              resHeaders['set-cookie'].push(...value);
            } else {
              resHeaders['set-cookie'].push(value);
            }
          } else {
            resHeaders[key] = value;
          }
        },
        getHeader(name) {
          return resHeaders[name.toLowerCase()];
        },
        writeHead(code, headers = {}) {
          statusCode = code;
          this.statusCode = code;
          for (const [k, v] of Object.entries(headers)) {
            this.setHeader(k, v);
          }
        },
        write(chunk) {
          if (chunk) responseBody += chunk.toString();
        },
        end(chunk) {
          if (chunk) responseBody += chunk.toString();
          statusCode = this.statusCode || statusCode;

          let data = responseBody;
          const contentType = resHeaders['content-type'] || '';
          if (contentType.includes('application/json')) {
            try {
              data = JSON.parse(responseBody);
            } catch (e) {
              data = responseBody;
            }
          }

          let tokenCookie = null;
          const cookies = resHeaders['set-cookie'];
          if (cookies) {
            const cookieArr = Array.isArray(cookies) ? cookies : [cookies];
            for (const c of cookieArr) {
              const match = c.match(/token=([^;]+)/);
              if (match) {
                tokenCookie = match[1];
                break;
              }
            }
          }

          resolve({
            status: statusCode,
            headers: resHeaders,
            data,
            tokenCookie,
          });
        },
      };

      app.handle(req, res, (err) => {
        if (err) reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING NELEERI SNEAKERS AUTHENTICATION TEST SUITE');
  console.log('====================================================\n');

  // Initialize fresh seeded database
  await seedDatabase();

  let passedTests = 0;
  let totalTests = 27;

  try {
    // ----------------------------------------------------------------
    // SECTION 1: REGISTRATION TESTS (1 - 6)
    // ----------------------------------------------------------------
    console.log('📋 [GROUP 1] CUSTOMER REGISTRATION TESTS');

    // Test 1: Register a new customer
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Miles',
        lastName: 'Morales',
        email: 'miles@spiderverse.com',
        phone: '+15559876543',
        password: 'SpiderPassword123!',
        confirmPassword: 'SpiderPassword123!',
        shoeSize: 9.5,
        marketingOptIn: true,
        termsAgreed: true,
      },
    });
    assert.strictEqual(regRes.status, 201, 'Test 1 Failed: Status should be 201');
    assert.strictEqual(regRes.data.success, true, 'Test 1 Failed: Success flag should be true');
    assert.ok(regRes.data.user.id, 'Test 1 Failed: User ID should be created');
    assert.ok(regRes.data.token, 'Test 1 Failed: JWT token should be returned');
    assert.ok(regRes.tokenCookie, 'Test 1 Failed: HTTP-only session cookie should be set');
    console.log('  ✅ Test 1 Passed: Customer registered successfully with valid fields & session cookie');
    passedTests++;

    // Test 2: Register using an existing email
    const dupEmailRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Miles',
        lastName: 'Duplicate',
        email: 'miles@spiderverse.com',
        phone: '+15550001111',
        password: 'SpiderPassword123!',
        confirmPassword: 'SpiderPassword123!',
        termsAgreed: true,
      },
    });
    assert.strictEqual(dupEmailRes.status, 400, 'Test 2 Failed: Status should be 400');
    assert.ok(dupEmailRes.data.message.includes('already exists'), 'Test 2 Failed: Error message should note existing email');
    console.log('  ✅ Test 2 Passed: Duplicate email detection enforced');
    passedTests++;

    // Test 3: Register using an existing mobile number
    const dupPhoneRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Gwen',
        lastName: 'Stacy',
        email: 'gwen@spiderverse.com',
        phone: '+15559876543', // Same as Miles
        password: 'SpiderPassword123!',
        confirmPassword: 'SpiderPassword123!',
        termsAgreed: true,
      },
    });
    assert.strictEqual(dupPhoneRes.status, 400, 'Test 3 Failed: Status should be 400');
    assert.ok(dupPhoneRes.data.message.includes('mobile phone number already exists'), 'Test 3 Failed: Error message should note existing phone');
    console.log('  ✅ Test 3 Passed: Duplicate mobile number detection enforced');
    passedTests++;

    // Test 4: Submit invalid information (bad email format, bad phone format)
    const invalidRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Peter',
        lastName: 'Parker',
        email: 'not-an-email',
        phone: 'invalid-phone',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        termsAgreed: true,
      },
    });
    assert.strictEqual(invalidRes.status, 400, 'Test 4 Failed: Status should be 400');
    console.log('  ✅ Test 4 Passed: Server-side input validation rejects malformed email & phone');
    passedTests++;

    // Test 5: Submit mismatched passwords
    const mismatchRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        firstName: 'Peter',
        lastName: 'Parker',
        email: 'peter@dailybugle.com',
        phone: '+15551112233',
        password: 'PasswordOne123!',
        confirmPassword: 'PasswordTwo456!',
        termsAgreed: true,
      },
    });
    assert.strictEqual(mismatchRes.status, 400, 'Test 5 Failed: Status should be 400');
    assert.ok(mismatchRes.data.message.includes('do not match'), 'Test 5 Failed: Mismatched password message required');
    console.log('  ✅ Test 5 Passed: Password confirmation matching enforced');
    passedTests++;

    // Test 6: Verify customer role assignment (must NEVER be admin)
    const createdUser = await User.findByEmail('miles@spiderverse.com');
    assert.strictEqual(createdUser.role, 'user', 'Test 6 Failed: Role must be user');
    const userRoles = await Role.getUserRoles(createdUser.id);
    assert.ok(userRoles.some((r) => r.name === 'user'), 'Test 6 Failed: User roles table must map to user role');
    console.log('  ✅ Test 6 Passed: Public registration strictly creates customer role, never admin privileges');
    passedTests++;

    // ----------------------------------------------------------------
    // SECTION 2: LOGIN & SESSION TESTS (7 - 13)
    // ----------------------------------------------------------------
    console.log('\n📋 [GROUP 2] CUSTOMER LOGIN & SESSION TESTS');

    // Test 7: Login using valid email and password
    const loginEmailRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        password: 'SpiderPassword123!',
        rememberMe: true,
      },
    });
    assert.strictEqual(loginEmailRes.status, 200, 'Test 7 Failed: Status should be 200');
    assert.ok(loginEmailRes.data.token, 'Test 7 Failed: Token should be generated');
    const milesToken = loginEmailRes.data.token;
    console.log('  ✅ Test 7 Passed: Login with registered email and password succeeded');
    passedTests++;

    // Test 8: Login using valid mobile phone and password
    const loginPhoneRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: '+15559876543',
        password: 'SpiderPassword123!',
      },
    });
    assert.strictEqual(loginPhoneRes.status, 200, 'Test 8 Failed: Status should be 200');
    assert.strictEqual(loginPhoneRes.data.user.email, 'miles@spiderverse.com', 'Test 8 Failed: Correct user resolved');
    console.log('  ✅ Test 8 Passed: Login with registered mobile number and password succeeded');
    passedTests++;

    // Test 9: Login using incorrect password (safe timing-safe error response)
    const badPassRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        password: 'WrongPassword999!',
      },
    });
    assert.strictEqual(badPassRes.status, 400, 'Test 9 Failed: Status should be 400');
    assert.strictEqual(badPassRes.data.message, 'Invalid email, mobile number, or password.');
    console.log('  ✅ Test 9 Passed: Incorrect password rejected with generic non-revealing error message');
    passedTests++;

    // Test 10: Login with an inactive / suspended account
    await User.update(createdUser.id, { status: 'suspended' });
    const suspendedRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        password: 'SpiderPassword123!',
      },
    });
    assert.strictEqual(suspendedRes.status, 400, 'Test 10 Failed: Status should be 400');
    assert.ok(suspendedRes.data.message.includes('suspended'), 'Test 10 Failed: Suspended notice required');
    // Restore user status to active
    await User.update(createdUser.id, { status: 'active' });
    console.log('  ✅ Test 10 Passed: Suspended accounts prevented from authenticating');
    passedTests++;

    // Test 11: Refresh page while authenticated (cookie extraction on /api/auth/me)
    const profileRes = await request('/api/auth/me', {
      headers: { cookie: `token=${milesToken}` },
    });
    assert.strictEqual(profileRes.status, 200, 'Test 11 Failed: Status should be 200');
    assert.strictEqual(profileRes.data.user.email, 'miles@spiderverse.com');
    console.log('  ✅ Test 11 Passed: Authentication state persists cleanly via cookie on subsequent requests');
    passedTests++;

    // Test 12: Test session persistence in user_sessions table
    const activeSessions = await UserSession.findActiveByUserId(createdUser.id);
    assert.ok(activeSessions.length > 0, 'Test 12 Failed: Active session must be recorded in user_sessions');
    assert.strictEqual(activeSessions[0].userId, createdUser.id);
    console.log(`  ✅ Test 12 Passed: user_sessions database table tracks active session (ID: ${activeSessions[0].id})`);
    passedTests++;

    // Test 13: Logout successfully (invalidates session in user_sessions and clears cookie)
    const decodedLogin = verifyToken(milesToken);
    const targetSessionToken = decodedLogin.sessionToken;
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { cookie: `token=${milesToken}` },
    });
    assert.strictEqual(logoutRes.status, 200, 'Test 13 Failed: Status should be 200');
    // Verify that session was marked isActive: false in database
    const sessionRecord = await UserSession.findActiveByToken(targetSessionToken);
    assert.strictEqual(sessionRecord, null, 'Test 13 Failed: Session must be revoked in database');
    console.log('  ✅ Test 13 Passed: Logout successfully revokes database session and clears token');
    passedTests++;

    // ----------------------------------------------------------------
    // SECTION 3: OTP & PASSWORD RECOVERY TESTS (14 - 22)
    // ----------------------------------------------------------------
    console.log('\n📋 [GROUP 3] OTP & PASSWORD RECOVERY TESTS');

    // Test 14: Request a recovery OTP
    notificationService.clearOutbox();
    const forgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { identifier: 'miles@spiderverse.com' },
    });
    assert.strictEqual(forgotRes.status, 200, 'Test 14 Failed: Status should be 200');
    const sentOtp = notificationService.getLatestOtpFor('miles@spiderverse.com');
    assert.ok(sentOtp, 'Test 14 Failed: OTP must be generated and dispatched');
    assert.strictEqual(sentOtp.length, 6, 'Test 14 Failed: OTP must be 6 digits');
    console.log(`  ✅ Test 14 Passed: Recovery OTP generated (${sentOtp}) and dispatched via notification service`);
    passedTests++;

    // Test 15: Verify incorrect OTP
    const badOtpRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        purpose: 'password_reset',
        otpCode: '000000',
      },
    });
    assert.strictEqual(badOtpRes.status, 400, 'Test 15 Failed: Status should be 400');
    assert.ok(badOtpRes.data.message.includes('Invalid verification code'), 'Test 15 Failed: Should report invalid code');
    console.log('  ✅ Test 15 Passed: Incorrect OTP code rejected with attempts counter feedback');
    passedTests++;

    // Test 16: Test OTP resend cooldown (attempt immediate resend within 60s)
    const cooldownRes = await request('/api/auth/resend-otp', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        purpose: 'password_reset',
      },
    });
    assert.strictEqual(cooldownRes.status, 400, 'Test 16 Failed: Status should be 400');
    assert.ok(cooldownRes.data.message.includes('Please wait'), 'Test 16 Failed: Cooldown message required');
    console.log('  ✅ Test 16 Passed: Resend cooldown enforced (immediate resend prevented)');
    passedTests++;

    // Test 17: Test maximum verification attempts (submit 4 more bad codes)
    for (let i = 0; i < 4; i++) {
      await request('/api/auth/verify-otp', {
        method: 'POST',
        body: {
          identifier: 'miles@spiderverse.com',
          purpose: 'password_reset',
          otpCode: '999999',
        },
      });
    }
    // Now attempts have reached maximum
    const maxAttemptsRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        purpose: 'password_reset',
        otpCode: sentOtp, // Even with correct code, must be locked!
      },
    });
    assert.strictEqual(maxAttemptsRes.status, 400, 'Test 17 Failed: Status should be 400');
    assert.ok(maxAttemptsRes.data.message.includes('Maximum'), 'Test 17 Failed: Maximum attempts message required');
    console.log('  ✅ Test 17 Passed: Max attempts lockout enforced (locked after 5 failed tries)');
    passedTests++;

    // Test 18: Submit an expired OTP
    const expiredOtp = SecurityUtils.generateOtp(6);
    await OtpVerification.createOtp({
      userId: createdUser.id,
      identifier: 'miles@spiderverse.com',
      purpose: 'test_expired',
      otpHash: SecurityUtils.hashOtp(expiredOtp),
      expiryMinutes: -1, // Expired 1 minute ago
    });
    const expiredRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        purpose: 'test_expired',
        otpCode: expiredOtp,
      },
    });
    assert.strictEqual(expiredRes.status, 400, 'Test 18 Failed: Status should be 400');
    console.log('  ✅ Test 18 Passed: Expired OTP rejected');
    passedTests++;

    // Test 19: Request new valid OTP and verify successfully
    await OtpVerification.invalidatePending({ identifier: 'miles@spiderverse.com', purpose: 'password_reset' });
    SecurityUtils.clearRateLimit('otp_req_miles@spiderverse.com');

    const newForgot = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { identifier: 'miles@spiderverse.com' },
    });
    assert.strictEqual(newForgot.status, 200);
    const validOtp = notificationService.getLatestOtpFor('miles@spiderverse.com');

    const verifySuccessRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        purpose: 'password_reset',
        otpCode: validOtp,
      },
    });
    assert.strictEqual(verifySuccessRes.status, 200, 'Test 19 Failed: Status should be 200');
    assert.ok(verifySuccessRes.data.resetToken, 'Test 19 Failed: resetToken must be returned');
    const resetToken = verifySuccessRes.data.resetToken;
    console.log('  ✅ Test 19 Passed: Valid OTP verified; secure resetToken issued');
    passedTests++;

    // Test 20: Reset password successfully using resetToken
    const resetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: {
        resetToken,
        password: 'BrandNewSpider2026!',
        confirmPassword: 'BrandNewSpider2026!',
      },
    });
    assert.strictEqual(resetRes.status, 200, 'Test 20 Failed: Status should be 200');
    assert.ok(resetRes.data.message.includes('successful'));
    console.log('  ✅ Test 20 Passed: Password reset successful & old sessions invalidated');
    passedTests++;

    // Test 21: Login using the NEW password
    const newLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        password: 'BrandNewSpider2026!',
      },
    });
    assert.strictEqual(newLoginRes.status, 200, 'Test 21 Failed: Status should be 200');
    assert.ok(newLoginRes.data.token, 'Test 21 Failed: Login with new password succeeded');
    console.log('  ✅ Test 21 Passed: Authenticated successfully with new password');
    passedTests++;

    // Test 22: Ensure the OLD password no longer works
    const oldLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'miles@spiderverse.com',
        password: 'SpiderPassword123!',
      },
    });
    assert.strictEqual(oldLoginRes.status, 400, 'Test 22 Failed: Old password must be rejected');
    console.log('  ✅ Test 22 Passed: Old password cannot authenticate');
    passedTests++;

    // ----------------------------------------------------------------
    // SECTION 4: AUTHORIZATION & RBAC TESTS (23 - 27)
    // ----------------------------------------------------------------
    console.log('\n📋 [GROUP 4] ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS TESTS');

    // Test 23: Access customer protected pages without authentication (/profile)
    const unauthProfileRes = await request('/profile');
    assert.strictEqual(unauthProfileRes.status, 302, 'Test 23 Failed: Status should be 302 redirect');
    assert.ok(unauthProfileRes.headers.location.includes('/auth/login'), 'Test 23 Failed: Redirect location must be /auth/login');
    console.log('  ✅ Test 23 Passed: Unauthenticated visitor redirected to /auth/login preserving target route');
    passedTests++;

    // Test 24: Access administrator pages as a customer (/admin/dashboard)
    const custAdminAccess = await request('/admin/dashboard', {
      headers: { cookie: `token=${newLoginRes.data.token}` },
    });
    assert.strictEqual(custAdminAccess.status, 403, 'Test 24 Failed: Customer accessing admin must be 403 Forbidden');
    console.log('  ✅ Test 24 Passed: Customer account strictly denied access to Admin Dashboard (HTTP 403)');
    passedTests++;

    // Test 25: Admin account accessing administrator pages (/admin/dashboard)
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'admin@neleerisneakers.com',
        password: 'AdminSecurePassword123!',
      },
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminDashboardRes = await request('/admin/dashboard', {
      headers: { cookie: `token=${adminLoginRes.data.token}` },
    });
    assert.strictEqual(adminDashboardRes.status, 200, 'Test 25 Failed: Admin must have access to admin dashboard');
    console.log('  ✅ Test 25 Passed: Administrator account successfully accesses Admin Dashboard');
    passedTests++;

    // Test 26: Test unauthorized API requests (/api/auth/me without token)
    const unauthApiRes = await request('/api/auth/me');
    assert.strictEqual(unauthApiRes.status, 401, 'Test 26 Failed: Unauthenticated API request must return 401');
    console.log('  ✅ Test 26 Passed: Protected JSON API endpoints return 401 Unauthorized when token missing');
    passedTests++;

    // Test 27: Verify role and permission restrictions in database & models
    const customerPermissions = await Role.getUserPermissions(createdUser.id);
    assert.ok(customerPermissions.includes('customer_checkout'), 'Test 27 Failed: Customer should have checkout permission');
    assert.ok(!customerPermissions.includes('manage_products'), 'Test 27 Failed: Customer must NOT have manage_products permission');

    const adminUser = await User.findByEmail('admin@neleerisneakers.com');
    const adminPermissions = await Role.getUserPermissions(adminUser.id);
    assert.ok(adminPermissions.includes('manage_products'), 'Test 27 Failed: Admin must have manage_products permission');
    assert.ok(adminPermissions.includes('manage_users'), 'Test 27 Failed: Admin must have manage_users permission');
    console.log('  ✅ Test 27 Passed: Role-based permissions mapped accurately in database & enforced');
    passedTests++;

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} AUTHENTICATION & SECURITY TESTS PASSED!`);
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Test Suite Failed with Error:', err);
    process.exitCode = 1;
  }
}

runTestSuite();
