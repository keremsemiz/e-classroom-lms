import { NextRequest, NextResponse } from 'next/server';
import { validateSession, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT']),
  schoolId: z.string().optional(),
});

// GET /api/users - Get users (with filtering)
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
    const role = searchParams.get('role') as UserRole | null;
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search');
    const classId = searchParams.get('classId');

    const where: Record<string, unknown> = { isActive: true };

    // Role-based access control
    if (user.role === 'STUDENT') {
      // Students can only see teachers from their enrolled classes and themselves
      const enrollments = await db.enrollment.findMany({
        where: { studentId: user.id, status: 'ACTIVE' },
        select: { class: { select: { teacherId: true } } },
      });
      const teacherIds = [...new Set(enrollments.map(e => e.class.teacherId))];
      
      where.OR = [
        { id: user.id },
        { id: { in: teacherIds } },
      ];
    } else if (user.role === 'TEACHER') {
      // Teachers can see students in their classes
      if (schoolId) {
        where.schoolId = schoolId;
      } else if (user.schoolId) {
        where.schoolId = user.schoolId;
      }
    } else if (user.role === 'SCHOOL_ADMIN') {
      // School admins see users in their school
      where.schoolId = user.schoolId;
    }
    // Super admins can see all users

    if (role) {
      where.role = role;
    }

    if (schoolId && isAdmin(user)) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classId) {
      // Get users from a specific class
      const classData = await db.class.findUnique({
        where: { id: classId },
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            select: { studentId: true },
          },
        },
      });

      if (classData) {
        const studentIds = classData.enrollments.map(e => e.studentId);
        where.OR = [
          { id: classData.teacherId },
          { id: { in: studentIds } },
        ];
      }
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
      take: 100,
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users - Create a new user (Admin only)
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

    // Only admins can create users
    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 });
    }

    // Validate school assignment
    let schoolId = validated.schoolId;
    if (user.role === 'SCHOOL_ADMIN') {
      // School admins can only create users in their own school
      schoolId = user.schoolId;
    } else if (user.role === 'SUPER_ADMIN') {
      // Super admin can create users in any school or no school
      schoolId = validated.schoolId || null;
    }

    // Super admin can only be created by super admin
    if (validated.role === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only super admins can create super admin accounts' }, { status: 403 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const newUser = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role as UserRole,
        schoolId: schoolId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
