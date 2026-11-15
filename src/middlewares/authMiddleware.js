const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Middleware to detect user from token and attach to req & res.locals for templates
const checkCurrentUser = async (req, res, next) => {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

  res.locals.currentUser = null;
  req.user = null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
        res.locals.currentUser = req.user;
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
