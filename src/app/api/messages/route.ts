import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const sendMessageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().optional(),
  content: z.string().min(1, 'Message content is required'),
});

// GET /api/messages - Get messages
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
    const type = searchParams.get('type'); // 'inbox' or 'sent'

    const messages = await db.message.findMany({
      where: type === 'sent' 
        ? { senderId: user.id }
        : { receiverId: user.id },
      include: {
        sender: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get unread count
    const unreadCount = await db.message.count({
      where: {
        receiverId: user.id,
        read: false,
      },
    });

    return NextResponse.json({ success: true, messages, unreadCount });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messages - Send message
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

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    // Verify receiver exists
    const receiver = await db.user.findUnique({
      where: { id: validated.receiverId },
      select: { id: true, name: true },
    });

    if (!receiver) {
      return NextResponse.json({ success: false, error: 'Receiver not found' }, { status: 404 });
    }

    const message = await db.message.create({
      data: {
        senderId: user.id,
        receiverId: validated.receiverId,
        subject: validated.subject,
        content: validated.content,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Create notification for receiver
    await db.notification.create({
      data: {
        userId: validated.receiverId,
        type: 'MESSAGE',
        title: 'New Message',
        message: `${user.name} sent you a message`,
        link: '#/messages',
      },
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
