const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { db } = require('../config/db');
const { ADMIN_ROLES, ROLES } = require('../constants/roles');

const ADMIN_ROLE_IDS = ['role_super_admin', 'role_ops_manager', 'role_support', 'role_admin', 'role_staff'];

// Middleware to detect user from token and attach to req & res.locals for templates
const checkCurrentUser = async (req, res, next) => {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

  res.locals.currentUser = null;
  res.locals.isAdmin = false;
  res.locals.permissions = [];
  res.locals.hasPermission = () => false;
  req.user = null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await User.findById(decoded.id);
      if (user && user.account_status !== 'SUSPENDED') {
        // Collect user roles and permissions
        const userRoleRecords = (db.user_roles || []).filter((ur) => ur.user_id === user.id);
        const roleIds = userRoleRecords.map((ur) => ur.role_id);
        
        const isSuperAdmin = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN || roleIds.includes('role_super_admin');
        const isAdmin = isSuperAdmin || ADMIN_ROLES.includes(user.role) || roleIds.some((r) => ADMIN_ROLE_IDS.includes(r));

        let permissionIds = [];
        if (isSuperAdmin) {
          permissionIds = (db.permissions || []).map((p) => p.permission_name);
        } else {
          const rolePermRecords = (db.role_permissions || []).filter((rp) => roleIds.includes(rp.role_id));
          const pIds = rolePermRecords.map((rp) => rp.permission_id);
          permissionIds = (db.permissions || [])
            .filter((p) => pIds.includes(p.id))
            .map((p) => p.permission_name);
        }

        req.user = {
          id: user.id,
          name: user.name || user.full_name,
          email: user.email,
          role: user.role,
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
      }
    }
  }

  next();
};

// Guard middleware requiring authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    if (req.accepts('html')) {
      return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  next();
};

module.exports = {
  checkCurrentUser,
  requireAuth,
};
