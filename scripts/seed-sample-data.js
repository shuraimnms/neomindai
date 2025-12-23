// ============================================
// Seed Sample Data Script
// Run: node scripts/seed-sample-data.js
// ============================================

require('dotenv').config({ path: '../.env' });
const User = require('../src/models/User');
const Video = require('../src/models/Video');
const { testConnection } = require('../src/config/database');

const sampleVideos = [
  {
    title: 'Introduction to Physics',
    description: 'Learn the basics of physics with real-world examples',
    video_url: 'https://www.youtube.com/watch?v=example1',
    thumbnail_url: 'https://img.youtube.com/vi/example1/maxresdefault.jpg',
    duration: '45:20'
  },
  {
    title: 'Mathematics for Beginners',
    description: 'Fundamental mathematics concepts explained simply',
    video_url: 'https://www.youtube.com/watch?v=example2',
    thumbnail_url: 'https://img.youtube.com/vi/example2/maxresdefault.jpg',
    duration: '38:15'
  },
  {
    title: 'Chemistry Basics',
    description: 'Understanding atoms, molecules, and chemical reactions',
    video_url: 'https://www.youtube.com/watch?v=example3',
    thumbnail_url: 'https://img.youtube.com/vi/example3/maxresdefault.jpg',
    duration: '52:10'
  },
  {
    title: 'Programming Fundamentals',
    description: 'Learn programming from scratch with Python',
    video_url: 'https://www.youtube.com/watch?v=example4',
    thumbnail_url: 'https://img.youtube.com/vi/example4/maxresdefault.jpg',
    duration: '1:15:30'
  },
  {
    title: 'Biology Essentials',
    description: 'Introduction to cell biology and genetics',
    video_url: 'https://www.youtube.com/watch?v=example5',
    thumbnail_url: 'https://img.youtube.com/vi/example5/maxresdefault.jpg',
    duration: '49:45'
  }
];

const sampleStudents = [
  {
    name: 'Alice Johnson',
    email: 'alice@student.com',
    password: 'password123',
    role: 'student'
  },
  {
    name: 'Bob Smith',
    email: 'bob@student.com',
    password: 'password123',
    role: 'student'
  },
  {
    name: 'Carol Davis',
    email: 'carol@student.com',
    password: 'password123',
    role: 'student'
  },
  {
    name: 'David Wilson',
    email: 'david@student.com',
    password: 'password123',
    role: 'student'
  }
];

const seedSampleData = async () => {
  console.log('🌱 Seeding sample data...');
  console.log('='.repeat(50));
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    // Create sample students
    console.log('\n👨‍🎓 Creating sample students...');
    for (const studentData of sampleStudents) {
      const exists = await User.findOne({ where: { email: studentData.email } });
      if (!exists) {
        await User.create(studentData);
        console.log(`   Created: ${studentData.name}`);
      } else {
        console.log(`   Exists: ${studentData.name}`);
      }
    }
    
    // Create sample videos
    console.log('\n🎥 Creating sample videos...');
    const videoCount = await Video.count();
    if (videoCount === 0) {
      for (const videoData of sampleVideos) {
        await Video.create(videoData);
        console.log(`   Created: ${videoData.title}`);
      }
    } else {
      console.log(`   Videos already exist (${videoCount} videos)`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Sample data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Students: ${sampleStudents.length} added`);
    console.log(`   Videos: ${sampleVideos.length} added`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedSampleData();
}

module.exports = seedSampleData;