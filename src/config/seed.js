// ============================================
// Database Seeder - Creates Default Admin
// ============================================

require('dotenv').config();
const User = require('../models/User');
const { testConnection, syncDatabase } = require('./database');

const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot seed database without connection');
    process.exit(1);
  }
  
  // Sync database (create tables)
  await syncDatabase(false); // Set to true to force recreate
  
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: process.env.ADMIN_EMAIL || 'admin@academy.com' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Create default admin
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@academy.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      is_active: true
    });
    
    console.log('✅ Default admin created successfully:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('⚠️  IMPORTANT: Change this password immediately!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Database seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;