const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateToken = (payload, customExpiresIn = null) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: customExpiresIn || config.jwtExpiresIn,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
