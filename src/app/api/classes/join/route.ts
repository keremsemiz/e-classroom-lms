import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const joinClassSchema = z.object({
  code: z.string().length(6, 'Class code must be 6 characters'),
});

// POST /api/classes/join - Join a class with code
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

    if (user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Only students can join classes' }, { status: 403 });
    }

    const body = await request.json();
    const validated = joinClassSchema.parse(body);

    // Find class by code
    const classData = await db.class.findUnique({
      where: { code: validated.code.toUpperCase() },
    });

    if (!classData) {
      return NextResponse.json({ success: false, error: 'Invalid class code' }, { status: 404 });
    }

    if (!classData.isActive) {
      return NextResponse.json({ success: false, error: 'This class is no longer active' }, { status: 400 });
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classData.id,
          studentId: user.id,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'ACTIVE') {
        return NextResponse.json({ success: false, error: 'You are already enrolled in this class' }, { status: 400 });
      } else {
        // Reactivate enrollment
        await db.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: 'ACTIVE', enrolledAt: new Date() },
        });
        return NextResponse.json({ success: true, class: classData });
      }
    }

    // Create enrollment
    await db.enrollment.create({
      data: {
        classId: classData.id,
        studentId: user.id,
        status: 'ACTIVE',
      },
    });

    // Create notification for teacher
    await db.notification.create({
      data: {
        userId: classData.teacherId,
        type: 'SYSTEM',
        title: 'New Student Enrolled',
        message: `${user.name} has joined your class: ${classData.name}`,
        link: `#/classes/${classData.id}/students`,
      },
    });

    return NextResponse.json({ success: true, class: classData });
  } catch (error) {
    console.error('Join class error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
