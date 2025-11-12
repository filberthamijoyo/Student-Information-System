import { PrismaClient, Role, Semester, GradeStatus, StudentStatus, DegreeType, ChargeType, ApplicationType, ApplicationStatus, AnnouncementType, Priority, EventCategory, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // ============================================================================
  // 1. CREATE USERS (Students, Instructors, Admins)
  // ============================================================================
  console.log('📝 Creating users...');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { userIdentifier: 'admin001' },
    update: {},
    create: {
      userIdentifier: 'admin001',
      email: 'admin@link.cuhk.edu.cn',
      passwordHash: hashedPassword,
      fullName: 'System Administrator',
      role: Role.ADMINISTRATOR,
    },
  });

  // Create 3 instructors
  const instructor1 = await prisma.user.upsert({
    where: { userIdentifier: 'inst001' },
    update: {},
    create: {
      userIdentifier: 'inst001',
      email: 'john.smith@cuhk.edu.cn',
      passwordHash: hashedPassword,
      fullName: 'Prof. John Smith',
      role: Role.INSTRUCTOR,
      department: 'School of Data Science',
    },
  });

  const instructor2 = await prisma.user.upsert({
    where: { userIdentifier: 'inst002' },
    update: {},
    create: {
      userIdentifier: 'inst002',
      email: 'mary.zhang@cuhk.edu.cn',
      passwordHash: hashedPassword,
      fullName: 'Prof. Mary Zhang',
      role: Role.INSTRUCTOR,
      department: 'School of Data Science',
    },
  });

  const instructor3 = await prisma.user.upsert({
    where: { userIdentifier: 'inst003' },
    update: {},
    create: {
      userIdentifier: 'inst003',
      email: 'david.chen@cuhk.edu.cn',
      passwordHash: hashedPassword,
      fullName: 'Dr. David Chen',
      role: Role.INSTRUCTOR,
      department: 'School of Science and Engineering',
    },
  });

  // Create 10 students
  const studentUsers = await Promise.all([
    prisma.user.upsert({
      where: { userIdentifier: '120090001' },
      update: {},
      create: {
        userIdentifier: '120090001',
        email: 'alice.wang@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Alice Wang',
        role: Role.STUDENT,
        major: 'Computer Science',
        yearLevel: 3,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090002' },
      update: {},
      create: {
        userIdentifier: '120090002',
        email: 'bob.liu@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Bob Liu',
        role: Role.STUDENT,
        major: 'Data Science',
        yearLevel: 2,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090003' },
      update: {},
      create: {
        userIdentifier: '120090003',
        email: 'carol.zhou@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Carol Zhou',
        role: Role.STUDENT,
        major: 'Computer Science',
        yearLevel: 4,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090004' },
      update: {},
      create: {
        userIdentifier: '120090004',
        email: 'david.li@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'David Li',
        role: Role.STUDENT,
        major: 'Electronic Engineering',
        yearLevel: 3,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090005' },
      update: {},
      create: {
        userIdentifier: '120090005',
        email: 'emily.xu@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Emily Xu',
        role: Role.STUDENT,
        major: 'Mathematics',
        yearLevel: 2,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090006' },
      update: {},
      create: {
        userIdentifier: '120090006',
        email: 'frank.sun@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Frank Sun',
        role: Role.STUDENT,
        major: 'Computer Science',
        yearLevel: 1,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090007' },
      update: {},
      create: {
        userIdentifier: '120090007',
        email: 'grace.wu@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Grace Wu',
        role: Role.STUDENT,
        major: 'Data Science',
        yearLevel: 3,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090008' },
      update: {},
      create: {
        userIdentifier: '120090008',
        email: 'henry.huang@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Henry Huang',
        role: Role.STUDENT,
        major: 'Electronic Engineering',
        yearLevel: 4,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090009' },
      update: {},
      create: {
        userIdentifier: '120090009',
        email: 'iris.lin@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Iris Lin',
        role: Role.STUDENT,
        major: 'Mathematics',
        yearLevel: 2,
      },
    }),
    prisma.user.upsert({
      where: { userIdentifier: '120090010' },
      update: {},
      create: {
        userIdentifier: '120090010',
        email: 'jack.zhao@link.cuhk.edu.cn',
        passwordHash: hashedPassword,
        fullName: 'Jack Zhao',
        role: Role.STUDENT,
        major: 'Computer Science',
        yearLevel: 3,
      },
    }),
  ]);

  console.log('✅ Created 13 users (10 students, 3 instructors, 1 admin)');

  // ============================================================================
  // 2. CREATE MAJORS & REQUIREMENTS
  // ============================================================================
  console.log('📚 Creating majors and requirements...');

  const csMajor = await prisma.major.upsert({
    where: { code: 'CS' },
    update: {},
    create: {
      code: 'CS',
      name: 'Computer Science',
      department: 'School of Data Science',
      degree: DegreeType.BS,
      totalCredits: 120,
      description: 'The Computer Science program provides comprehensive training in computational thinking, programming, and software development.',
    },
  });

  const dsMajor = await prisma.major.upsert({
    where: { code: 'DS' },
    update: {},
    create: {
      code: 'DS',
      name: 'Data Science',
      department: 'School of Data Science',
      degree: DegreeType.BS,
      totalCredits: 120,
      description: 'The Data Science program combines statistics, computer science, and domain knowledge to extract insights from data.',
    },
  });

  const eeMajor = await prisma.major.upsert({
    where: { code: 'EE' },
    update: {},
    create: {
      code: 'EE',
      name: 'Electronic Engineering',
      department: 'School of Science and Engineering',
      degree: DegreeType.BS,
      totalCredits: 120,
      description: 'The Electronic Engineering program covers circuits, signals, systems, and modern electronics.',
    },
  });

  const mathMajor = await prisma.major.upsert({
    where: { code: 'MATH' },
    update: {},
    create: {
      code: 'MATH',
      name: 'Mathematics',
      department: 'School of Science and Engineering',
      degree: DegreeType.BS,
      totalCredits: 120,
      description: 'The Mathematics program provides a rigorous foundation in pure and applied mathematics.',
    },
  });

  // Create requirements for CS major
  await prisma.requirement.createMany({
    data: [
      {
        majorId: csMajor.id,
        category: 'Core Courses',
        name: 'Programming Fundamentals',
        credits: 18,
        courses: ['CSC1001', 'CSC1002', 'CSC3100', 'CSC3170', 'CSC4001', 'CSC4005'],
        description: 'Core programming and computer science courses',
      },
      {
        majorId: csMajor.id,
        category: 'Elective Courses',
        name: 'CS Electives',
        credits: 15,
        courses: ['DDA3020', 'CSC3050', 'CSC4160', 'CSC4180'],
        description: 'Choose 5 courses from approved electives',
      },
      {
        majorId: csMajor.id,
        category: 'General Education',
        name: 'General Education',
        credits: 30,
        courses: [],
        description: 'University-wide general education requirements',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 4 majors with requirements');

  // ============================================================================
  // 3. CREATE STUDENT RECORDS
  // ============================================================================
  console.log('👨‍🎓 Creating student records...');

  const students = await Promise.all([
    prisma.student.upsert({
      where: { userId: studentUsers[0].id },
      update: {},
      create: {
        userId: studentUsers[0].id,
        studentId: '120090001',
        majorId: csMajor.id,
        advisorId: instructor1.id,
        year: 3,
        expectedGrad: new Date('2026-06-01'),
        admissionDate: new Date('2022-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[1].id },
      update: {},
      create: {
        userId: studentUsers[1].id,
        studentId: '120090002',
        majorId: dsMajor.id,
        advisorId: instructor2.id,
        year: 2,
        expectedGrad: new Date('2027-06-01'),
        admissionDate: new Date('2023-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[2].id },
      update: {},
      create: {
        userId: studentUsers[2].id,
        studentId: '120090003',
        majorId: csMajor.id,
        advisorId: instructor1.id,
        year: 4,
        expectedGrad: new Date('2025-06-01'),
        admissionDate: new Date('2021-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[3].id },
      update: {},
      create: {
        userId: studentUsers[3].id,
        studentId: '120090004',
        majorId: eeMajor.id,
        advisorId: instructor3.id,
        year: 3,
        expectedGrad: new Date('2026-06-01'),
        admissionDate: new Date('2022-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[4].id },
      update: {},
      create: {
        userId: studentUsers[4].id,
        studentId: '120090005',
        majorId: mathMajor.id,
        advisorId: instructor3.id,
        year: 2,
        expectedGrad: new Date('2027-06-01'),
        admissionDate: new Date('2023-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[5].id },
      update: {},
      create: {
        userId: studentUsers[5].id,
        studentId: '120090006',
        majorId: csMajor.id,
        advisorId: instructor1.id,
        year: 1,
        expectedGrad: new Date('2028-06-01'),
        admissionDate: new Date('2024-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[6].id },
      update: {},
      create: {
        userId: studentUsers[6].id,
        studentId: '120090007',
        majorId: dsMajor.id,
        advisorId: instructor2.id,
        year: 3,
        expectedGrad: new Date('2026-06-01'),
        admissionDate: new Date('2022-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[7].id },
      update: {},
      create: {
        userId: studentUsers[7].id,
        studentId: '120090008',
        majorId: eeMajor.id,
        advisorId: instructor3.id,
        year: 4,
        expectedGrad: new Date('2025-06-01'),
        admissionDate: new Date('2021-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[8].id },
      update: {},
      create: {
        userId: studentUsers[8].id,
        studentId: '120090009',
        majorId: mathMajor.id,
        advisorId: instructor3.id,
        year: 2,
        expectedGrad: new Date('2027-06-01'),
        admissionDate: new Date('2023-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.upsert({
      where: { userId: studentUsers[9].id },
      update: {},
      create: {
        userId: studentUsers[9].id,
        studentId: '120090010',
        majorId: csMajor.id,
        advisorId: instructor1.id,
        year: 3,
        expectedGrad: new Date('2026-06-01'),
        admissionDate: new Date('2022-09-01'),
        status: StudentStatus.ACTIVE,
      },
    }),
  ]);

  console.log('✅ Created 10 student records');

  // ============================================================================
  // 4. CREATE PERSONAL INFO
  // ============================================================================
  console.log('📇 Creating personal information...');

  await Promise.all(
    studentUsers.map((user, index) =>
      prisma.personalInfo.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          phoneNumber: `+86 138 0000 ${String(index + 1).padStart(4, '0')}`,
          permanentAddress: `Room ${index + 1}01, Building ${index + 1}, Daoyuan, CUHK-Shenzhen`,
          city: 'Shenzhen',
          state: 'Guangdong',
          postalCode: '518172',
          country: 'China',
          emergencyName: `${user.fullName.split(' ')[0]} Parent`,
          emergencyRelation: 'Parent',
          emergencyPhone: `+86 138 0000 ${String(index + 100).padStart(4, '0')}`,
          emergencyEmail: `parent${index + 1}@example.com`,
          dateOfBirth: new Date(2002 + Math.floor(index / 3), index % 12, 15),
          gender: index % 2 === 0 ? 'Female' : 'Male',
          nationality: 'Chinese',
          idNumber: `44030020020515${String(index).padStart(4, '0')}`,
        },
      })
    )
  );

  console.log('✅ Created personal info for 10 students');

  // ============================================================================
  // 5. CREATE FACULTY RECORDS
  // ============================================================================
  console.log('👨‍🏫 Creating faculty records...');

  await prisma.faculty.upsert({
    where: { userId: instructor1.id },
    update: {},
    create: {
      userId: instructor1.id,
      employeeId: 'INST001',
      title: 'Associate Professor',
      department: 'School of Data Science',
      office: 'Daoyuan Building, Room 301',
      officeHours: [
        { day: 'MONDAY', startTime: '14:00', endTime: '16:00' },
        { day: 'WEDNESDAY', startTime: '14:00', endTime: '16:00' },
      ],
      researchAreas: ['Database Systems', 'Data Mining', 'Big Data'],
      bio: 'Prof. Smith specializes in database systems and has published over 50 papers in top-tier conferences.',
    },
  });

  await prisma.faculty.upsert({
    where: { userId: instructor2.id },
    update: {},
    create: {
      userId: instructor2.id,
      employeeId: 'INST002',
      title: 'Professor',
      department: 'School of Data Science',
      office: 'Daoyuan Building, Room 305',
      officeHours: [
        { day: 'TUESDAY', startTime: '10:00', endTime: '12:00' },
        { day: 'THURSDAY', startTime: '10:00', endTime: '12:00' },
      ],
      researchAreas: ['Machine Learning', 'Artificial Intelligence', 'Deep Learning'],
      bio: 'Prof. Zhang is an expert in machine learning with extensive industry experience.',
    },
  });

  await prisma.faculty.upsert({
    where: { userId: instructor3.id },
    update: {},
    create: {
      userId: instructor3.id,
      employeeId: 'INST003',
      title: 'Assistant Professor',
      department: 'School of Science and Engineering',
      office: 'Zhicheng Building, Room 201',
      officeHours: [
        { day: 'MONDAY', startTime: '15:00', endTime: '17:00' },
        { day: 'FRIDAY', startTime: '15:00', endTime: '17:00' },
      ],
      researchAreas: ['Signal Processing', 'Communications', 'Electronics'],
      bio: 'Dr. Chen focuses on signal processing and wireless communications.',
    },
  });

  console.log('✅ Created 3 faculty records');

  // ============================================================================
  // 6. CREATE COURSES
  // ============================================================================
  console.log('📖 Creating courses...');

  const course1 = await prisma.course.upsert({
    where: { courseCode: 'CSC3170' },
    update: {},
    create: {
      courseCode: 'CSC3170',
      courseName: 'Database Systems',
      department: 'SDS',
      credits: 3,
      maxCapacity: 80,
      instructorId: instructor1.id,
      description: 'Introduction to database systems, SQL, and database design.',
      semester: Semester.FALL,
      year: 2024,
      timeSlots: {
        create: [
          {
            dayOfWeek: 'MONDAY',
            startTime: '10:00',
            endTime: '11:50',
            location: 'TD301',
          },
          {
            dayOfWeek: 'WEDNESDAY',
            startTime: '10:00',
            endTime: '11:50',
            location: 'TD301',
          },
        ],
      },
    },
    include: { timeSlots: true },
  });

  const course2 = await prisma.course.upsert({
    where: { courseCode: 'DDA3020' },
    update: {},
    create: {
      courseCode: 'DDA3020',
      courseName: 'Machine Learning',
      department: 'SDS',
      credits: 3,
      maxCapacity: 60,
      instructorId: instructor2.id,
      description: 'Introduction to machine learning algorithms and applications.',
      prerequisites: 'CSC1001, STA2001',
      semester: Semester.FALL,
      year: 2024,
      timeSlots: {
        create: [
          {
            dayOfWeek: 'TUESDAY',
            startTime: '14:00',
            endTime: '15:50',
            location: 'TD201',
          },
          {
            dayOfWeek: 'THURSDAY',
            startTime: '14:00',
            endTime: '15:50',
            location: 'TD201',
          },
        ],
      },
    },
    include: { timeSlots: true },
  });

  const course3 = await prisma.course.upsert({
    where: { courseCode: 'CSC1001' },
    update: {},
    create: {
      courseCode: 'CSC1001',
      courseName: 'Introduction to Computer Science',
      department: 'SDS',
      credits: 3,
      maxCapacity: 120,
      instructorId: instructor1.id,
      description: 'Introduction to programming using Python.',
      semester: Semester.FALL,
      year: 2024,
      timeSlots: {
        create: [
          {
            dayOfWeek: 'MONDAY',
            startTime: '14:00',
            endTime: '15:50',
            location: 'TD101',
          },
          {
            dayOfWeek: 'WEDNESDAY',
            startTime: '14:00',
            endTime: '15:50',
            location: 'TD101',
          },
        ],
      },
    },
    include: { timeSlots: true },
  });

  const course4 = await prisma.course.upsert({
    where: { courseCode: 'CSC3100' },
    update: {},
    create: {
      courseCode: 'CSC3100',
      courseName: 'Data Structures',
      department: 'SDS',
      credits: 3,
      maxCapacity: 100,
      instructorId: instructor1.id,
      description: 'Fundamental data structures and algorithms.',
      prerequisites: 'CSC1001',
      semester: Semester.SPRING,
      year: 2024,
      timeSlots: {
        create: [
          {
            dayOfWeek: 'TUESDAY',
            startTime: '10:00',
            endTime: '11:50',
            location: 'TD302',
          },
          {
            dayOfWeek: 'THURSDAY',
            startTime: '10:00',
            endTime: '11:50',
            location: 'TD302',
          },
        ],
      },
    },
    include: { timeSlots: true },
  });

  const course5 = await prisma.course.upsert({
    where: { courseCode: 'ELE2301' },
    update: {},
    create: {
      courseCode: 'ELE2301',
      courseName: 'Signals and Systems',
      department: 'SSE',
      credits: 3,
      maxCapacity: 70,
      instructorId: instructor3.id,
      description: 'Introduction to signals and linear systems.',
      semester: Semester.FALL,
      year: 2024,
      timeSlots: {
        create: [
          {
            dayOfWeek: 'MONDAY',
            startTime: '16:00',
            endTime: '17:50',
            location: 'ZC201',
          },
          {
            dayOfWeek: 'WEDNESDAY',
            startTime: '16:00',
            endTime: '17:50',
            location: 'ZC201',
          },
        ],
      },
    },
    include: { timeSlots: true },
  });

  console.log('✅ Created 5 courses');

  // ============================================================================
  // 7. CREATE ENROLLMENTS & GRADES
  // ============================================================================
  console.log('📝 Creating enrollments and grades...');

  // Student 1 (Alice) enrollments in past term with grades
  const enrollment1 = await prisma.enrollment.create({
    data: {
      userId: studentUsers[0].id,
      courseId: course4.id, // CSC3100 - Spring 2024
      status: 'CONFIRMED',
      enrolledAt: new Date('2024-01-15'),
    },
  });

  await prisma.grade.create({
    data: {
      enrollmentId: enrollment1.id,
      letterGrade: 'A',
      numericGrade: 92,
      gradePoints: 4.0,
      status: GradeStatus.PUBLISHED,
      submittedBy: instructor1.id,
      submittedAt: new Date('2024-05-20'),
      approvedBy: admin.id,
      approvedAt: new Date('2024-05-21'),
    },
  });

  // Student 1 current enrollments (Fall 2024)
  const enrollment2 = await prisma.enrollment.create({
    data: {
      userId: studentUsers[0].id,
      courseId: course1.id, // CSC3170
      status: 'CONFIRMED',
      enrolledAt: new Date('2024-08-20'),
    },
  });

  await prisma.grade.create({
    data: {
      enrollmentId: enrollment2.id,
      status: GradeStatus.IN_PROGRESS,
    },
  });

  const enrollment3 = await prisma.enrollment.create({
    data: {
      userId: studentUsers[0].id,
      courseId: course2.id, // DDA3020
      status: 'CONFIRMED',
      enrolledAt: new Date('2024-08-20'),
    },
  });

  await prisma.grade.create({
    data: {
      enrollmentId: enrollment3.id,
      status: GradeStatus.IN_PROGRESS,
    },
  });

  // Student 2 (Bob) enrollments
  const enrollment4 = await prisma.enrollment.create({
    data: {
      userId: studentUsers[1].id,
      courseId: course1.id,
      status: 'CONFIRMED',
      enrolledAt: new Date('2024-08-20'),
    },
  });

  await prisma.grade.create({
    data: {
      enrollmentId: enrollment4.id,
      status: GradeStatus.IN_PROGRESS,
    },
  });

  // Student 3 (Carol) - senior with more courses
  const enrollment5 = await prisma.enrollment.create({
    data: {
      userId: studentUsers[2].id,
      courseId: course4.id,
      status: 'CONFIRMED',
      enrolledAt: new Date('2024-01-15'),
    },
  });

  await prisma.grade.create({
    data: {
      enrollmentId: enrollment5.id,
      letterGrade: 'A-',
      numericGrade: 88,
      gradePoints: 3.7,
      status: GradeStatus.PUBLISHED,
      submittedBy: instructor1.id,
      submittedAt: new Date('2024-05-20'),
    },
  });

  console.log('✅ Created sample enrollments and grades');

  // ============================================================================
  // 8. CREATE TRANSCRIPTS
  // ============================================================================
  console.log('📜 Creating transcripts...');

  await prisma.transcript.create({
    data: {
      userId: studentUsers[0].id,
      semester: Semester.SPRING,
      year: 2024,
      gpa: 3.85,
      termGPA: 3.85,
      totalCredits: 60,
      earnedCredits: 60,
      qualityPoints: 231,
      academicStanding: 'Good Standing',
    },
  });

  await prisma.transcript.create({
    data: {
      userId: studentUsers[2].id,
      semester: Semester.SPRING,
      year: 2024,
      gpa: 3.7,
      termGPA: 3.7,
      totalCredits: 90,
      earnedCredits: 90,
      qualityPoints: 333,
      academicStanding: 'Good Standing',
    },
  });

  console.log('✅ Created transcripts');

  // ============================================================================
  // 9. CREATE FINANCIAL ACCOUNTS & CHARGES
  // ============================================================================
  console.log('💰 Creating financial accounts...');

  for (let i = 0; i < studentUsers.length; i++) {
    const account = await prisma.financialAccount.create({
      data: {
        userId: studentUsers[i].id,
        balance: -30000,
        tuitionDue: 25000,
        housingDue: 5000,
      },
    });

    // Create tuition charge
    await prisma.charge.create({
      data: {
        accountId: account.id,
        semester: Semester.FALL,
        year: 2024,
        type: ChargeType.TUITION,
        description: 'Fall 2024 Tuition',
        amount: 25000,
        dueDate: new Date('2024-08-31'),
        isPaid: false,
      },
    });

    // Create housing charge
    await prisma.charge.create({
      data: {
        accountId: account.id,
        semester: Semester.FALL,
        year: 2024,
        type: ChargeType.HOUSING,
        description: 'Fall 2024 Housing',
        amount: 5000,
        dueDate: new Date('2024-08-31'),
        isPaid: false,
      },
    });
  }

  console.log('✅ Created financial accounts with charges');

  // ============================================================================
  // 10. CREATE APPLICATIONS
  // ============================================================================
  console.log('📋 Creating sample applications...');

  await prisma.application.create({
    data: {
      userId: studentUsers[0].id,
      type: ApplicationType.OVERLOAD_REQUEST,
      semester: Semester.FALL,
      year: 2024,
      status: ApplicationStatus.PENDING,
      reason: 'I would like to take an additional course to complete my degree requirements early.',
      requestedDate: new Date('2024-08-15'),
    },
  });

  await prisma.application.create({
    data: {
      userId: studentUsers[1].id,
      type: ApplicationType.MAJOR_CHANGE,
      semester: Semester.SPRING,
      year: 2025,
      status: ApplicationStatus.UNDER_REVIEW,
      reason: 'I have developed a strong interest in Computer Science and would like to change my major.',
      requestedDate: new Date('2024-10-01'),
      reviewedBy: admin.id,
      reviewedAt: new Date('2024-10-05'),
    },
  });

  console.log('✅ Created sample applications');

  // ============================================================================
  // 11. CREATE ANNOUNCEMENTS
  // ============================================================================
  console.log('📢 Creating announcements...');

  await prisma.announcement.create({
    data: {
      title: 'Fall 2024 Add/Drop Period',
      content: 'The add/drop period for Fall 2024 semester runs from August 20 to August 27. Please ensure you finalize your course selection before the deadline.',
      type: AnnouncementType.ACADEMIC,
      priority: Priority.HIGH,
      targetAudience: ['STUDENT'],
      publishDate: new Date('2024-08-15'),
      expiryDate: new Date('2024-08-28'),
      createdBy: admin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Campus WiFi Maintenance',
      content: 'Campus WiFi will undergo scheduled maintenance this Saturday from 2:00 AM to 6:00 AM. Internet services may be intermittent during this period.',
      type: AnnouncementType.ADMINISTRATIVE,
      priority: Priority.NORMAL,
      targetAudience: ['ALL'],
      publishDate: new Date(),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: admin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Library Extended Hours During Finals',
      content: 'The library will extend operating hours during the final examination period. Open 24/7 from December 10-20.',
      type: AnnouncementType.ACADEMIC,
      priority: Priority.NORMAL,
      targetAudience: ['STUDENT'],
      publishDate: new Date(),
      createdBy: admin.id,
    },
  });

  console.log('✅ Created announcements');

  // ============================================================================
  // 12. CREATE EVENTS
  // ============================================================================
  console.log('📅 Creating events...');

  await prisma.event.create({
    data: {
      title: 'Career Fair 2024',
      description: 'Annual career fair featuring 50+ companies from various industries. Great networking opportunity for students seeking internships and full-time positions.',
      location: 'Student Activity Center',
      startTime: new Date('2024-11-20T09:00:00'),
      endTime: new Date('2024-11-20T17:00:00'),
      category: EventCategory.CAREER,
      organizer: 'Career Development Office',
      capacity: 500,
      isPublic: true,
    },
  });

  await prisma.event.create({
    data: {
      title: 'AI Workshop: Introduction to Deep Learning',
      description: 'Hands-on workshop covering deep learning fundamentals using PyTorch. Bring your laptop!',
      location: 'TD Building, Room 401',
      startTime: new Date('2024-11-15T14:00:00'),
      endTime: new Date('2024-11-15T17:00:00'),
      category: EventCategory.WORKSHOP,
      organizer: 'School of Data Science',
      capacity: 50,
      isPublic: true,
    },
  });

  await prisma.event.create({
    data: {
      title: 'International Cultural Night',
      description: 'Celebrate diversity! Enjoy performances, food, and traditions from around the world.',
      location: 'Outdoor Amphitheater',
      startTime: new Date('2024-11-25T18:00:00'),
      endTime: new Date('2024-11-25T21:00:00'),
      category: EventCategory.CULTURAL,
      organizer: 'Student Affairs Office',
      capacity: 300,
      isPublic: true,
    },
  });

  console.log('✅ Created events');

  // ============================================================================
  // 13. CREATE COURSE MATERIALS
  // ============================================================================
  console.log('📚 Creating course materials...');

  await prisma.courseMaterial.create({
    data: {
      courseId: course1.id,
      title: 'CSC3170 Syllabus',
      description: 'Fall 2024 course syllabus and schedule',
      type: 'SYLLABUS',
      fileUrl: '/materials/csc3170-syllabus.pdf',
      fileName: 'csc3170-syllabus.pdf',
      fileSize: 245678,
      uploadedBy: instructor1.id,
      isVisible: true,
    },
  });

  await prisma.courseMaterial.create({
    data: {
      courseId: course1.id,
      title: 'Week 1: Introduction to Databases',
      description: 'Lecture slides covering database fundamentals',
      type: 'LECTURE_NOTES',
      fileUrl: '/materials/csc3170-week1.pdf',
      fileName: 'csc3170-week1.pdf',
      fileSize: 1234567,
      uploadedBy: instructor1.id,
      isVisible: true,
    },
  });

  await prisma.courseMaterial.create({
    data: {
      courseId: course2.id,
      title: 'DDA3020 Syllabus',
      description: 'Machine Learning course outline and grading policy',
      type: 'SYLLABUS',
      fileUrl: '/materials/dda3020-syllabus.pdf',
      fileName: 'dda3020-syllabus.pdf',
      fileSize: 198765,
      uploadedBy: instructor2.id,
      isVisible: true,
    },
  });

  console.log('✅ Created course materials');

  // ============================================================================
  // 14. CREATE ATTENDANCE RECORDS
  // ============================================================================
  console.log('✅ Creating attendance records...');

  // Sample attendance for enrollment2 (Alice in CSC3170)
  await prisma.attendance.create({
    data: {
      enrollmentId: enrollment2.id,
      date: new Date('2024-09-02'),
      status: AttendanceStatus.PRESENT,
      markedBy: instructor1.id,
    },
  });

  await prisma.attendance.create({
    data: {
      enrollmentId: enrollment2.id,
      date: new Date('2024-09-04'),
      status: AttendanceStatus.PRESENT,
      markedBy: instructor1.id,
    },
  });

  console.log('✅ Created attendance records');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n🎉 ============================================');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('🎉 ============================================\n');

  console.log('📊 Summary:');
  console.log('  ✅ 13 Users (10 students, 3 instructors, 1 admin)');
  console.log('  ✅ 4 Majors with requirements');
  console.log('  ✅ 10 Student records');
  console.log('  ✅ 10 Personal info records');
  console.log('  ✅ 3 Faculty records');
  console.log('  ✅ 5 Courses with time slots');
  console.log('  ✅ Sample enrollments with grades');
  console.log('  ✅ 2 Transcripts');
  console.log('  ✅ 10 Financial accounts with charges');
  console.log('  ✅ 2 Sample applications');
  console.log('  ✅ 3 Announcements');
  console.log('  ✅ 3 Events');
  console.log('  ✅ 3 Course materials');
  console.log('  ✅ Sample attendance records\n');

  console.log('🔑 Demo Credentials:');
  console.log('  Student:    120090001 / Password123!');
  console.log('  Student:    120090002 / Password123!');
  console.log('  Instructor: inst001 / Password123!');
  console.log('  Instructor: inst002 / Password123!');
  console.log('  Admin:      admin001 / Password123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
