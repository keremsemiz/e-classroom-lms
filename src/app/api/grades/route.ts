import { NextRequest, NextResponse } from 'next/server';
import { validateSession, canGrade } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const gradeSubmissionSchema = z.object({
  submissionId: z.string(),
  score: z.number().min(0),
  maxScore: z.number().min(1).optional(),
  feedback: z.string().optional(),
  letterGrade: z.string().optional(),
});

// POST /api/grades - Grade a submission
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    if (!canGrade(user)) {
      return NextResponse.json({ success: false, error: 'Only teachers can grade submissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = gradeSubmissionSchema.parse(body);

    // Get submission with assignment and class info
    const submission = await db.submission.findUnique({
      where: { id: validated.submissionId },
      include: {
        assignment: {
          include: { class: { select: { teacherId: true } } },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 });
    }

    // Check if teacher owns this class
    if (submission.assignment.class.teacherId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const maxScore = validated.maxScore ?? submission.assignment.points;
    const percentage = (validated.score / maxScore) * 100;

    // Create or update grade
    const grade = await db.grade.upsert({
      where: { submissionId: validated.submissionId },
      create: {
        submissionId: validated.submissionId,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        score: validated.score,
        maxScore,
        percentage,
        letterGrade: validated.letterGrade,
        feedback: validated.feedback,
        gradedBy: user.id,
      },
      update: {
        score: validated.score,
        maxScore,
        percentage,
        letterGrade: validated.letterGrade,
        feedback: validated.feedback,
        gradedBy: user.id,
        gradedAt: new Date(),
      },
    });

    // Update submission status
    await db.submission.update({
      where: { id: validated.submissionId },
      data: { status: 'GRADED' },
    });

    // Notify student
    await db.notification.create({
      data: {
        userId: submission.studentId,
        type: 'GRADE',
        title: 'Assignment Graded',
        message: `Your submission for "${submission.assignment.title}" has been graded`,
        link: `#/assignments/${submission.assignmentId}`,
      },
    });

    return NextResponse.json({ success: true, grade });
  } catch (error) {
    console.error('Grade submission error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/grades - Get student's grades
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    const where: Record<string, unknown> = {};

    if (user.role === 'STUDENT') {
      where.studentId = user.id;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (classId) {
      where.assignment = { classId };
    }

    const grades = await db.grade.findMany({
      where,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            points: true,
            assignmentType: true,
            class: { select: { id: true, name: true, color: true } },
          },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { gradedAt: 'desc' },
    });

    return NextResponse.json({ success: true, grades });
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
