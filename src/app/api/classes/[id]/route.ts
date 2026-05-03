import { NextRequest, NextResponse } from 'next/server';
import { validateSession, canManageClass } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateClassSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  academicYear: z.string().optional(),
  room: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/classes/[id] - Get class details
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

    const classData = await db.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        school: {
          select: { id: true, name: true },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        assignments: {
          where: { status: { in: ['PUBLISHED'] } },
          orderBy: { dueDate: 'asc' },
          take: 10,
        },
        announcements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        _count: {
          select: { enrollments: true, assignments: true },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }

    // Check access
    const isTeacherOfClass = classData.teacherId === user.id;
    const isEnrolled = classData.enrollments.some(e => e.studentId === user.id);
    const isAdminUser = user.role === 'SCHOOL_ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isTeacherOfClass && !isEnrolled && !isAdminUser) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, class: classData });
  } catch (error) {
    console.error('Get class error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/classes/[id] - Update class
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
    const validated = updateClassSchema.parse(body);

    const existingClass = await db.class.findUnique({
      where: { id },
      select: { teacherId: true },
    });

    if (!existingClass) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }

    if (!canManageClass(user, existingClass.teacherId)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const updatedClass = await db.class.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ success: true, class: updatedClass });
  } catch (error) {
    console.error('Update class error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/classes/[id] - Delete/Archive class
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

    const existingClass = await db.class.findUnique({
      where: { id },
      select: { teacherId: true },
    });

    if (!existingClass) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }

    if (!canManageClass(user, existingClass.teacherId)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Archive instead of delete
    await db.class.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
