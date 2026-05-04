import { NextRequest, NextResponse } from 'next/server';
import { validateSession, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required').optional(),
  code: z.string().min(3, 'School code must be at least 3 characters').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
});

// PUT /api/schools/[id] - Update a school
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Only super admin can update schools
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only super admins can update schools' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateSchoolSchema.parse(body);

    // Check if school exists
    const existingSchool = await db.school.findUnique({ where: { id } });
    if (!existingSchool) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
    }

    // If code is being updated, check for duplicates
    if (validated.code && validated.code !== existingSchool.code) {
      const schoolWithCode = await db.school.findUnique({ where: { code: validated.code } });
      if (schoolWithCode) {
        return NextResponse.json({ success: false, error: 'School code already exists' }, { status: 400 });
      }
    }

    // Update school
    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.code) updateData.code = validated.code.toUpperCase();
    if (validated.email !== undefined) updateData.email = validated.email || null;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.address !== undefined) updateData.address = validated.address;
    if (validated.website !== undefined) updateData.website = validated.website;
    if (validated.description !== undefined) updateData.description = validated.description;
    updateData.updatedAt = new Date().toISOString();

    const school = await db.school.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, school });
  } catch (error) {
    console.error('Update school error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/schools/[id] - Delete a school
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    // Only super admin can delete schools
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Only super admins can delete schools' }, { status: 403 });
    }

    // Check if school exists
    const existingSchool = await db.school.findUnique({ where: { id } });
    if (!existingSchool) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 });
    }

    // Delete school (cascade will handle related records)
    await db.school.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete school error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
