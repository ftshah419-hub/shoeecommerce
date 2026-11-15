const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const UserSession = require('../models/UserSession');

/**
 * Global Context Middleware
 * Extracts JWT token, validates active session against user_sessions table,
 * and attaches currentUser to req and res.locals for EJS views.
 */
const checkCurrentUser = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  const token = req.cookies?.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

  res.locals.currentUser = null;
  req.user = null;
  req.sessionToken = null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      // If token contains sessionToken, verify that session is still active in database
      if (decoded.sessionToken) {
        const activeSession = await UserSession.findActiveByToken(decoded.sessionToken);
        if (!activeSession) {
          // Session was revoked (e.g. logged out elsewhere or password changed)
          res.clearCookie('token');
          return next();
        }
        req.sessionToken = decoded.sessionToken;
      }

      const user = await User.findById(decoded.id);
      // Ensure user exists and is active
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          shoeSize: user.shoeSize,
          status: user.status,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        };
        res.locals.currentUser = req.user;
      } else if (user && user.status !== 'active') {
        // User suspended or deactivated
        res.clearCookie('token');
      }
    }
  }

  next();
};

/**
 * Route Guard requiring authenticated user session
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    const isApi = (req.originalUrl && req.originalUrl.startsWith('/api/')) ||
      req.is('json') ||
      req.xhr ||
      (req.headers?.accept && req.headers.accept.includes('application/json'));

    if (!isApi && req.accepts('html')) {
      const redirectUrl = req.originalUrl && req.originalUrl.startsWith('/') ? req.originalUrl : '/';
      return res.redirect('/auth/login?redirect=' + encodeURIComponent(redirectUrl));
    }
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }
  next();
};

module.exports = {
  checkCurrentUser,
  requireAuth,
};
