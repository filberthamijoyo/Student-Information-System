import { PrismaClient, Role, Semester, CourseStatus, EnrollmentStatus, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Comprehensive seed data for CUHK Course Selection System
 * Includes real courses, users, time slots, and sample enrollments
 */

async function main() {
  console.log('🌱 Starting seed process...\n');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing data\n');

  // ============================================================================
  // USERS
  // ============================================================================

  console.log('👥 Creating users...');

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // Administrators
  const admins = await Promise.all([
    prisma.user.create({
      data: {
        userIdentifier: 'admin001',
        email: 'admin001@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Dr. Chen Wei',
        role: Role.ADMINISTRATOR,
        department: 'Academic Affairs'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'admin002',
        email: 'admin002@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Prof. Li Xiaoming',
        role: Role.ADMINISTRATOR,
        department: 'Registrar Office'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'admin003',
        email: 'admin003@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Dr. Wang Hui',
        role: Role.ADMINISTRATOR,
        department: 'Student Services'
      }
    })
  ]);
  console.log(`✅ Created ${admins.length} administrators`);

  // Instructors
  const instructors = await Promise.all([
    prisma.user.create({
      data: {
        userIdentifier: 'inst001',
        email: 'machenhao@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Prof. MA Chenhao',
        role: Role.INSTRUCTOR,
        department: 'Computer Science'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst002',
        email: 'zhang.lei@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Prof. ZHANG Lei',
        role: Role.INSTRUCTOR,
        department: 'Computer Science'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst003',
        email: 'liu.ming@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Dr. LIU Ming',
        role: Role.INSTRUCTOR,
        department: 'Data Science'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst004',
        email: 'chen.yang@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Prof. CHEN Yang',
        role: Role.INSTRUCTOR,
        department: 'Economics'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst005',
        email: 'wang.fang@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Dr. WANG Fang',
        role: Role.INSTRUCTOR,
        department: 'Finance'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst006',
        email: 'zhang.qiang@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Prof. ZHANG Qiang',
        role: Role.INSTRUCTOR,
        department: 'Management'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst007',
        email: 'li.na@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Dr. LI Na',
        role: Role.INSTRUCTOR,
        department: 'Mathematics'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst008',
        email: 'huang.tao@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Prof. HUANG Tao',
        role: Role.INSTRUCTOR,
        department: 'Statistics'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst009',
        email: 'wu.jian@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Dr. WU Jian',
        role: Role.INSTRUCTOR,
        department: 'English'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'inst010',
        email: 'zhao.hua@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Prof. ZHAO Hua',
        role: Role.INSTRUCTOR,
        department: 'Physics'
      }
    })
  ]);
  console.log(`✅ Created ${instructors.length} instructors`);

  // Students
  const students = [];
  const majors = ['Computer Science', 'Data Science', 'Economics', 'Finance', 'Management', 'Mathematics'];
  const yearLevels = [1, 2, 3, 4];

  for (let i = 1; i <= 50; i++) {
    const studentId = `120090${i.toString().padStart(3, '0')}`;
    const student = await prisma.user.create({
      data: {
        userIdentifier: studentId,
        email: `${studentId}@link.cuhk.edu.cn`,
        passwordHash: defaultPassword,
        fullName: `Student ${i}`,
        role: Role.STUDENT,
        major: majors[Math.floor(Math.random() * majors.length)],
        yearLevel: yearLevels[Math.floor(Math.random() * yearLevels.length)]
      }
    });
    students.push(student);
  }
  console.log(`✅ Created ${students.length} students\n`);

  // ============================================================================
  // COURSES
  // ============================================================================

  console.log('📚 Creating courses...');

  const courses = await Promise.all([
    // Computer Science Courses
    prisma.course.create({
      data: {
        courseCode: 'CSC3170',
        courseName: 'Database System',
        department: 'Computer Science',
        credits: 3,
        maxCapacity: 170,
        description: 'Introduction to database management systems including data models, query languages, transaction processing, and database design.',
        prerequisites: 'CSC1001, CSC1002',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[0].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'CSC3001',
        courseName: 'Software Engineering',
        department: 'Computer Science',
        credits: 3,
        maxCapacity: 120,
        description: 'Principles and practices of software engineering including requirements analysis, design patterns, testing, and project management.',
        prerequisites: 'CSC1002',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[1].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'CSC3002',
        courseName: 'Data Structures',
        department: 'Computer Science',
        credits: 3,
        maxCapacity: 150,
        description: 'Advanced data structures including trees, graphs, hash tables, and algorithm analysis.',
        prerequisites: 'CSC1002',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[0].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'CSC4001',
        courseName: 'Computer Networks',
        department: 'Computer Science',
        credits: 3,
        maxCapacity: 100,
        description: 'Principles of computer networks including protocols, network architecture, and security.',
        prerequisites: 'CSC3002',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[1].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'CSC4020',
        courseName: 'Artificial Intelligence',
        department: 'Computer Science',
        credits: 3,
        maxCapacity: 80,
        description: 'Introduction to artificial intelligence including search algorithms, knowledge representation, and machine learning basics.',
        prerequisites: 'CSC3002, MAT2040',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[0].id
      }
    }),

    // Data Science Courses
    prisma.course.create({
      data: {
        courseCode: 'DDA3020',
        courseName: 'Machine Learning',
        department: 'Data Science',
        credits: 3,
        maxCapacity: 150,
        description: 'Comprehensive introduction to machine learning algorithms including supervised and unsupervised learning.',
        prerequisites: 'MAT2040, STA2001',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[2].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'DDA3005',
        courseName: 'Big Data Analytics',
        department: 'Data Science',
        credits: 3,
        maxCapacity: 100,
        description: 'Techniques and tools for analyzing large-scale datasets including Hadoop, Spark, and distributed computing.',
        prerequisites: 'DDA2020',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[2].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'DDA4210',
        courseName: 'Deep Learning',
        department: 'Data Science',
        credits: 3,
        maxCapacity: 80,
        description: 'Advanced topics in deep learning including CNNs, RNNs, transformers, and applications.',
        prerequisites: 'DDA3020',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[2].id
      }
    }),

    // Economics Courses
    prisma.course.create({
      data: {
        courseCode: 'ECO2011',
        courseName: 'Basic Microeconomics',
        department: 'Economics',
        credits: 3,
        maxCapacity: 200,
        description: 'Fundamental principles of microeconomics including supply and demand, consumer theory, and market structures.',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[3].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'ECO2012',
        courseName: 'Basic Macroeconomics',
        department: 'Economics',
        credits: 3,
        maxCapacity: 200,
        description: 'Introduction to macroeconomics covering national income, inflation, unemployment, and monetary policy.',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[3].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'ECO3121',
        courseName: 'Intermediate Microeconomics',
        department: 'Economics',
        credits: 3,
        maxCapacity: 120,
        description: 'Advanced microeconomic theory including game theory, market failure, and welfare economics.',
        prerequisites: 'ECO2011',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[3].id
      }
    }),

    // Finance Courses
    prisma.course.create({
      data: {
        courseCode: 'FIN2010',
        courseName: 'Financial Management',
        department: 'Finance',
        credits: 3,
        maxCapacity: 150,
        description: 'Fundamentals of corporate finance including capital budgeting, cost of capital, and financial analysis.',
        prerequisites: 'ACC1001',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[4].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'FIN3010',
        courseName: 'Investment Analysis',
        department: 'Finance',
        credits: 3,
        maxCapacity: 120,
        description: 'Analysis of investment vehicles including stocks, bonds, and derivatives.',
        prerequisites: 'FIN2010',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[4].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'FIN4020',
        courseName: 'Derivatives and Risk Management',
        department: 'Finance',
        credits: 3,
        maxCapacity: 80,
        description: 'Advanced topics in derivatives pricing and risk management strategies.',
        prerequisites: 'FIN3010, STA2001',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[4].id
      }
    }),

    // Management Courses
    prisma.course.create({
      data: {
        courseCode: 'MGT2020',
        courseName: 'Principles of Management',
        department: 'Management',
        credits: 3,
        maxCapacity: 180,
        description: 'Introduction to management concepts including planning, organizing, leading, and controlling.',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[5].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'MGT3010',
        courseName: 'Organizational Behavior',
        department: 'Management',
        credits: 3,
        maxCapacity: 120,
        description: 'Study of human behavior in organizations including motivation, leadership, and team dynamics.',
        prerequisites: 'MGT2020',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[5].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'MGT4030',
        courseName: 'Strategic Management',
        department: 'Management',
        credits: 3,
        maxCapacity: 100,
        description: 'Corporate strategy formulation and implementation, competitive advantage, and business models.',
        prerequisites: 'MGT3010',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[5].id
      }
    }),

    // Mathematics Courses
    prisma.course.create({
      data: {
        courseCode: 'MAT1002',
        courseName: 'Calculus I',
        department: 'Mathematics',
        credits: 4,
        maxCapacity: 200,
        description: 'Differential and integral calculus of functions of one variable.',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[6].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'MAT2040',
        courseName: 'Linear Algebra',
        department: 'Mathematics',
        credits: 3,
        maxCapacity: 150,
        description: 'Vector spaces, linear transformations, matrices, eigenvalues and eigenvectors.',
        prerequisites: 'MAT1002',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[6].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'MAT3007',
        courseName: 'Probability Theory',
        department: 'Mathematics',
        credits: 3,
        maxCapacity: 100,
        description: 'Mathematical foundations of probability including random variables and distributions.',
        prerequisites: 'MAT2040',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[6].id
      }
    }),

    // Statistics Courses
    prisma.course.create({
      data: {
        courseCode: 'STA2001',
        courseName: 'Introduction to Statistics',
        department: 'Statistics',
        credits: 3,
        maxCapacity: 180,
        description: 'Basic statistical concepts, descriptive statistics, probability, and inferential statistics.',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[7].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'STA3001',
        courseName: 'Statistical Learning',
        department: 'Statistics',
        credits: 3,
        maxCapacity: 120,
        description: 'Modern statistical learning methods including regression, classification, and resampling.',
        prerequisites: 'STA2001, MAT2040',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[7].id
      }
    }),

    // General Education
    prisma.course.create({
      data: {
        courseCode: 'ENG2020',
        courseName: 'Academic Writing',
        department: 'English',
        credits: 3,
        maxCapacity: 30,
        description: 'Advanced writing skills for academic purposes including research papers and presentations.',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[8].id
      }
    }),
    prisma.course.create({
      data: {
        courseCode: 'PHY1001',
        courseName: 'General Physics I',
        department: 'Physics',
        credits: 4,
        maxCapacity: 150,
        description: 'Mechanics, thermodynamics, and waves.',
        semester: Semester.FALL,
        year: 2025,
        status: CourseStatus.ACTIVE,
        instructorId: instructors[9].id
      }
    })
  ]);
  console.log(`✅ Created ${courses.length} courses\n`);

  // ============================================================================
  // TIME SLOTS
  // ============================================================================

  console.log('🕐 Creating time slots...');

  const timeSlotData = [
    // CSC3170 - Database System (MW 9:00-10:30)
    { courseId: courses[0].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '10:30', location: 'TB301' },
    { courseId: courses[0].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '10:30', location: 'TB301' },

    // CSC3001 - Software Engineering (TuTh 14:00-15:30)
    { courseId: courses[1].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '14:00', endTime: '15:30', location: 'TB302' },
    { courseId: courses[1].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '14:00', endTime: '15:30', location: 'TB302' },

    // CSC3002 - Data Structures (MW 14:00-15:30)
    { courseId: courses[2].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '14:00', endTime: '15:30', location: 'TB303' },
    { courseId: courses[2].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '14:00', endTime: '15:30', location: 'TB303' },

    // CSC4001 - Computer Networks (TuTh 10:30-12:00)
    { courseId: courses[3].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '10:30', endTime: '12:00', location: 'TB304' },
    { courseId: courses[3].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '10:30', endTime: '12:00', location: 'TB304' },

    // CSC4020 - AI (MW 16:00-17:30)
    { courseId: courses[4].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '16:00', endTime: '17:30', location: 'TB305' },
    { courseId: courses[4].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '16:00', endTime: '17:30', location: 'TB305' },

    // DDA3020 - Machine Learning (TuTh 16:00-17:30)
    { courseId: courses[5].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '16:00', endTime: '17:30', location: 'LH101' },
    { courseId: courses[5].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '16:00', endTime: '17:30', location: 'LH101' },

    // DDA3005 - Big Data (MW 10:30-12:00)
    { courseId: courses[6].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '10:30', endTime: '12:00', location: 'LH102' },
    { courseId: courses[6].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '10:30', endTime: '12:00', location: 'LH102' },

    // DDA4210 - Deep Learning (F 14:00-17:00)
    { courseId: courses[7].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: '14:00', endTime: '17:00', location: 'LH103' },

    // ECO2011 - Microeconomics (TuTh 09:00-10:30)
    { courseId: courses[8].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00', endTime: '10:30', location: 'LH201' },
    { courseId: courses[8].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00', endTime: '10:30', location: 'LH201' },

    // ECO2012 - Macroeconomics (MW 09:00-10:30)
    { courseId: courses[9].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '10:30', location: 'LH202' },
    { courseId: courses[9].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '10:30', location: 'LH202' },

    // Add more time slots for remaining courses
    { courseId: courses[10].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '14:00', endTime: '15:30', location: 'LH203' },
    { courseId: courses[10].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '14:00', endTime: '15:30', location: 'LH203' },

    { courseId: courses[11].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '14:00', endTime: '15:30', location: 'SB101' },
    { courseId: courses[11].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '14:00', endTime: '15:30', location: 'SB101' },

    { courseId: courses[12].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '10:30', endTime: '12:00', location: 'SB102' },
    { courseId: courses[12].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '10:30', endTime: '12:00', location: 'SB102' },

    { courseId: courses[13].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '16:00', endTime: '17:30', location: 'SB103' },
    { courseId: courses[13].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '16:00', endTime: '17:30', location: 'SB103' },

    { courseId: courses[14].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00', endTime: '10:30', location: 'SB104' },
    { courseId: courses[14].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00', endTime: '10:30', location: 'SB104' },

    { courseId: courses[15].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '10:30', endTime: '12:00', location: 'SB201' },
    { courseId: courses[15].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '10:30', endTime: '12:00', location: 'SB201' },

    { courseId: courses[16].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '14:00', endTime: '15:30', location: 'SB202' },
    { courseId: courses[16].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '14:00', endTime: '15:30', location: 'SB202' },

    { courseId: courses[17].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '10:30', location: 'DB101' },
    { courseId: courses[17].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '10:30', location: 'DB101' },
    { courseId: courses[17].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:00', endTime: '10:00', location: 'DB101' },

    { courseId: courses[18].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '10:30', endTime: '12:00', location: 'DB102' },
    { courseId: courses[18].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '10:30', endTime: '12:00', location: 'DB102' },

    { courseId: courses[19].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '14:00', endTime: '15:30', location: 'DB103' },
    { courseId: courses[19].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '14:00', endTime: '15:30', location: 'DB103' },

    { courseId: courses[20].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '16:00', endTime: '17:30', location: 'DB104' },
    { courseId: courses[20].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '16:00', endTime: '17:30', location: 'DB104' },

    { courseId: courses[21].id, dayOfWeek: DayOfWeek.MONDAY, startTime: '10:30', endTime: '12:00', location: 'DB201' },
    { courseId: courses[21].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '10:30', endTime: '12:00', location: 'DB201' },

    { courseId: courses[22].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:00', endTime: '12:00', location: 'LH301' },

    { courseId: courses[23].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00', endTime: '10:30', location: 'SCI101' },
    { courseId: courses[23].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00', endTime: '10:30', location: 'SCI101' },
    { courseId: courses[23].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: '14:00', endTime: '16:00', location: 'SCI-LAB1' },
  ];

  await prisma.timeSlot.createMany({ data: timeSlotData });
  console.log(`✅ Created ${timeSlotData.length} time slots\n`);

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================

  console.log('📝 Creating sample enrollments...');

  const enrollmentData = [];

  // Create confirmed enrollments for first 20 students
  for (let i = 0; i < 20; i++) {
    enrollmentData.push({
      userId: students[i].id,
      courseId: courses[i % courses.length].id,
      status: EnrollmentStatus.CONFIRMED
    });
  }

  // Create pending enrollments for next 3 students
  for (let i = 20; i < 23; i++) {
    enrollmentData.push({
      userId: students[i].id,
      courseId: courses[0].id, // All trying for CSC3170
      status: EnrollmentStatus.PENDING
    });
  }

  // Create waitlisted enrollments for next 5 students
  for (let i = 23; i < 28; i++) {
    enrollmentData.push({
      userId: students[i].id,
      courseId: courses[5].id, // DDA3020 - Machine Learning
      status: EnrollmentStatus.WAITLISTED,
      waitlistPosition: i - 22
    });
  }

  await prisma.enrollment.createMany({ data: enrollmentData });

  // Update course enrollment counts
  for (const course of courses) {
    const confirmedCount = await prisma.enrollment.count({
      where: { courseId: course.id, status: EnrollmentStatus.CONFIRMED }
    });
    await prisma.course.update({
      where: { id: course.id },
      data: { currentEnrollment: confirmedCount }
    });
  }

  console.log(`✅ Created ${enrollmentData.length} enrollments\n`);

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  console.log('📋 Creating audit logs...');

  const auditLogs = [];
  for (let i = 0; i < 10; i++) {
    auditLogs.push({
      userId: students[i].id,
      action: 'ENROLL',
      entityType: 'enrollment',
      entityId: i + 1,
      changes: {
        courseId: courses[i % courses.length].id,
        status: 'CONFIRMED'
      }
    });
  }

  await prisma.auditLog.createMany({ data: auditLogs });
  console.log(`✅ Created ${auditLogs.length} audit logs\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('═'.repeat(60));
  console.log('✅ SEED COMPLETED SUCCESSFULLY');
  console.log('═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   • Users: ${admins.length + instructors.length + students.length}`);
  console.log(`     - Administrators: ${admins.length}`);
  console.log(`     - Instructors: ${instructors.length}`);
  console.log(`     - Students: ${students.length}`);
  console.log(`   • Courses: ${courses.length}`);
  console.log(`   • Time Slots: ${timeSlotData.length}`);
  console.log(`   • Enrollments: ${enrollmentData.length}`);
  console.log(`   • Audit Logs: ${auditLogs.length}\n`);

  console.log('🔑 Default Login Credentials:');
  console.log('   • Admin: admin001 / Password123!');
  console.log('   • Instructor: inst001 / Password123!');
  console.log('   • Student: 120090001 / Password123!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
