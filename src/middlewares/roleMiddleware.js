const Role = require('../models/Role');

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
        return res.redirect('/auth/login?error=' + encodeURIComponent('Please log in to continue.'));
      }
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Normalize roles (handle 'user' and 'customer' synonymously)
    const normalizedAllowed = allowedRoles.flatMap((r) =>
      r === 'user' || r === 'customer' ? ['user', 'customer'] : [r]
    );

    if (!normalizedAllowed.includes(req.user.role)) {
      if (!isApiOrJson(req) && req.accepts('html')) {
        return res.status(403).render('error', {
          title: 'Access Denied',
          errorCode: 403,
          errorMessage: 'Access Forbidden: You do not possess the required permissions (Admin role needed).',
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
    if (req.user.role === 'admin') {
      return next();
    }

    const userPermissions = await Role.getUserPermissions(req.user.id);
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

module.exports = {
  authorizeRoles,
  authorizePermission,
};
