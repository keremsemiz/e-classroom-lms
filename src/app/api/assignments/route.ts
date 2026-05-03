import { NextRequest, NextResponse } from 'next/server';
import { validateSession, isTeacher, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { AssignmentStatus, AssignmentType } from '@prisma/client';
import { z } from 'zod';

const createAssignmentSchema = z.object({
  classId: z.string(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  assignmentType: z.nativeEnum(AssignmentType).optional(),
  points: z.number().min(0).max(1000).optional(),
  dueDate: z.string().optional(),
  allowLateSubmission: z.boolean().optional(),
  latePenalty: z.number().optional(),
  maxAttempts: z.number().min(1).optional(),
  attachments: z.array(z.string()).optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
});

// GET /api/assignments - List assignments
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
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    
    if (classId) {
      where.classId = classId;
    }

    if (status) {
      where.status = status;
    }

    // Filter by user's access
    if (user.role === 'STUDENT') {
      where.class = {
        enrollments: {
          some: {
            studentId: user.id,
            status: 'ACTIVE',
          },
        },
      };
      where.status = 'PUBLISHED';
    } else if (user.role === 'TEACHER') {
      where.class = {
        teacherId: user.id,
      };
    }

    const assignments = await db.assignment.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/assignments - Create assignment
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

    if (!isTeacher(user) && !isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Only teachers can create assignments' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createAssignmentSchema.parse(body);

    // Verify class ownership
    const classData = await db.class.findUnique({
      where: { id: validated.classId },
      select: { teacherId: true, enrollments: { where: { status: 'ACTIVE' } } },
    });

    if (!classData) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }

    if (classData.teacherId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const assignment = await db.assignment.create({
      data: {
        classId: validated.classId,
        title: validated.title,
        description: validated.description,
        instructions: validated.instructions,
        assignmentType: validated.assignmentType || 'HOMEWORK',
        points: validated.points ?? 100,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        allowLateSubmission: validated.allowLateSubmission ?? false,
        latePenalty: validated.latePenalty,
        maxAttempts: validated.maxAttempts ?? 1,
        attachments: validated.attachments ? JSON.parse(JSON.stringify(validated.attachments)) : null,
        status: validated.status || 'DRAFT',
        publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
      },
    });

    // Create notifications for students if published
    if (assignment.status === 'PUBLISHED') {
      const studentIds = classData.enrollments.map(e => e.studentId);
      await db.notification.createMany({
        data: studentIds.map(studentId => ({
          userId: studentId,
          type: 'ASSIGNMENT',
          title: 'New Assignment',
          message: `New assignment "${validated.title}" has been posted`,
          link: `#/assignments/${assignment.id}`,
        })),
      });
    }

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    console.error('Create assignment error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
