import { NextRequest, NextResponse } from 'next/server';
import { validateSession, isTeacher, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createAnnouncementSchema = z.object({
  classId: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  content: z.string().min(1, 'Content is required'),
  priority: z.number().optional(),
  pinned: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

// GET /api/announcements - Get announcements
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

    const where: Record<string, unknown> = {};

    if (classId) {
      where.classId = classId;
    } else if (user.role === 'STUDENT') {
      // Students see announcements from their enrolled classes
      where.class = {
        enrollments: {
          some: { studentId: user.id, status: 'ACTIVE' },
        },
      };
    } else if (user.role === 'TEACHER') {
      // Teachers see their own announcements
      where.authorId = user.id;
    }

    const announcements = await db.announcement.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        class: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: [
        { pinned: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    });

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/announcements - Create announcement
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
      return NextResponse.json({ success: false, error: 'Only teachers can create announcements' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createAnnouncementSchema.parse(body);

    // If classId provided, verify ownership
    if (validated.classId) {
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

      // Create announcement
      const announcement = await db.announcement.create({
        data: {
          classId: validated.classId,
          authorId: user.id,
          title: validated.title,
          content: validated.content,
          priority: validated.priority || 0,
          pinned: validated.pinned || false,
          expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          class: { select: { id: true, name: true } },
        },
      });

      // Notify students
      const studentIds = classData.enrollments.map(e => e.studentId);
      await db.notification.createMany({
        data: studentIds.map(studentId => ({
          userId: studentId,
          type: 'ANNOUNCEMENT',
          title: 'New Announcement',
          message: validated.title,
          link: `#/classes/${validated.classId}`,
        })),
      });

      return NextResponse.json({ success: true, announcement }, { status: 201 });
    } else {
      // School-wide announcement (admin only)
      if (!isAdmin(user)) {
        return NextResponse.json({ success: false, error: 'Only admins can create school-wide announcements' }, { status: 403 });
      }

      const announcement = await db.announcement.create({
        data: {
          authorId: user.id,
          title: validated.title,
          content: validated.content,
          priority: validated.priority || 0,
          pinned: validated.pinned || false,
          expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        },
      });

      return NextResponse.json({ success: true, announcement }, { status: 201 });
    }
  } catch (error) {
    console.error('Create announcement error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
