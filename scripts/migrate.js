// Database migration script for production
require('dotenv').config({ path: '../.env.production' });
const { sequelize, syncDatabase } = require('../src/config/database');
const seedDatabase = require('../src/config/seed');

const migrate = async () => {
  console.log('🚀 Starting database migration...');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database (without force - doesn't drop tables)
    await syncDatabase(false);
    console.log('✅ Database tables synced');
    
    // Seed database (creates admin user)
    await seedDatabase();
    console.log('✅ Database seeded with initial data');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();