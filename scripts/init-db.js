// ============================================
// Database Initialization Script
// Run: node scripts/init-db.js
// ============================================

require('dotenv').config({ path: '../.env' });
const { testConnection, syncDatabase, closeConnection } = require('../src/config/database');
const seedDatabase = require('../src/config/seed');

const initializeDatabase = async () => {
  console.log('='.repeat(50));
  console.log('🔧 Database Initialization Script');
  console.log('='.repeat(50));
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Database connection failed');
      console.log('💡 Please check:');
      console.log('   1. Is PostgreSQL running?');
      console.log('   2. Check .env file configuration');
      console.log('   3. Database credentials are correct');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    
    // Sync database
    console.log('🔄 Syncing database tables...');
    await syncDatabase(false); // Change to true to force recreate
    
    // Seed database
    console.log('🌱 Seeding database...');
    await seedDatabase();
    
    console.log('='.repeat(50));
    console.log('✅ Database initialization completed successfully!');
    console.log('='.repeat(50));
    
    await closeConnection();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Stack:', error.stack);
    await closeConnection();
    process.exit(1);
  }
};

// Run initialization
initializeDatabase();