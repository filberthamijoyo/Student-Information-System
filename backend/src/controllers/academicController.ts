import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';

/**
 * Get all grades for the authenticated user
 */
export async function getMyGrades(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const enrollments = await prisma.enrollments.findMany({
      where: { user_id: userId },
      include: {
        courses: {
          select: {
            course_code: true,
            course_name: true,
            credits: true,
            semester: true,
            year: true,
          }
        },
        grades: true,
      },
      orderBy: [
        { enrolled_at: 'desc' },
      ],
    });

    const gradesData = enrollments.map(e => ({
      enrollmentId: e.id,
      semester: e.courses.semester || null,
      year: e.courses.year || null,
      courseCode: e.courses.course_code,
      courseName: e.courses.course_name,
      credits: e.courses.credits,
      letterGrade: e.grades?.letter_grade || 'IP',
      numericGrade: e.grades?.numeric_grade,
      gradePoints: e.grades?.grade_points,
      status: e.grades?.status || 'IN_PROGRESS',
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

    const enrollments = await prisma.enrollments.findMany({
      where: {
        user_id: userId,
        courses: {
          semester: semester as any,
          year: parseInt(year as string),
        }
      },
      include: {
        courses: {
          select: {
            course_code: true,
            course_name: true,
            credits: true,
          }
        },
        grades: true,
      },
    });

    const gradesData = enrollments.map(e => ({
      courseCode: e.courses.course_code,
      courseName: e.courses.course_name,
      credits: e.courses.credits,
      letterGrade: e.grades?.letter_grade || 'IP',
      numericGrade: e.grades?.numeric_grade,
      gradePoints: e.grades?.grade_points,
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

    const enrollment = await prisma.enrollments.findFirst({
      where: {
        user_id: userId,
        course_id: parseInt(courseId),
      },
      include: {
        courses: {
          select: {
            course_code: true,
            course_name: true,
            credits: true,
            semester: true,
            year: true,
          }
        },
        grades: true,
      },
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    res.json({
      success: true,
      data: {
        courseCode: enrollment.courses.course_code,
        courseName: enrollment.courses.course_name,
        credits: enrollment.courses.credits,
        semester: enrollment.courses.semester || null,
        year: enrollment.courses.year || null,
        letterGrade: enrollment.grades?.letter_grade || 'IP',
        numericGrade: enrollment.grades?.numeric_grade,
        gradePoints: enrollment.grades?.grade_points,
        status: enrollment.grades?.status || 'IN_PROGRESS',
        comments: enrollment.grades?.comments,
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
    const transcripts = await prisma.transcripts.findMany({
      where: { user_id: userId },
      orderBy: [
        { year: 'asc' },
        { semester: 'asc' },
      ],
    });

    // Get all graded enrollments
    const enrollments = await prisma.enrollments.findMany({
      where: {
        user_id: userId,
        grades: {
          status: 'PUBLISHED'
        },
      },
      include: {
        courses: true,
        grades: true,
      },
      orderBy: [
        { courses: { year: 'asc' } },
        { courses: { semester: 'asc' } },
      ],
    });

    // Group enrollments by term
    const enrollmentsByTerm = enrollments.reduce((acc, e) => {
      const year = e.courses.year || new Date().getFullYear();
      const semester = e.courses.semester || 'UNKNOWN';
      const key = `${year}-${semester}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        courseCode: e.courses.course_code,
        courseName: e.courses.course_name,
        credits: e.courses.credits,
        grade: e.grades?.letter_grade,
        gradePoints: e.grades?.grade_points,
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate cumulative GPA
    const latestTranscript = transcripts.length > 0
      ? transcripts[transcripts.length - 1]
      : null;

    const totalCredits = enrollments.reduce((sum, e) => sum + e.courses.credits, 0);

    res.json({
      success: true,
      data: {
        transcripts: transcripts.map(t => ({
          semester: t.semester || null,
          year: t.year || null,
          termGPA: t.term_gpa,
          cumulativeGPA: t.gpa,
          totalCredits: t.total_credits,
          earnedCredits: t.earned_credits,
          academicStanding: t.academic_standing,
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
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        students_students_user_idTousers: {
          include: {
            majors: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const student = user.students_students_user_idTousers;

    // Get transcripts
    const transcripts = await prisma.transcripts.findMany({
      where: { user_id: userId },
      orderBy: [
        { year: 'asc' },
        { semester: 'asc' },
      ],
    });

    // Get all enrollments with grades
    const enrollments = await prisma.enrollments.findMany({
      where: {
        user_id: userId,
        grades: {
          isNot: null,
        },
      },
      include: {
        courses: true,
        grades: true,
      },
      orderBy: [
        { courses: { year: 'asc' } },
        { courses: { semester: 'asc' } },
      ],
    });

    res.json({
      success: true,
      data: {
        isOfficial: false,
        student: {
          fullName: user.full_name,
          studentId: student?.student_id,
          email: user.email,
          major: student?.majors?.name,
          expectedGraduation: student?.expected_grad,
        },
        transcripts,
        courses: enrollments.map(e => ({
          semester: e.courses.semester || null,
          year: e.courses.year || null,
          courseCode: e.courses.course_code,
          courseName: e.courses.course_name,
          credits: e.courses.credits,
          letterGrade: e.grades?.letter_grade,
          numericGrade: e.grades?.numeric_grade,
          gradePoints: e.grades?.grade_points,
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

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        students_students_user_idTousers: {
          include: {
            majors: true,
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

    const enrollments = await prisma.enrollments.findMany({
      where: {
        user_id: userId,
        grades: {
          status: 'PUBLISHED',
        },
      },
      include: {
        courses: true,
        grades: true,
      },
      orderBy: [
        { courses: { year: 'asc' } },
        { courses: { semester: 'asc' } },
      ],
    });

    res.json({
      success: true,
      message: 'PDF generation would happen here',
      data: {
        student: user.students_students_user_idTousers,
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
export async function getGPA(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const latestTranscript = await prisma.transcripts.findFirst({
      where: { user_id: userId },
      orderBy: {
        generated_at: 'desc',
      },
    });

    if (!latestTranscript) {
      res.json({
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
      return;
    }

    res.json({
      success: true,
      data: {
        cumulativeGPA: latestTranscript.gpa,
        currentTermGPA: latestTranscript.term_gpa,
        totalCredits: latestTranscript.total_credits,
        earnedCredits: latestTranscript.earned_credits,
        academicStanding: latestTranscript.academic_standing,
        qualityPoints: latestTranscript.quality_points,
      },
    });
  } catch (error: any) {
    console.error('Get GPA error:', error);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      message: error.message,
      meta: error.meta,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPA',
      error: error.message || 'Unknown error',
    });
  }
}

/**
 * Get GPA history over multiple terms
 */
export async function getGPAHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const transcripts = await prisma.transcripts.findMany({
      where: { user_id: userId },
      orderBy: [
        { year: 'asc' },
        { semester: 'asc' },
      ],
      select: {
        term_gpa: true,
        gpa: true,
        total_credits: true,
        academic_standing: true,
        semester: true,
        year: true,
      },
    });

    res.json({
      success: true,
      data: transcripts.map(t => {
        const semester = t.semester || null;
        const year = t.year || null;
        return {
          term: semester && year ? `${semester} ${year}` : 'Unknown',
          semester,
          year,
          termGPA: t.term_gpa,
          cumulativeGPA: t.gpa,
          totalCredits: t.total_credits,
          academicStanding: t.academic_standing,
        };
      }),
    });
  } catch (error) {
    console.error('Get GPA history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPA history',
    });
  }
}
