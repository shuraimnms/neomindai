// ============================================
// Seed Sample Data Script
// Run: node scripts/seed-sample-data.js
// ============================================

require('dotenv').config({ path: '../.env' });
const User = require('../src/models/User');
const Video = require('../src/models/Video');
const Assignment = require('../src/models/Assignment');
const Question = require('../src/models/Question');
const Option = require('../src/models/Option');
const AssignmentRecipient = require('../src/models/AssignmentRecipient');
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

const sampleAssignments = [
  {
    title: 'Physics Quiz - Basic Concepts',
    description: 'Test your understanding of fundamental physics concepts',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    is_active: true,
    questions: [
      {
        question_text: 'What is the SI unit of force?',
        question_type: 'multiple_choice',
        correct_answer: 'Newton',
        points: 1,
        options: [
          { option_text: 'Joule', is_correct: false },
          { option_text: 'Newton', is_correct: true },
          { option_text: 'Watt', is_correct: false },
          { option_text: 'Pascal', is_correct: false }
        ]
      },
      {
        question_text: 'Explain Newton\'s First Law of Motion.',
        question_type: 'text',
        correct_answer: 'An object at rest stays at rest, and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.',
        points: 2,
        options: []
      },
      {
        question_text: 'Which of the following is a vector quantity?',
        question_type: 'multiple_choice',
        correct_answer: 'Velocity',
        points: 1,
        options: [
          { option_text: 'Mass', is_correct: false },
          { option_text: 'Temperature', is_correct: false },
          { option_text: 'Velocity', is_correct: true },
          { option_text: 'Time', is_correct: false }
        ]
      }
    ]
  },
  {
    title: 'Mathematics Assessment',
    description: 'Basic algebra and geometry problems',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    is_active: true,
    questions: [
      {
        question_text: 'Solve for x: 2x + 3 = 7',
        question_type: 'text',
        correct_answer: 'x = 2',
        points: 1,
        options: []
      },
      {
        question_text: 'What is the area of a circle with radius 5 units?',
        question_type: 'multiple_choice',
        correct_answer: '25π square units',
        points: 2,
        options: [
          { option_text: '10π square units', is_correct: false },
          { option_text: '25 square units', is_correct: false },
          { option_text: '25π square units', is_correct: true },
          { option_text: '5π square units', is_correct: false }
        ]
      }
    ]
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

    // Create sample assignments
    console.log('\n📝 Creating sample assignments...');
    const assignmentCount = await Assignment.count();
    if (assignmentCount === 0) {
      // Get all students to assign assignments to
      const students = await User.findAll({ where: { role: 'student' } });
      const studentIds = students.map(s => s.id);

      for (const assignmentData of sampleAssignments) {
        const assignment = await Assignment.create({
          title: assignmentData.title,
          description: assignmentData.description,
          due_date: assignmentData.due_date,
          is_active: assignmentData.is_active
        });

        // Create questions and options
        for (const q of assignmentData.questions) {
          const question = await Question.create({
            assignment_id: assignment.id,
            question_text: q.question_text,
            question_type: q.question_type,
            correct_answer: q.correct_answer,
            points: q.points
          });

          // Create options for multiple choice questions
          for (const opt of q.options) {
            await Option.create({
              question_id: question.id,
              option_text: opt.option_text,
              is_correct: opt.is_correct
            });
          }
        }

        // Assign to all students
        for (const studentId of studentIds) {
          await AssignmentRecipient.create({
            assignment_id: assignment.id,
            student_id: studentId
          });
        }

        console.log(`   Created: ${assignmentData.title}`);
      }
    } else {
      console.log(`   Assignments already exist (${assignmentCount} assignments)`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Sample data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Students: ${sampleStudents.length} added`);
    console.log(`   Videos: ${sampleVideos.length} added`);
    console.log(`   Assignments: ${sampleAssignments.length} added`);
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