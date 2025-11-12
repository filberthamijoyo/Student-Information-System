import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

/**
 * Get all grades for the authenticated user
 */
export async function getMyGrades(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            courseCode: true,
            courseName: true,
            credits: true,
            semester: true,
            year: true,
          }
        },
        grade: true,
      },
      orderBy: [
        { course: { year: 'desc' } },
        { course: { semester: 'desc' } },
      ],
    });

    const gradesData = enrollments.map(e => ({
      enrollmentId: e.id,
      semester: e.course.semester,
      year: e.course.year,
      courseCode: e.course.courseCode,
      courseName: e.course.courseName,
      credits: e.course.credits,
      letterGrade: e.grade?.letterGrade || 'IP',
      numericGrade: e.grade?.numericGrade,
      gradePoints: e.grade?.gradePoints,
      status: e.grade?.status || 'IN_PROGRESS',
    }));

    res.json({
      success: true,
      data: gradesData,
    });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades',
    });
  }
}

/**
 * Get grades for a specific term
 */
export async function getGradesByTerm(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { semester, year } = req.query;

    if (!semester || !year) {
      throw new AppError('Semester and year are required', 400);
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        course: {
          semester: semester as any,
          year: parseInt(year as string),
        }
      },
      include: {
        course: {
          select: {
            courseCode: true,
            courseName: true,
            credits: true,
          }
        },
        grade: true,
      },
    });

    const gradesData = enrollments.map(e => ({
      courseCode: e.course.courseCode,
      courseName: e.course.courseName,
      credits: e.course.credits,
      letterGrade: e.grade?.letterGrade || 'IP',
      numericGrade: e.grade?.numericGrade,
      gradePoints: e.grade?.gradePoints,
    }));

    res.json({
      success: true,
      data: gradesData,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get grades by term error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch grades',
      });
    }
  }
}

/**
 * Get grade for a specific course
 */
export async function getCourseGrade(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { courseId } = req.params;

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: parseInt(courseId),
      },
      include: {
        course: {
          select: {
            courseCode: true,
            courseName: true,
            credits: true,
            semester: true,
            year: true,
          }
        },
        grade: true,
      },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    res.json({
      success: true,
      data: {
        courseCode: enrollment.course.courseCode,
        courseName: enrollment.course.courseName,
        credits: enrollment.course.credits,
        semester: enrollment.course.semester,
        year: enrollment.course.year,
        letterGrade: enrollment.grade?.letterGrade || 'IP',
        numericGrade: enrollment.grade?.numericGrade,
        gradePoints: enrollment.grade?.gradePoints,
        status: enrollment.grade?.status || 'IN_PROGRESS',
        comments: enrollment.grade?.comments,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get course grade error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch grade',
      });
    }
  }
}

/**
 * Get complete transcript for the authenticated user
 */
export async function getTranscript(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    // Get all transcripts
    const transcripts = await prisma.transcript.findMany({
      where: { userId },
      orderBy: [
        { year: 'asc' },
        { semester: 'asc' },
      ],
    });

    // Get all graded enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        grade: {
          status: 'PUBLISHED'
        },
      },
      include: {
        course: true,
        grade: true,
      },
      orderBy: [
        { course: { year: 'asc' } },
        { course: { semester: 'asc' } },
      ],
    });

    // Group enrollments by term
    const enrollmentsByTerm = enrollments.reduce((acc, e) => {
      const key = `${e.course.year}-${e.course.semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        courseCode: e.course.courseCode,
        courseName: e.course.courseName,
        credits: e.course.credits,
        grade: e.grade?.letterGrade,
        gradePoints: e.grade?.gradePoints,
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate cumulative GPA
    const latestTranscript = transcripts.length > 0
      ? transcripts[transcripts.length - 1]
      : null;

    const totalCredits = enrollments.reduce((sum, e) => sum + e.course.credits, 0);

    res.json({
      success: true,
      data: {
        transcripts: transcripts.map(t => ({
          semester: t.semester,
          year: t.year,
          termGPA: t.termGPA,
          cumulativeGPA: t.gpa,
          totalCredits: t.totalCredits,
          earnedCredits: t.earnedCredits,
          academicStanding: t.academicStanding,
        })),
        enrollmentsByTerm,
        summary: {
          cumulativeGPA: latestTranscript?.gpa || 0,
          totalCredits,
          earnedCredits: totalCredits,
          academicStanding: latestTranscript?.academicStanding || 'N/A',
        },
      },
    });
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transcript',
    });
  }
}

/**
 * Get unofficial transcript (same as transcript but marked as unofficial)
 */
export async function getUnofficialTranscript(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            major: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get transcripts
    const transcripts = await prisma.transcript.findMany({
      where: { userId },
      orderBy: [
        { year: 'asc' },
        { semester: 'asc' },
      ],
    });

    // Get all enrollments with grades
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        grade: {
          isNot: null,
        },
      },
      include: {
        course: true,
        grade: true,
      },
      orderBy: [
        { course: { year: 'asc' } },
        { course: { semester: 'asc' } },
      ],
    });

    res.json({
      success: true,
      data: {
        isOfficial: false,
        student: {
          fullName: user.fullName,
          studentId: user.student?.studentId,
          email: user.email,
          major: user.student?.major?.name,
          expectedGraduation: user.student?.expectedGrad,
        },
        transcripts,
        courses: enrollments.map(e => ({
          semester: e.course.semester,
          year: e.course.year,
          courseCode: e.course.courseCode,
          courseName: e.course.courseName,
          credits: e.course.credits,
          letterGrade: e.grade?.letterGrade,
          numericGrade: e.grade?.numericGrade,
          gradePoints: e.grade?.gradePoints,
        })),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Get unofficial transcript error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transcript',
      });
    }
  }
}

/**
 * Generate PDF transcript (placeholder - returns data for PDF generation)
 */
export async function generateTranscriptPDF(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    // This would typically generate a PDF, but for now we'll return the data
    // In a production app, you'd use a library like pdfkit or puppeteer

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            major: true,
          },
        },
        transcripts: {
          orderBy: [
            { year: 'asc' },
            { semester: 'asc' },
          ],
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        grade: {
          status: 'PUBLISHED',
        },
      },
      include: {
        course: true,
        grade: true,
      },
      orderBy: [
        { course: { year: 'asc' } },
        { course: { semester: 'asc' } },
      ],
    });

    res.json({
      success: true,
      message: 'PDF generation would happen here',
      data: {
        student: user.student,
        transcripts: user.transcripts,
        courses: enrollments,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error('Generate transcript PDF error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
      });
    }
  }
}

/**
 * Get GPA information
 */
export async function getGPA(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const latestTranscript = await prisma.transcript.findFirst({
      where: { userId },
      orderBy: [
        { year: 'desc' },
        { semester: 'desc' },
      ],
    });

    if (!latestTranscript) {
      return res.json({
        success: true,
        data: {
          cumulativeGPA: 0,
          currentTermGPA: 0,
          totalCredits: 0,
          earnedCredits: 0,
          academicStanding: 'N/A',
          message: 'No transcript data available',
        },
      });
    }

    res.json({
      success: true,
      data: {
        cumulativeGPA: latestTranscript.gpa,
        currentTermGPA: latestTranscript.termGPA,
        totalCredits: latestTranscript.totalCredits,
        earnedCredits: latestTranscript.earnedCredits,
        academicStanding: latestTranscript.academicStanding,
        qualityPoints: latestTranscript.qualityPoints,
      },
    });
  } catch (error) {
    console.error('Get GPA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPA',
    });
  }
}

/**
 * Get GPA history over multiple terms
 */
export async function getGPAHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const transcripts = await prisma.transcript.findMany({
      where: { userId },
      orderBy: [
        { year: 'asc' },
        { semester: 'asc' },
      ],
      select: {
        semester: true,
        year: true,
        termGPA: true,
        gpa: true,
        totalCredits: true,
        academicStanding: true,
      },
    });

    res.json({
      success: true,
      data: transcripts.map(t => ({
        term: `${t.semester} ${t.year}`,
        semester: t.semester,
        year: t.year,
        termGPA: t.termGPA,
        cumulativeGPA: t.gpa,
        totalCredits: t.totalCredits,
        academicStanding: t.academicStanding,
      })),
    });
  } catch (error) {
    console.error('Get GPA history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPA history',
    });
  }
}
