import { PrismaClient, Role, Semester, CourseStatus, EnrollmentStatus, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Comprehensive seed data for CUHK Course Selection System
 * Using REAL CUHK course data from Fall 2025 catalog
 */

async function main() {
  console.log('🌱 Starting seed process with REAL CUHK course data...\n');

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
        fullName: 'System Admin',
        role: Role.ADMINISTRATOR,
        department: 'Academic Affairs'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'admin002',
        email: 'admin002@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Academic Admin',
        role: Role.ADMINISTRATOR,
        department: 'Registrar Office'
      }
    }),
    prisma.user.create({
      data: {
        userIdentifier: 'admin003',
        email: 'admin003@cuhk.edu.cn',
        passwordHash: defaultPassword,
        fullName: 'Technical Admin',
        role: Role.ADMINISTRATOR,
        department: 'IT Services'
      }
    })
  ]);
  console.log(`✅ Created ${admins.length} administrators`);

  // Real CUHK Instructors (extracted from course data)
  const instructorData = [
    { id: 'machenhao', name: 'MA Chenhao', dept: 'SDS' },
    { id: 'fanjicong', name: 'FAN Jicong', dept: 'SDS' },
    { id: 'litongxin', name: 'LI Tongxin', dept: 'SDS' },
    { id: 'fangyixiang', name: 'FANG Yixiang', dept: 'SDS' },
    { id: 'wangzicheng', name: 'WANG Zicheng', dept: 'SDS' },
    { id: 'chungbarick', name: 'CHUNG Barick', dept: 'SME' },
    { id: 'khoolawrence', name: 'KHOO Lawrence', dept: 'SME' },
    { id: 'lixiyue', name: 'LI Xiyue', dept: 'SME' },
    { id: 'panxinyue', name: 'PAN Xinyue', dept: 'SME' },
    { id: 'dichenchen', name: 'DI Chenchen', dept: 'SME' },
    { id: 'tsangwaipong', name: 'TSANG Waipong', dept: 'SME' },
    { id: 'wangxuefeng', name: 'WANG Xuefeng', dept: 'SSE' },
    { id: 'hedongdong', name: 'HE Dongdong', dept: 'SSE' },
    { id: 'linghan', name: 'LING Han', dept: 'SSE' },
    { id: 'zhuhe', name: 'ZHU He', dept: 'SSE' },
    { id: 'chentinghuan', name: 'CHEN Tinghuan', dept: 'SSE' },
    { id: 'chungyehching', name: 'CHUNG Yehching', dept: 'SDS' },
    { id: 'courcoubetisk', name: 'COURCOUBETIS Konstantinos', dept: 'SDS' },
    { id: 'liuzhen', name: 'LIU Zhen', dept: 'SDS' },
    { id: 'liming', name: 'LI Ming', dept: 'SME' },
    { id: 'chenjingxuan', name: 'CHEN Jingxuan', dept: 'SME' },
    { id: 'xiaofenglong', name: 'XIAO Fenglong', dept: 'SME' },
    { id: 'sujiang', name: 'SU Jiang', dept: 'SME' },
    { id: 'chiupengchia', name: 'CHIU Pengchia', dept: 'SME' },
    { id: 'lixiao', name: 'LI Xiao', dept: 'SSE' },
    { id: 'yaojianfeng', name: 'YAO Jianfeng', dept: 'SDS' },
    { id: 'huangrui', name: 'HUANG Rui', dept: 'SDS' },
    { id: 'yuminchen', name: 'YU Minchen', dept: 'SDS' },
    { id: 'zhoufan', name: 'ZHOU Fan', dept: 'SME' },
    { id: 'wangqin', name: 'WANG Qin', dept: 'HSS' },
    { id: 'zhangmiaosi', name: 'ZHANG Miaosi', dept: 'HSS' },
    { id: 'caoderong', name: 'CAO Derong', dept: 'HSS' },
    { id: 'linyongqian', name: 'LIN Yongqian', dept: 'HSS' },
    { id: 'duyang', name: 'DU Yang', dept: 'MED' },
    { id: 'stjepanovicg', name: 'STJEPANOVIC Goran', dept: 'MED' },
    { id: 'prabhusn', name: 'PRABHU Sumedha Nitin', dept: 'MED' },
    { id: 'zhaozheng', name: 'ZHAO Zheng', dept: 'SSE' },
    { id: 'punmanon', name: 'PUN Manon', dept: 'SSE' },
    { id: 'wangxing', name: 'WANG Xing', dept: 'SSE' },
    { id: 'wangdeliang', name: 'WANG Deliang', dept: 'SDS' },
    { id: 'liuguiliang', name: 'LIU Guiliang', dept: 'SDS' },
    { id: 'xiaosong', name: 'XIAO Song', dept: 'SME' },
    { id: 'linwei', name: 'LIN Wei', dept: 'SME' },
    { id: 'baozhuolan', name: 'BAO Zhuolan', dept: 'SME' },
    { id: 'chenyuan', name: 'CHEN Yuan', dept: 'SSE' },
    { id: 'hutianyang', name: 'HU Tianyang', dept: 'SDS' },
    { id: 'wangfangxin', name: 'WANG Fangxin', dept: 'SSE' },
    { id: 'chengguijuan', name: 'CHENG Guijuan', dept: 'MED' }
  ];

  const instructors = [];
  for (let i = 0; i < instructorData.length; i++) {
    const inst = instructorData[i];
    const instructor = await prisma.user.create({
      data: {
        userIdentifier: `inst${(i + 1).toString().padStart(3, '0')}`,
        email: `${inst.id}@cuhk.edu.cn`,
        passwordHash: defaultPassword,
        fullName: `Prof. ${inst.name}`,
        role: Role.INSTRUCTOR,
        department: inst.dept
      }
    });
    instructors.push(instructor);
  }
  console.log(`✅ Created ${instructors.length} instructors`);

  // Students
  const students = [];
  const majors = [
    'Computer Science', 'Data Science', 'Economics', 'Finance',
    'Management', 'Marketing', 'Mathematics', 'Physics', 'Chemistry', 'Biology'
  ];
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
  // REAL CUHK COURSES (Fall 2025)
  // ============================================================================

  console.log('📚 Creating REAL CUHK courses...');

  const realCourseData = [
    { code: 'CSC3170', name: 'Database System', dept: 'SDS', credits: 3, capacity: 170, desc: 'This course covers the fundamental concepts of database systems including data models, database design, SQL, transaction management, and database implementation.', prereq: 'CSC3100 or CSC3200', instructor: 'MA Chenhao' },
    { code: 'DDA3020', name: 'Machine Learning', dept: 'SDS', credits: 3, capacity: 260, desc: 'Introduction to machine learning algorithms and applications.', prereq: 'CSC1001 or CSC1003 or CSC1005; STA2001 or STA2003 or ECO2121', instructor: 'FAN Jicong' },
    { code: 'CSC1001', name: 'Introduction to Computer Science: Programming Methodology', dept: 'SDS', credits: 3, capacity: 950, desc: 'Introduction to programming using Python, covering fundamental programming concepts.', prereq: null, instructor: 'LI Tongxin' },
    { code: 'CSC3100', name: 'Data Structures', dept: 'SDS', credits: 3, capacity: 460, desc: 'Study of fundamental data structures and algorithms.', prereq: 'CSC1001 or CSC1003 or CSC1005', instructor: 'FANG Yixiang' },
    { code: 'STA2001', name: 'Probability and Statistics I', dept: 'SDS', credits: 3, capacity: 340, desc: 'Introduction to probability theory and statistical inference.', prereq: 'MAT1001 or MAT1003 or MAT1010 or MAT1011', instructor: 'WANG Zicheng' },
    { code: 'ECO2011', name: 'Basic Microeconomics', dept: 'SME', credits: 3, capacity: 900, desc: 'Fundamental principles of microeconomic analysis.', prereq: null, instructor: 'CHUNG Barick' },
    { code: 'ECO2021', name: 'Basic Macroeconomics', dept: 'SME', credits: 3, capacity: 595, desc: 'Fundamental principles of macroeconomic analysis.', prereq: 'ECO2011', instructor: 'KHOO Lawrence' },
    { code: 'FIN2010', name: 'Financial Management', dept: 'SME', credits: 3, capacity: 160, desc: 'Introduction to corporate finance and financial management.', prereq: null, instructor: 'LI Xiyue' },
    { code: 'MGT2020', name: 'Principles of Management', dept: 'SME', credits: 3, capacity: 180, desc: 'Fundamental concepts of management and organizational behavior.', prereq: null, instructor: 'PAN Xinyue' },
    { code: 'MKT2010', name: 'Marketing Management', dept: 'SME', credits: 3, capacity: 300, desc: 'Introduction to marketing principles and practices.', prereq: null, instructor: 'DI Chenchen' },
    { code: 'ACT2111', name: 'Introductory Financial Accounting', dept: 'SME', credits: 3, capacity: 585, desc: 'Fundamental principles of financial accounting.', prereq: null, instructor: 'TSANG Waipong' },
    { code: 'MAT1001', name: 'Calculus I', dept: 'SSE', credits: 3, capacity: 1395, desc: 'Differential and integral calculus of functions of one variable.', prereq: null, instructor: 'WANG Xuefeng' },
    { code: 'MAT2040', name: 'Linear Algebra', dept: 'SSE', credits: 3, capacity: 480, desc: 'Vector spaces, linear transformations, and matrix theory.', prereq: null, instructor: 'HE Dongdong' },
    { code: 'PHY1001', name: 'Mechanics', dept: 'SSE', credits: 3, capacity: 320, desc: 'Classical mechanics including kinematics, dynamics, and energy.', prereq: 'MAT1001 or MAT1010 or MAT1011', instructor: 'LING Han' },
    { code: 'CHM1001', name: 'General Chemistry', dept: 'SSE', credits: 3, capacity: 450, desc: 'Fundamental principles of chemistry.', prereq: null, instructor: 'ZHU He' },
    { code: 'ECE2050', name: 'Digital Logic and Systems', dept: 'SSE', credits: 3, capacity: 240, desc: 'Digital logic design and computer organization.', prereq: null, instructor: 'CHEN Tinghuan' },
    { code: 'CSC3150', name: 'Operating System', dept: 'SDS', credits: 3, capacity: 210, desc: 'Operating system concepts including processes, memory management, and file systems.', prereq: 'CSC3002 or CSC3200', instructor: 'CHUNG Yehching' },
    { code: 'CSC4120', name: 'Design and Analysis of Algorithms', dept: 'SDS', credits: 3, capacity: 150, desc: 'Algorithm design techniques and complexity analysis.', prereq: 'CSC3001 or CSC3100 or CSC3200', instructor: 'COURCOUBETIS Konstantinos' },
    { code: 'DDA4220', name: 'Deep Learning and Applications', dept: 'SDS', credits: 3, capacity: 130, desc: 'Deep learning architectures and applications.', prereq: 'CSC1001 or CSC1003; MAT2040; STA2001; DDA3020 or CSC4020', instructor: 'LIU Zhen' },
    { code: 'ECO3121', name: 'Introductory Econometrics', dept: 'SME', credits: 3, capacity: 400, desc: 'Statistical methods for economic analysis.', prereq: 'ECO2121 or STA2001 or STA2003', instructor: 'LI Ming' },
    { code: 'FIN3080', name: 'Investment Analysis and Portfolio Management', dept: 'SME', credits: 3, capacity: 200, desc: 'Investment principles and portfolio theory.', prereq: 'ECO3121; ECO2121 or STA2001', instructor: 'CHEN Jingxuan' },
    { code: 'MGT3210', name: 'Strategic Management', dept: 'SME', credits: 3, capacity: 120, desc: 'Strategic planning and competitive analysis.', prereq: 'MGT2020', instructor: 'XIAO Fenglong' },
    { code: 'MKT3020', name: 'Consumer Behavior', dept: 'SME', credits: 3, capacity: 130, desc: 'Psychological and sociological factors influencing consumer decisions.', prereq: 'MKT2010', instructor: 'SU Jiang' },
    { code: 'ACT3011', name: 'Intermediate Financial Accounting', dept: 'SME', credits: 3, capacity: 120, desc: 'Advanced topics in financial accounting.', prereq: 'ACT2111', instructor: 'CHIU Pengchia' },
    { code: 'MAT3007', name: 'Optimization', dept: 'SSE', credits: 3, capacity: 390, desc: 'Mathematical optimization methods and applications.', prereq: 'MAT1001 or MAT1003; MAT1002 or MAT1004', instructor: 'LI Xiao' },
    { code: 'STA4001', name: 'Stochastic Processes', dept: 'SDS', credits: 3, capacity: 260, desc: 'Theory and applications of stochastic processes.', prereq: 'MAT1002 or MAT1012; MAT2040; ECO2121 or STA2001', instructor: 'YAO Jianfeng' },
    { code: 'CSC3002', name: 'C/C++ Programming', dept: 'SDS', credits: 3, capacity: 150, desc: 'Advanced programming in C and C++.', prereq: 'CSC1001 or CSC1003 or CSC1005', instructor: 'HUANG Rui' },
    { code: 'CSC4160', name: 'Cloud Computing', dept: 'SDS', credits: 3, capacity: 70, desc: 'Cloud computing architectures and services.', prereq: null, instructor: 'YU Minchen' },
    { code: 'DMS2030', name: 'Operations Management', dept: 'SME', credits: 3, capacity: 110, desc: 'Production and operations management principles.', prereq: 'ECO2121 or STA2001 or STA2003', instructor: 'ZHOU Fan' },
    { code: 'GFH1000', name: 'In Dialogue with Humanity', dept: 'HSS', credits: 3, capacity: 763, desc: 'Interdisciplinary exploration of human civilization and thought.', prereq: null, instructor: 'WANG Qin' },
    { code: 'GFN1000', name: 'In Dialogue with Nature', dept: 'HSS', credits: 3, capacity: 719, desc: 'Scientific exploration of natural phenomena.', prereq: null, instructor: 'ZHANG Miaosi' },
    { code: 'ENG1001', name: 'English Bridge Program (EBP)', dept: 'HSS', credits: 3, capacity: 1656, desc: 'English language proficiency development.', prereq: null, instructor: 'CAO Derong' },
    { code: 'ITE1000', name: 'Information Technology', dept: 'HSS', credits: 1, capacity: 3606, desc: 'Introduction to information technology concepts.', prereq: null, instructor: 'LIN Yongqian' },
    { code: 'BIO1001', name: 'General Biology', dept: 'MED', credits: 3, capacity: 200, desc: 'Introduction to biological sciences.', prereq: null, instructor: 'DU Yang' },
    { code: 'BIO3001', name: 'Genetics', dept: 'MED', credits: 3, capacity: 60, desc: 'Principles of genetics and molecular biology.', prereq: 'BIO2004 or GNB2001; BIO1002 or BIO2002 or GNB2002', instructor: 'STJEPANOVIC Goran' },
    { code: 'BME3001', name: 'Introduction to Biomedical Engineering I', dept: 'MED', credits: 2, capacity: 60, desc: 'Fundamentals of biomedical engineering.', prereq: null, instructor: 'PRABHU Sumedha Nitin' },
    { code: 'CHM2310', name: 'Organic Chemistry I', dept: 'SSE', credits: 3, capacity: 60, desc: 'Structure and reactions of organic compounds.', prereq: null, instructor: 'ZHAO Zheng' },
    { code: 'ECE3001', name: 'Signals and Systems', dept: 'SSE', credits: 3, capacity: 60, desc: 'Analysis of continuous and discrete signals and systems.', prereq: 'MAT1001 or MAT1010 or MAT1011', instructor: 'PUN Manon' },
    { code: 'PHY2002', name: 'Thermodynamics', dept: 'SSE', credits: 3, capacity: 40, desc: 'Laws of thermodynamics and their applications.', prereq: null, instructor: 'WANG Xing' },
    { code: 'CSC4100', name: 'Natural Language Processing', dept: 'SDS', credits: 3, capacity: 60, desc: 'Computational techniques for natural language understanding.', prereq: 'CSC1001 or CSC1003; CSC3100', instructor: 'WANG Deliang' },
    { code: 'DDA4230', name: 'Reinforcement Learning', dept: 'SDS', credits: 3, capacity: 90, desc: 'Reinforcement learning algorithms and applications.', prereq: 'CSC1001; MAT1001; MAT1002; MAT2040; STA2001; STA2002', instructor: 'LIU Guiliang' },
    { code: 'FIN4110', name: 'Options and Futures', dept: 'SME', credits: 3, capacity: 180, desc: 'Derivative securities and risk management.', prereq: 'FIN2010; MAT3010 or MAT1002 or MAT1012', instructor: 'XIAO Song' },
    { code: 'ECO3110', name: 'Behavioral Economics', dept: 'SME', credits: 3, capacity: 100, desc: 'Psychological insights into economic decision-making.', prereq: 'ECO2011', instructor: 'LIN Wei' },
    { code: 'MIS2051', name: 'IT in Business Applications', dept: 'SME', credits: 3, capacity: 240, desc: 'Information technology applications in business.', prereq: null, instructor: 'BAO Zhuolan' },
    { code: 'MAT4220', name: 'Partial Differential Equations', dept: 'SSE', credits: 3, capacity: 90, desc: 'Theory and applications of PDEs.', prereq: 'MAT2006 or MAT2050 or MAT2060; MAT2002 or MAT2001', instructor: 'CHEN Yuan' },
    { code: 'STA3001', name: 'Linear Models', dept: 'SDS', credits: 3, capacity: 90, desc: 'Linear regression and analysis of variance.', prereq: 'CSC1001 or CSC1003; MAT2040; ECO2121 or STA2001', instructor: 'HU Tianyang' },
    { code: 'ECE4016', name: 'Computer Networks', dept: 'SSE', credits: 3, capacity: 120, desc: 'Network protocols and architectures.', prereq: null, instructor: 'WANG Fangxin' },
    { code: 'BIO2002', name: 'Cell and Molecular Biology', dept: 'MED', credits: 3, capacity: 86, desc: 'Cellular structure and molecular mechanisms.', prereq: 'BIO1001', instructor: 'DU Yang' },
    { code: 'CHM2317', name: 'Organic Chemistry and Biomolecules', dept: 'MED', credits: 3, capacity: 100, desc: 'Organic chemistry with emphasis on biological molecules.', prereq: 'CHM1001; BIO1001 or BIO1008', instructor: 'CHENG Guijuan' }
  ];

  // Create courses with matched instructors
  const courses = [];
  for (const courseData of realCourseData) {
    const instructorIndex = instructorData.findIndex(i => i.name === courseData.instructor);
    const instructor = instructors[instructorIndex >= 0 ? instructorIndex : 0];

    // Calculate random current enrollment (0-80% of capacity)
    const currentEnrollment = Math.floor(Math.random() * (courseData.capacity * 0.8));

    const course = await prisma.course.create({
      data: {
        courseCode: courseData.code,
        courseName: courseData.name,
        department: courseData.dept,
        credits: courseData.credits,
        maxCapacity: courseData.capacity,
        currentEnrollment,
        description: courseData.desc,
        prerequisites: courseData.prereq,
        semester: Semester.FALL,
        year: 2025,
        status: currentEnrollment >= courseData.capacity ? CourseStatus.FULL : CourseStatus.ACTIVE,
        instructorId: instructor.id
      }
    });
    courses.push(course);
  }

  console.log(`✅ Created ${courses.length} real CUHK courses\n`);

  // ============================================================================
  // TIME SLOTS
  // ============================================================================

  console.log('🕐 Creating time slots...');

  const timeSlots = [
    { day: DayOfWeek.MONDAY, start: '09:00', end: '10:30' },
    { day: DayOfWeek.WEDNESDAY, start: '09:00', end: '10:30' },
    { day: DayOfWeek.TUESDAY, start: '14:00', end: '15:30' },
    { day: DayOfWeek.THURSDAY, start: '14:00', end: '15:30' },
    { day: DayOfWeek.MONDAY, start: '14:00', end: '15:30' },
    { day: DayOfWeek.WEDNESDAY, start: '14:00', end: '15:30' },
    { day: DayOfWeek.TUESDAY, start: '10:30', end: '12:00' },
    { day: DayOfWeek.THURSDAY, start: '10:30', end: '12:00' },
    { day: DayOfWeek.FRIDAY, start: '14:00', end: '17:00' }
  ];

  const rooms = ['TB301', 'TB302', 'TB303', 'LH101', 'LH102', 'LH201', 'LH202', 'SB101', 'SB102', 'DB101'];

  const timeSlotData = [];
  for (let i = 0; i < courses.length; i++) {
    const slotPattern = i % timeSlots.length;
    const room = rooms[i % rooms.length];

    if (slotPattern < 6) {
      // Two sessions per week (MW or TuTh)
      timeSlotData.push({
        courseId: courses[i].id,
        dayOfWeek: timeSlots[slotPattern].day,
        startTime: timeSlots[slotPattern].start,
        endTime: timeSlots[slotPattern].end,
        location: room
      });
      timeSlotData.push({
        courseId: courses[i].id,
        dayOfWeek: timeSlots[slotPattern + 1].day,
        startTime: timeSlots[slotPattern + 1].start,
        endTime: timeSlots[slotPattern + 1].end,
        location: room
      });
    } else {
      // Single long session (Friday)
      timeSlotData.push({
        courseId: courses[i].id,
        dayOfWeek: DayOfWeek.FRIDAY,
        startTime: timeSlots[8].start,
        endTime: timeSlots[8].end,
        location: room
      });
    }
  }

  await prisma.timeSlot.createMany({ data: timeSlotData });
  console.log(`✅ Created ${timeSlotData.length} time slots\n`);

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================

  console.log('📝 Creating sample enrollments...');

  const enrollmentData = [];

  // Create 30 confirmed enrollments (respecting constraints)
  for (let i = 0; i < 30 && i < students.length; i++) {
    const numCourses = Math.min(Math.floor(Math.random() * 4) + 1, 5); // 1-5 courses per student
    const enrolledCourses = new Set();

    for (let j = 0; j < numCourses; j++) {
      const courseIndex = Math.floor(Math.random() * courses.length);
      if (!enrolledCourses.has(courseIndex)) {
        enrolledCourses.add(courseIndex);
        enrollmentData.push({
          userId: students[i].id,
          courseId: courses[courseIndex].id,
          status: EnrollmentStatus.CONFIRMED
        });
      }
    }
  }

  // Create 10 waitlisted enrollments for popular courses
  const popularCourses = [0, 1, 2, 3]; // CSC3170, DDA3020, CSC1001, CSC3100
  for (let i = 30; i < 40 && i < students.length; i++) {
    const courseIndex = popularCourses[Math.floor(Math.random() * popularCourses.length)];
    enrollmentData.push({
      userId: students[i].id,
      courseId: courses[courseIndex].id,
      status: EnrollmentStatus.WAITLISTED,
      waitlistPosition: (i - 29)
    });
  }

  // Create 5 pending enrollments
  for (let i = 40; i < 45 && i < students.length; i++) {
    const courseIndex = Math.floor(Math.random() * courses.length);
    enrollmentData.push({
      userId: students[i].id,
      courseId: courses[courseIndex].id,
      status: EnrollmentStatus.PENDING
    });
  }

  await prisma.enrollment.createMany({ data: enrollmentData });
  console.log(`✅ Created ${enrollmentData.length} enrollments\n`);

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  console.log('📋 Creating audit logs...');

  const auditLogs = [];
  for (let i = 0; i < 20; i++) {
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
  console.log('✅ SEED COMPLETED SUCCESSFULLY - REAL CUHK DATA');
  console.log('═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   • Users: ${admins.length + instructors.length + students.length}`);
  console.log(`     - Administrators: ${admins.length}`);
  console.log(`     - Instructors: ${instructors.length}`);
  console.log(`     - Students: ${students.length}`);
  console.log(`   • Courses: ${courses.length} (REAL CUHK courses)`);
  console.log(`   • Time Slots: ${timeSlotData.length}`);
  console.log(`   • Enrollments: ${enrollmentData.length}`);
  console.log(`   • Audit Logs: ${auditLogs.length}\n`);

  console.log('🎓 Sample REAL CUHK Courses:');
  console.log('   • CSC3170 - Database System (170 seats, Prof. MA Chenhao)');
  console.log('   • DDA3020 - Machine Learning (260 seats, Prof. FAN Jicong)');
  console.log('   • CSC1001 - Intro to CS (950 seats, Prof. LI Tongxin)');
  console.log('   • MAT1001 - Calculus I (1395 seats, Prof. WANG Xuefeng)');
  console.log('   • ECO2011 - Basic Microeconomics (900 seats, Prof. CHUNG Barick)');
  console.log('   • And 44 more real courses...\n');

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
