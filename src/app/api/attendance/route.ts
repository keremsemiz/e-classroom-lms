import { NextRequest, NextResponse } from 'next/server';
import { validateSession, isTeacher, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { AttendanceStatus } from '@prisma/client';
import { z } from 'zod';

const recordAttendanceSchema = z.object({
  classId: z.string(),
  date: z.string(),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.nativeEnum(AttendanceStatus),
    notes: z.string().optional(),
  })),
});

// GET /api/attendance - Get attendance records
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
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) where.date = new Date(date);
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // For students, only show their own attendance
    if (user.role === 'STUDENT') {
      where.studentId = user.id;
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        class: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ date: 'desc' }, { class: { name: 'asc' } }],
    });

    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/attendance - Record attendance
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
      return NextResponse.json({ success: false, error: 'Only teachers can record attendance' }, { status: 403 });
    }

    const body = await request.json();
    const validated = recordAttendanceSchema.parse(body);

    // Verify class ownership
    const classData = await db.class.findUnique({
      where: { id: validated.classId },
      select: { teacherId: true },
    });

    if (!classData) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }

    if (classData.teacherId !== user.id && user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const date = new Date(validated.date);
    const records = [];

    // Create or update attendance records
    for (const record of validated.records) {
      const attendance = await db.attendance.upsert({
        where: {
          classId_studentId_date: {
            classId: validated.classId,
            studentId: record.studentId,
            date,
          },
        },
        create: {
          classId: validated.classId,
          studentId: record.studentId,
          date,
          status: record.status,
          notes: record.notes,
          recordedBy: user.id,
        },
        update: {
          status: record.status,
          notes: record.notes,
          recordedBy: user.id,
        },
      });
      records.push(attendance);
    }

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error('Record attendance error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
