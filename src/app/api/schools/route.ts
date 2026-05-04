import { NextRequest, NextResponse } from 'next/server';
import { validateSession, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const createSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  code: z.string().min(3, 'School code must be at least 3 characters'),
  domain: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
});

// GET /api/schools - Get all schools
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

    if (!isAdmin(user)) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const schools = await db.school.findMany({
      include: {
        _count: {
          select: { users: true, classes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, schools });
  } catch (error) {
    console.error('Get schools error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/schools - Create a new school
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

    // Only super admin can create schools
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only super admins can create schools' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createSchoolSchema.parse(body);

    // Check if school code already exists
    const existingSchool = await db.school.findUnique({
      where: { code: validated.code },
    });

    if (existingSchool) {
      return NextResponse.json({ success: false, error: 'School code already exists' }, { status: 400 });
    }

    const school = await db.school.create({
      data: {
        name: validated.name,
        code: validated.code.toUpperCase(),
        domain: validated.domain,
        email: validated.email || null,
        phone: validated.phone,
        address: validated.address,
        website: validated.website,
        description: validated.description,
      },
    });

    return NextResponse.json({ success: true, school }, { status: 201 });
  } catch (error) {
    console.error('Create school error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
