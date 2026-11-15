const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { db } = require('../config/db');
const { ADMIN_ROLES, ROLES } = require('../constants/roles');

const ADMIN_ROLE_IDS = ['role_super_admin', 'role_ops_manager', 'role_support', 'role_admin', 'role_staff'];

/**
 * Global Context Middleware
 * Extracts JWT token, validates active session against user_sessions table,
 * and attaches currentUser to req and res.locals for EJS views.
 */
const checkCurrentUser = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  const token = req.cookies?.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

  res.locals.currentUser = null;
  res.locals.isAdmin = false;
  res.locals.permissions = [];
  res.locals.hasPermission = () => false;
  req.user = null;
  req.sessionToken = null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      // If token contains sessionToken, verify that session is still active in database
      if (decoded.sessionToken && typeof UserSession !== 'undefined' && UserSession.findActiveByToken) {
        const activeSession = await UserSession.findActiveByToken(decoded.sessionToken);
        if (!activeSession) {
          // Session was revoked (e.g. logged out elsewhere or password changed)
          res.clearCookie('token');
          return next();
        }
        req.sessionToken = decoded.sessionToken;
      }

      const user = await User.findById(decoded.id);
      const isUserActive = user && 
        user.account_status !== 'SUSPENDED' && 
        user.status !== 'suspended' && 
        user.status !== 'inactive';

      if (isUserActive) {
        // Collect user roles and permissions
        const userRoleRecords = (db.user_roles || []).filter((ur) => (ur.user_id === user.id || ur.userId === user.id));
        const roleIds = userRoleRecords.map((ur) => ur.role_id || ur.roleId);
        
        const isSuperAdmin = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN || roleIds.includes('role_super_admin');
        const isAdmin = isSuperAdmin || (ADMIN_ROLES && ADMIN_ROLES.includes(user.role)) || roleIds.some((r) => ADMIN_ROLE_IDS.includes(r));

        let permissionIds = [];
        if (isSuperAdmin) {
          permissionIds = (db.permissions || []).map((p) => p.permission_name || p.name);
        } else {
          const rolePermRecords = (db.role_permissions || []).filter((rp) => roleIds.includes(rp.role_id || rp.roleId));
          const pIds = rolePermRecords.map((rp) => rp.permission_id || rp.permissionId);
          permissionIds = (db.permissions || [])
            .filter((p) => pIds.includes(p.id))
            .map((p) => p.permission_name || p.name);
        }

        req.user = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name || user.full_name,
          full_name: user.full_name || user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          shoeSize: user.shoeSize,
          status: user.status || user.account_status || 'active',
          account_status: user.account_status || user.status || 'ACTIVE',
          emailVerified: user.emailVerified !== undefined ? user.emailVerified : user.email_verified,
          phoneVerified: user.phoneVerified !== undefined ? user.phoneVerified : user.phone_verified,
          squad_tier: user.squad_tier || 'Initiate',
          profile_image: user.profile_image || null,
          permissions: permissionIds,
          isAdmin,
        };

        res.locals.currentUser = req.user;
        res.locals.isAdmin = isAdmin;
        res.locals.permissions = permissionIds;
        res.locals.hasPermission = (permName) => {
          if (isSuperAdmin) {
            return true;
          }
          return permissionIds.includes(permName);
        };
      } else if (user) {
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