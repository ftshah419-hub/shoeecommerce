require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'neleeri_sneakers_secret_key_default',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'neleeri_cookie_secret',
  dbUri: process.env.DB_URI || 'mongodb://localhost:27017/neleeri_sneakers',
  adminSeed: {
    email: process.env.ADMIN_EMAIL || 'admin@neleerisneakers.com',
    password: process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!',
    name: process.env.ADMIN_NAME || 'Sneakers SuperAdmin',
  }
};
