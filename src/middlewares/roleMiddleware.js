const { ADMIN_ROLES, ROLES } = require('../constants/roles');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.accepts('html')) {
        return res.redirect('/auth/login?error=Please log in with admin privileges.&redirect=' + encodeURIComponent(req.originalUrl));
      }
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRole = req.user.role;
    const isAllowed = 
      allowedRoles.includes(userRole) ||
      (allowedRoles.includes(ROLES.ADMIN) && ADMIN_ROLES.includes(userRole)) ||
      req.user.isAdmin;

    if (!isAllowed) {
      if (req.accepts('html')) {
        return res.status(403).render('error', {
          title: '403 Access Forbidden - Neleeri Command Center',
          errorCode: 403,
          errorMessage: 'Access Forbidden: Insufficient clearance level for Admin Command Center.',
        });
      }
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
    }

    next();
  };
};

const requirePermission = (...permissionNames) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.accepts('html')) {
        return res.redirect('/auth/login?error=Please log in with admin privileges.&redirect=' + encodeURIComponent(req.originalUrl));
      }
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const userPerms = req.user.permissions || [];
    const hasAny = permissionNames.some((p) => userPerms.includes(p));

    if (!hasAny) {
      if (req.accepts('html')) {
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
  requirePermission,
};
