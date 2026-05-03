import { NextRequest, NextResponse } from 'next/server';
import { validateSession, canManageClass } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateAssignmentSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  points: z.number().min(0).max(1000).optional(),
  dueDate: z.string().nullable().optional(),
  allowLateSubmission: z.boolean().optional(),
  latePenalty: z.number().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
});

// GET /api/assignments/[id]
export async function GET(
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

    const { id } = await params;

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            color: true,
            teacherId: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                student: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            grade: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    // Check access
    const isTeacherOfClass = assignment.class.teacherId === user.id;
    const isEnrolled = assignment.class.enrollments.some(e => e.studentId === user.id);
    const isAdminUser = user.role === 'SCHOOL_ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isTeacherOfClass && !isEnrolled && !isAdminUser) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // For students, only show their own submission
    if (user.role === 'STUDENT') {
      const studentSubmission = assignment.submissions.find(s => s.studentId === user.id);
      return NextResponse.json({
        success: true,
        assignment: {
          ...assignment,
          submissions: studentSubmission ? [studentSubmission] : [],
          class: {
            ...assignment.class,
            enrollments: undefined,
          },
        },
        mySubmission: studentSubmission || null,
      });
    }

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/assignments/[id]
export async function PUT(
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

    const { id } = await params;
    const body = await request.json();
    const validated = updateAssignmentSchema.parse(body);

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: { class: { select: { teacherId: true } } },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    if (!canManageClass(user, assignment.class.teacherId)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }
    if (validated.status === 'PUBLISHED' && !assignment.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updated = await db.assignment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error) {
    console.error('Update assignment error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/assignments/[id]
export async function DELETE(
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

    const { id } = await params;

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: { class: { select: { teacherId: true } } },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    if (!canManageClass(user, assignment.class.teacherId)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    await db.assignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
