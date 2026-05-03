import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const submitAssignmentSchema = z.object({
  content: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// POST /api/assignments/[id]/submit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Only students can submit assignments' }, { status: 403 });
    }

    const { id: assignmentId } = await params;
    const body = await request.json();
    const validated = submitAssignmentSchema.parse(body);

    // Get assignment details
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            enrollments: { where: { studentId: user.id, status: 'ACTIVE' } },
          },
        },
        submissions: { where: { studentId: user.id } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.status !== 'PUBLISHED') {
      return NextResponse.json({ success: false, error: 'This assignment is not accepting submissions' }, { status: 400 });
    }

    // Check enrollment
    if (assignment.class.enrollments.length === 0) {
      return NextResponse.json({ success: false, error: 'You are not enrolled in this class' }, { status: 403 });
    }

    // Check attempt limit
    const previousSubmissions = assignment.submissions;
    const attemptNumber = previousSubmissions.length + 1;

    if (attemptNumber > assignment.maxAttempts) {
      return NextResponse.json({ success: false, error: 'Maximum attempts reached' }, { status: 400 });
    }

    // Check if late
    const now = new Date();
    const isLate = assignment.dueDate && now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      return NextResponse.json({ success: false, error: 'Late submissions are not allowed' }, { status: 400 });
    }

    // Create submission
    const submission = await db.submission.create({
      data: {
        assignmentId,
        studentId: user.id,
        content: validated.content,
        attachments: validated.attachments ? JSON.parse(JSON.stringify(validated.attachments)) : null,
        attemptNumber,
        status: isLate ? 'LATE' : 'SUBMITTED',
        late: isLate || false,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Notify teacher
    await db.notification.create({
      data: {
        userId: assignment.class.teacherId ?? '',
        type: 'ASSIGNMENT',
        title: 'New Submission',
        message: `${user.name} submitted "${assignment.title}"`,
        link: `#/assignments/${assignmentId}/submissions`,
      },
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    console.error('Submit assignment error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
