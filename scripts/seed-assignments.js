// ============================================
// Seed Sample Assignments Script
// Run: node scripts/seed-assignments.js
// ============================================

require('dotenv').config({ path: '../.env' });
const User = require('../src/models/User');
const Assignment = require('../src/models/Assignment');
const Question = require('../src/models/Question');
const Option = require('../src/models/Option');
const AssignmentRecipient = require('../src/models/AssignmentRecipient');
const { testConnection } = require('../src/config/database');

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
        options: [
          { option_text: 'Newton', is_correct: true },
          { option_text: 'Joule', is_correct: false },
          { option_text: 'Watt', is_correct: false },
          { option_text: 'Pascal', is_correct: false }
        ]
      },
      {
        question_text: 'Explain Newton\'s First Law of Motion.',
        question_type: 'text',
        options: []
      }
    ]
  },
  {
    title: 'Mathematics Assessment',
    description: 'Basic mathematics problems covering algebra and geometry',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    is_active: true,
    questions: [
      {
        question_text: 'Solve for x: 2x + 3 = 7',
        question_type: 'multiple_choice',
        options: [
          { option_text: 'x = 2', is_correct: true },
          { option_text: 'x = 3', is_correct: false },
          { option_text: 'x = 4', is_correct: false },
          { option_text: 'x = 5', is_correct: false }
        ]
      },
      {
        question_text: 'What is the area of a circle with radius 5 units? (Use π = 3.14)',
        question_type: 'text',
        options: []
      }
    ]
  }
];

const seedAssignments = async () => {
  console.log('🌱 Seeding sample assignments...');
  console.log('='.repeat(50));

  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    // Get all students
    const students = await User.findAll({ where: { role: 'student' } });
    if (students.length === 0) {
      console.log('❌ No students found. Please run seed-sample-data.js first');
      process.exit(1);
    }

    console.log(`👨‍🎓 Found ${students.length} students`);

    // Create assignments
    for (const assignmentData of sampleAssignments) {
      console.log(`\n📝 Creating assignment: ${assignmentData.title}`);

      // Create assignment
      const assignment = await Assignment.create({
        title: assignmentData.title,
        description: assignmentData.description,
        due_date: assignmentData.due_date,
        is_active: assignmentData.is_active
      });

      console.log(`   Created assignment with ID: ${assignment.id}`);

      // Create questions
      for (const questionData of assignmentData.questions) {
        const question = await Question.create({
          assignment_id: assignment.id,
          question_text: questionData.question_text,
          question_type: questionData.question_type
        });

        console.log(`   Created question: ${question.question_text.substring(0, 50)}...`);

        // Create options if any
        for (const optionData of questionData.options) {
          await Option.create({
            question_id: question.id,
            option_text: optionData.option_text,
            is_correct: optionData.is_correct
          });
        }

        if (questionData.options.length > 0) {
          console.log(`   Created ${questionData.options.length} options`);
        }
      }

      // Assign to all students
      for (const student of students) {
        await AssignmentRecipient.create({
          assignment_id: assignment.id,
          student_id: student.id
        });
      }

      console.log(`   Assigned to ${students.length} students`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Sample assignments seeded successfully!');
    console.log(`   Created ${sampleAssignments.length} assignments`);
    console.log(`   Each assigned to ${students.length} students`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedAssignments();
}

module.exports = seedAssignments;
