import { PrismaClient, UserRole, AssignmentStatus, EnrollmentStatus, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.session.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.class.deleteMany();
  await prisma.file.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create Schools
  const school1 = await prisma.school.create({
    data: {
      name: 'Lincoln High School',
      code: 'LHS001',
      domain: 'lincoln.edu',
      email: 'admin@lincoln.edu',
      phone: '+1-555-0100',
      address: '123 Education Street, Springfield, IL',
      description: 'A premier public high school focused on academic excellence',
    },
  });

  const school2 = await prisma.school.create({
    data: {
      name: 'Washington Middle School',
      code: 'WMS001',
      domain: 'washington.edu',
      email: 'admin@washington.edu',
      phone: '+1-555-0200',
      address: '456 Learning Avenue, Seattle, WA',
      description: 'Building tomorrow\'s leaders through innovative education',
    },
  });

  console.log('✅ Created schools');

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@smzedu.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
    },
  });

  // Create School Admins
  const schoolAdmin1 = await prisma.user.create({
    data: {
      email: 'principal@lincoln.edu',
      password: hashedPassword,
      name: 'Dr. Sarah Johnson',
      role: UserRole.SCHOOL_ADMIN,
      schoolId: school1.id,
      isActive: true,
      isVerified: true,
    },
  });

  const schoolAdmin2 = await prisma.user.create({
    data: {
      email: 'principal@washington.edu',
      password: hashedPassword,
      name: 'Mr. Robert Davis',
      role: UserRole.SCHOOL_ADMIN,
      schoolId: school2.id,
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ Created admins');

  // Create Teachers for School 1
  const teacher1 = await prisma.user.create({
    data: {
      email: 'john.smith@lincoln.edu',
      password: hashedPassword,
      name: 'Mr. John Smith',
      role: UserRole.TEACHER,
      schoolId: school1.id,
      isActive: true,
      isVerified: true,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'emily.williams@lincoln.edu',
      password: hashedPassword,
      name: 'Ms. Emily Williams',
      role: UserRole.TEACHER,
      schoolId: school1.id,
      isActive: true,
      isVerified: true,
    },
  });

  // Create Teachers for School 2
  const teacher3 = await prisma.user.create({
    data: {
      email: 'michael.brown@washington.edu',
      password: hashedPassword,
      name: 'Mr. Michael Brown',
      role: UserRole.TEACHER,
      schoolId: school2.id,
      isActive: true,
      isVerified: true,
    },
  });

  const teacher4 = await prisma.user.create({
    data: {
      email: 'lisa.anderson@washington.edu',
      password: hashedPassword,
      name: 'Ms. Lisa Anderson',
      role: UserRole.TEACHER,
      schoolId: school2.id,
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ Created teachers');

  // Create Students for School 1
  const students1 = [];
  const studentNames1 = [
    'Alice Thompson', 'Bob Martinez', 'Carol White', 'David Lee', 'Eva Garcia',
    'Frank Robinson', 'Grace Kim', 'Henry Wilson', 'Ivy Chen', 'Jack Taylor'
  ];

  for (let i = 0; i < studentNames1.length; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i + 1}@lincoln.edu`,
        password: hashedPassword,
        name: studentNames1[i],
        role: UserRole.STUDENT,
        schoolId: school1.id,
        isActive: true,
        isVerified: true,
      },
    });
    students1.push(student);
  }

  // Create Students for School 2
  const students2 = [];
  const studentNames2 = [
    'Karen Moore', 'Leo Jackson', 'Mia Harris', 'Noah Clark', 'Olivia Lewis',
    'Peter Walker', 'Quinn Hall', 'Rachel Young', 'Sam King', 'Tina Wright'
  ];

  for (let i = 0; i < studentNames2.length; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i + 1}@washington.edu`,
        password: hashedPassword,
        name: studentNames2[i],
        role: UserRole.STUDENT,
        schoolId: school2.id,
        isActive: true,
        isVerified: true,
      },
    });
    students2.push(student);
  }

  console.log('✅ Created students');

  // Create Classes for School 1
  const class1 = await prisma.class.create({
    data: {
      name: 'Introduction to Mathematics',
      code: 'MATH01',
      description: 'Learn the fundamentals of algebra, geometry, and problem-solving',
      subject: 'Mathematics',
      gradeLevel: '9th Grade',
      academicYear: '2024-2025',
      room: 'Room 101',
      color: '#3B82F6',
      teacherId: teacher1.id,
      schoolId: school1.id,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: 'English Literature',
      code: 'ENG101',
      description: 'Explore classic and contemporary literature from around the world',
      subject: 'English',
      gradeLevel: '9th Grade',
      academicYear: '2024-2025',
      room: 'Room 203',
      color: '#10B981',
      teacherId: teacher2.id,
      schoolId: school1.id,
    },
  });

  const class3 = await prisma.class.create({
    data: {
      name: 'Physical Science',
      code: 'SCI201',
      description: 'Introduction to physics and chemistry concepts',
      subject: 'Science',
      gradeLevel: '10th Grade',
      academicYear: '2024-2025',
      room: 'Lab 301',
      color: '#8B5CF6',
      teacherId: teacher1.id,
      schoolId: school1.id,
    },
  });

  // Create Classes for School 2
  const class4 = await prisma.class.create({
    data: {
      name: 'World History',
      code: 'HIST01',
      description: 'Journey through major historical events and civilizations',
      subject: 'History',
      gradeLevel: '7th Grade',
      academicYear: '2024-2025',
      room: 'Room 105',
      color: '#F59E0B',
      teacherId: teacher3.id,
      schoolId: school2.id,
    },
  });

  const class5 = await prisma.class.create({
    data: {
      name: 'Computer Science Fundamentals',
      code: 'COMP01',
      description: 'Learn programming basics and computational thinking',
      subject: 'Computer Science',
      gradeLevel: '8th Grade',
      academicYear: '2024-2025',
      room: 'Computer Lab',
      color: '#EC4899',
      teacherId: teacher4.id,
      schoolId: school2.id,
    },
  });

  const class6 = await prisma.class.create({
    data: {
      name: 'Art and Design',
      code: 'ART101',
      description: 'Express creativity through various art forms and techniques',
      subject: 'Art',
      gradeLevel: '7th Grade',
      academicYear: '2024-2025',
      room: 'Art Studio',
      color: '#06B6D4',
      teacherId: teacher3.id,
      schoolId: school2.id,
    },
  });

  console.log('✅ Created classes');

  // Enroll Students in Classes (School 1)
  for (const student of students1) {
    // Enroll in Math
    await prisma.enrollment.create({
      data: {
        classId: class1.id,
        studentId: student.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    // Enroll in English (first 8 students)
    if (students1.indexOf(student) < 8) {
      await prisma.enrollment.create({
        data: {
          classId: class2.id,
          studentId: student.id,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    }

    // Enroll in Science (last 7 students)
    if (students1.indexOf(student) >= 3) {
      await prisma.enrollment.create({
        data: {
          classId: class3.id,
          studentId: student.id,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    }
  }

  // Enroll Students in Classes (School 2)
  for (const student of students2) {
    await prisma.enrollment.create({
      data: {
        classId: class4.id,
        studentId: student.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (students2.indexOf(student) < 6) {
      await prisma.enrollment.create({
        data: {
          classId: class5.id,
          studentId: student.id,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    }

    if (students2.indexOf(student) >= 4) {
      await prisma.enrollment.create({
        data: {
          classId: class6.id,
          studentId: student.id,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    }
  }

  console.log('✅ Enrolled students');

  // Create Assignments
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const assignment1 = await prisma.assignment.create({
    data: {
      classId: class1.id,
      title: 'Algebra Fundamentals Quiz',
      description: 'Complete the quiz on basic algebraic expressions and equations.',
      instructions: 'Show all your work. Partial credit will be given for correct methodology.',
      assignmentType: 'QUIZ',
      points: 50,
      dueDate: nextWeek,
      status: AssignmentStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      classId: class1.id,
      title: 'Geometry Problem Set',
      description: 'Solve the geometry problems from Chapter 5.',
      assignmentType: 'HOMEWORK',
      points: 100,
      dueDate: tomorrow,
      status: AssignmentStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      classId: class2.id,
      title: 'Essay: The Great Gatsby',
      description: 'Write a 500-word essay analyzing the themes in The Great Gatsby.',
      instructions: 'Use MLA format. Include at least 3 quotes from the text.',
      assignmentType: 'ESSAY',
      points: 100,
      dueDate: nextWeek,
      status: AssignmentStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  const assignment4 = await prisma.assignment.create({
    data: {
      classId: class4.id,
      title: 'Ancient Civilizations Project',
      description: 'Research and present on an ancient civilization of your choice.',
      assignmentType: 'PROJECT',
      points: 150,
      dueDate: nextWeek,
      status: AssignmentStatus.PUBLISHED,
      publishedAt: now,
    },
  });

  const assignment5 = await prisma.assignment.create({
    data: {
      classId: class5.id,
      title: 'Python Basics Exercise',
      description: 'Complete the Python programming exercises.',
      assignmentType: 'HOMEWORK',
      points: 75,
      dueDate: lastWeek,
      status: AssignmentStatus.CLOSED,
      publishedAt: lastWeek,
    },
  });

  console.log('✅ Created assignments');

  // Create Submissions
  const submission1 = await prisma.submission.create({
    data: {
      assignmentId: assignment5.id,
      studentId: students2[0].id,
      content: 'I completed all the Python exercises. Here are my solutions:\n\n1. print("Hello, World!")\n2. def add(a, b): return a + b\n3. for i in range(10): print(i)',
      status: 'GRADED',
    },
  });

  const submission2 = await prisma.submission.create({
    data: {
      assignmentId: assignment5.id,
      studentId: students2[1].id,
      content: 'Here are my answers to the programming exercises. I enjoyed learning about loops!',
      status: 'GRADED',
    },
  });

  const submission3 = await prisma.submission.create({
    data: {
      assignmentId: assignment2.id,
      studentId: students1[0].id,
      content: 'Problem 1: x = 5\nProblem 2: The area is 25 square units\nProblem 3: The perimeter is 20 units',
      status: 'SUBMITTED',
    },
  });

  console.log('✅ Created submissions');

  // Create Grades
  await prisma.grade.create({
    data: {
      submissionId: submission1.id,
      assignmentId: assignment5.id,
      studentId: students2[0].id,
      score: 70,
      maxScore: 75,
      percentage: 93.33,
      feedback: 'Excellent work! Your solutions are correct and well-structured.',
      gradedBy: teacher4.id,
    },
  });

  await prisma.grade.create({
    data: {
      submissionId: submission2.id,
      assignmentId: assignment5.id,
      studentId: students2[1].id,
      score: 65,
      maxScore: 75,
      percentage: 86.67,
      feedback: 'Good effort! Minor errors in problem 3. Keep practicing!',
      gradedBy: teacher4.id,
    },
  });

  console.log('✅ Created grades');

  // Create Attendance Records
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const student of students1.slice(0, 5)) {
    await prisma.attendance.create({
      data: {
        classId: class1.id,
        studentId: student.id,
        date: today,
        status: AttendanceStatus.PRESENT,
        recordedBy: teacher1.id,
      },
    });
  }

  await prisma.attendance.create({
    data: {
      classId: class1.id,
      studentId: students1[5].id,
      date: today,
      status: AttendanceStatus.ABSENT,
      notes: 'Sick leave',
      recordedBy: teacher1.id,
    },
  });

  await prisma.attendance.create({
    data: {
      classId: class1.id,
      studentId: students1[6].id,
      date: today,
      status: AttendanceStatus.LATE,
      notes: 'Arrived 15 minutes late',
      recordedBy: teacher1.id,
    },
  });

  console.log('✅ Created attendance records');

  // Create Announcements
  await prisma.announcement.create({
    data: {
      classId: class1.id,
      authorId: teacher1.id,
      title: 'Welcome to Mathematics Class!',
      content: 'Welcome everyone to our math class this semester. We will be covering algebra, geometry, and statistics. Please come prepared with your textbooks and calculators.',
      priority: 1,
      pinned: true,
    },
  });

  await prisma.announcement.create({
    data: {
      classId: class1.id,
      authorId: teacher1.id,
      title: 'Quiz Reminder',
      content: 'Don\'t forget about the algebra quiz next week. Review chapters 1-3.',
      priority: 0,
    },
  });

  await prisma.announcement.create({
    data: {
      classId: class2.id,
      authorId: teacher2.id,
      title: 'Book Club Meeting',
      content: 'Join us for the book club meeting this Friday after school in Room 203. We\'ll be discussing The Great Gatsby.',
      priority: 0,
    },
  });

  console.log('✅ Created announcements');

  // Create Schedules
  const schedules = [
    { day: 1, start: '08:00', end: '09:30', classId: class1.id, room: 'Room 101' },
    { day: 1, start: '10:00', end: '11:30', classId: class2.id, room: 'Room 203' },
    { day: 2, start: '08:00', end: '09:30', classId: class3.id, room: 'Lab 301' },
    { day: 2, start: '10:00', end: '11:30', classId: class1.id, room: 'Room 101' },
    { day: 3, start: '08:00', end: '09:30', classId: class2.id, room: 'Room 203' },
    { day: 3, start: '10:00', end: '11:30', classId: class3.id, room: 'Lab 301' },
    { day: 4, start: '08:00', end: '09:30', classId: class1.id, room: 'Room 101' },
    { day: 4, start: '10:00', end: '11:30', classId: class2.id, room: 'Room 203' },
    { day: 5, start: '08:00', end: '09:30', classId: class3.id, room: 'Lab 301' },
  ];

  for (const schedule of schedules) {
    await prisma.schedule.create({
      data: {
        classId: schedule.classId,
        dayOfWeek: schedule.day,
        startTime: schedule.start,
        endTime: schedule.end,
        room: schedule.room,
      },
    });
  }

  console.log('✅ Created schedules');

  // Create sample messages
  await prisma.message.create({
    data: {
      senderId: students1[0].id,
      receiverId: teacher1.id,
      subject: 'Question about homework',
      content: 'Hi Mr. Smith, I have a question about problem 5 in the homework. Can you explain the steps again?',
    },
  });

  await prisma.message.create({
    data: {
      senderId: teacher1.id,
      receiverId: students1[0].id,
      subject: 'Re: Question about homework',
      content: 'Hi Alice! Of course. In problem 5, you need to first isolate the variable. Let me know if you need more help.',
    },
  });

  console.log('✅ Created messages');

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: students1[0].id,
      type: 'ASSIGNMENT',
      title: 'New Assignment',
      message: 'Geometry Problem Set has been posted',
      link: '#/assignments',
    },
  });

  await prisma.notification.create({
    data: {
      userId: students1[0].id,
      type: 'GRADE',
      title: 'Assignment Graded',
      message: 'Your Algebra Quiz has been graded',
      link: '#/grades',
    },
  });

  console.log('✅ Created notifications');
  console.log('\n🎉 Seeding completed successfully!\n');

  console.log('📋 Test Accounts:');
  console.log('   Super Admin: admin@smzedu.com / password123');
  console.log('   School Admin: principal@lincoln.edu / password123');
  console.log('   Teacher: john.smith@lincoln.edu / password123');
  console.log('   Student: student1@lincoln.edu / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
