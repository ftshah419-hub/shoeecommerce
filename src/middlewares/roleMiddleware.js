const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.accepts('html')) {
        return res.redirect('/auth/login?error=Please log in to continue.');
      }
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      if (req.accepts('html')) {
        return res.status(403).render('error', {
          title: 'Access Denied',
          errorCode: 403,
          errorMessage: 'Access Forbidden: You do not possess the required permissions (Admin role needed).',
        });
      }
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
