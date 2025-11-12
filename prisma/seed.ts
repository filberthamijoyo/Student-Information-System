import { PrismaClient, Role, Semester, TermType, TermStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create terms
  console.log('Creating academic terms...');

  const fallTerm = await prisma.term.upsert({
    where: { code: '2024-25-T1' },
    update: {},
    create: {
      name: '2024-25 Term 1',
      code: '2024-25-T1',
      type: TermType.FALL,
      status: TermStatus.ENROLLMENT,
      academicYear: '2024-25',
      enrollmentStart: new Date('2024-08-15'),
      enrollmentEnd: new Date('2024-09-15'),
      termStart: new Date('2024-09-01'),
      termEnd: new Date('2024-12-20'),
    },
  });

  const springTerm = await prisma.term.upsert({
    where: { code: '2024-25-T2' },
    update: {},
    create: {
      name: '2024-25 Term 2',
      code: '2024-25-T2',
      type: TermType.SPRING,
      status: TermStatus.UPCOMING,
      academicYear: '2024-25',
      enrollmentStart: new Date('2024-12-01'),
      enrollmentEnd: new Date('2025-01-10'),
      termStart: new Date('2025-01-15'),
      termEnd: new Date('2025-05-15'),
    },
  });

  const summerTerm = await prisma.term.upsert({
    where: { code: '2024-25-SUMMER' },
    update: {},
    create: {
      name: '2024-25 Summer',
      code: '2024-25-SUMMER',
      type: TermType.SUMMER,
      status: TermStatus.UPCOMING,
      academicYear: '2024-25',
      enrollmentStart: new Date('2025-04-01'),
      enrollmentEnd: new Date('2025-05-15'),
      termStart: new Date('2025-06-01'),
      termEnd: new Date('2025-08-15'),
    },
  });

  console.log('✅ Created 3 academic terms');

  // 2. Create demo users
  console.log('Creating demo users...');
  
  const student = await prisma.user.upsert({
    where: { userIdentifier: '120090001' },
    update: {},
    create: {
      userIdentifier: '120090001',
      email: 'student@link.cuhk.edu.cn',
      passwordHash: hashedPassword,
      fullName: 'Demo Student',
      role: Role.STUDENT,
      major: 'Computer Science',
      yearLevel: 3,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { userIdentifier: 'inst001' },
    update: {},
    create: {
      userIdentifier: 'inst001',
      email: 'instructor@link.cuhk.edu.cn',
      passwordHash: hashedPassword,
      fullName: 'Prof. John Smith',
      role: Role.INSTRUCTOR,
    },
  });

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

  console.log('✅ Created 3 demo users');

  // 3. Create courses
  console.log('Creating courses...');

  const course1 = await prisma.course.create({
    data: {
      courseCode: 'CSC3170',
      courseName: 'Database Systems',
      department: 'SDS',
      credits: 3,
      maxCapacity: 80,
      instructorId: instructor.id,
      termId: fallTerm.id,
      description: 'Introduction to database systems',
      semester: Semester.FALL,
      year: 2025,  // Added year field
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
  });

  const course2 = await prisma.course.create({
    data: {
      courseCode: 'DDA3020',
      courseName: 'Machine Learning',
      department: 'SDS',
      credits: 3,
      maxCapacity: 60,
      instructorId: instructor.id,
      termId: fallTerm.id,
      description: 'Introduction to machine learning',
      prerequisites: 'CSC1001,STA2001',
      semester: Semester.FALL,
      year: 2025,  // Added year field
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
  });

  const course3 = await prisma.course.create({
    data: {
      courseCode: 'CSC1001',
      courseName: 'Introduction to Computer Science',
      department: 'SDS',
      credits: 3,
      maxCapacity: 120,
      instructorId: instructor.id,
      termId: fallTerm.id,
      description: 'Introduction to programming',
      semester: Semester.FALL,
      year: 2025,  // Added year field
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
  });

  console.log('✅ Created 3 sample courses');
  console.log('🎉 Database seeding completed!');
  console.log(`
Demo Credentials:
- Student: 120090001 / Password123!
- Instructor: inst001 / Password123!
- Admin: admin001 / Password123!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });