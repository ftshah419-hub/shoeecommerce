const app = require('./app');
const config = require('./config/config');
const { seedDatabase } = require('./config/db');

const startServer = async () => {
  try {
    // Initialize & seed the database
    await seedDatabase();

    // Start Express HTTP listener
    app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`👟 NELEERI SNEAKERS PLATFORM RUNNING`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🛡️  Admin Account: ${config.adminSeed.email}`);
      console.log(`🔑 Admin Password: ${config.adminSeed.password}`);
      console.log(`👤 Customer Demo:  john@example.com / UserSecure123!`);
      console.log(`⚙️  Environment:   ${config.nodeEnv}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

startServer();
