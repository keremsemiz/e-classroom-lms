import { NextRequest, NextResponse } from 'next/server';
import { validateSession, generateUniqueClassCode, isTeacher, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const createClassSchema = z.object({
  name: z.string().min(2, 'Class name must be at least 2 characters'),
  description: z.string().optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  academicYear: z.string().optional(),
  room: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/classes - List classes for current user
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

    let classes;

    if (user.role === UserRole.STUDENT) {
      // Get classes the student is enrolled in
      classes = await db.class.findMany({
        where: {
          enrollments: {
            some: {
              studentId: user.id,
              status: 'ACTIVE',
            },
          },
          isActive: true,
        },
        include: {
          teacher: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          _count: {
            select: { enrollments: true, assignments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === UserRole.TEACHER) {
      // Get classes the teacher teaches
      classes = await db.class.findMany({
        where: {
          teacherId: user.id,
          isActive: true,
        },
        include: {
          _count: {
            select: { enrollments: true, assignments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Admin - get all classes in their school
      classes = await db.class.findMany({
        where: user.schoolId ? { schoolId: user.schoolId } : {},
        include: {
          teacher: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          school: {
            select: { id: true, name: true },
          },
          _count: {
            select: { enrollments: true, assignments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, classes });
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/classes - Create a new class
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
      return NextResponse.json({ success: false, error: 'Only teachers and admins can create classes' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createClassSchema.parse(body);

    const code = await generateUniqueClassCode();

    const newClass = await db.class.create({
      data: {
        name: validated.name,
        code,
        description: validated.description,
        subject: validated.subject,
        gradeLevel: validated.gradeLevel,
        academicYear: validated.academicYear,
        room: validated.room,
        color: validated.color || '#3B82F6',
        teacherId: user.id,
        schoolId: user.schoolId,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, class: newClass }, { status: 201 });
  } catch (error) {
    console.error('Create class error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
