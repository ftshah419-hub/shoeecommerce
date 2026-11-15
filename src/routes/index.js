const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const apiAuthRoutes = require('./apiAuthRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');

// Mount Sub-routers
router.use('/auth', authRoutes);
router.use('/api/auth', apiAuthRoutes);
router.use('/admin', adminRoutes);
router.use('/', userRoutes);

module.exports = router;
