const Role = require('../models/Role');
const { ADMIN_ROLES, ROLES } = require('../constants/roles');

const isApiOrJson = (req) => {
  return (
    (req.originalUrl && req.originalUrl.startsWith('/api/')) ||
    req.is('json') ||
    req.xhr ||
    (req.headers?.accept && req.headers.accept.includes('application/json'))
  );
};

/**
 * Enforce Role-Based Access Control on routes
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      if (!isApiOrJson(req) && req.accepts('html')) {
        const redirectUrl = req.originalUrl && req.originalUrl.startsWith('/') ? req.originalUrl : '/';
        return res.redirect('/auth/login?error=' + encodeURIComponent('Please log in with appropriate privileges.') + '&redirect=' + encodeURIComponent(redirectUrl));
      }
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Normalize roles (handle 'user' and 'customer' synonymously)
    const normalizedAllowed = allowedRoles.flatMap((r) =>
      r === 'user' || r === 'customer' ? ['user', 'customer'] : [r]
    );

    const userRole = req.user.role;
    const isAllowed = 
      normalizedAllowed.includes(userRole) ||
      (normalizedAllowed.includes(ROLES.ADMIN) && ADMIN_ROLES && ADMIN_ROLES.includes(userRole)) ||
      req.user.isAdmin;

    if (!isAllowed) {
      if (!isApiOrJson(req) && req.accepts('html')) {
        return res.status(403).render('error', {
          title: '403 Access Forbidden - Neleeri Command Center',
          errorCode: 403,
          errorMessage: 'Access Forbidden: Insufficient clearance level for requested resource.',
        });
      }
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient role privileges.' });
    }

    next();
  };
};

/**
 * Enforce Granular Permission-Based Access Control
 */
const authorizePermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      if (!isApiOrJson(req) && req.accepts('html')) {
        return res.redirect('/auth/login?error=' + encodeURIComponent('Please log in to continue.'));
      }
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Admins automatically bypass permission checks
    if (req.user.role === 'admin' || req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN || req.user.isAdmin) {
      return next();
    }

    const userPermissions = (typeof Role !== 'undefined' && Role.getUserPermissions) 
      ? await Role.getUserPermissions(req.user.id) 
      : (req.user.permissions || []);

    if (!userPermissions.includes(requiredPermission)) {
      if (!isApiOrJson(req) && req.accepts('html')) {
        return res.status(403).render('error', {
          title: 'Permission Denied',
          errorCode: 403,
          errorMessage: `Forbidden: You do not possess the required permission [${requiredPermission}].`,
        });
      }
      return res.status(403).json({ success: false, message: `Forbidden: Missing permission ${requiredPermission}.` });
    }

    next();
  };
};

const requirePermission = (...permissionNames) => {
  return (req, res, next) => {
    if (!req.user) {
      if (!isApiOrJson(req) && req.accepts('html')) {
        return res.redirect('/auth/login?error=' + encodeURIComponent('Please log in with admin privileges.') + '&redirect=' + encodeURIComponent(req.originalUrl));
      }
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN || req.user.isAdmin) {
      return next();
    }

    const userPerms = req.user.permissions || [];
    const hasAny = permissionNames.some((p) => userPerms.includes(p));

    if (!hasAny) {
      if (!isApiOrJson(req) && req.accepts('html')) {
        return res.status(403).render('error', {
          title: '403 Permission Denied - Neleeri Command Center',
          errorCode: 403,
          errorMessage: `Access Restricted: Operation requires one of the following permissions: [${permissionNames.join(', ')}]`,
        });
      }
      return res.status(403).json({ success: false, message: 'Forbidden: Permission denied.' });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
  authorizePermission,
  requirePermission,
};