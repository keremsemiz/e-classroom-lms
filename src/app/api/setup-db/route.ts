import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

// This endpoint sets up the database tables and seeds admin user
// Call it ONCE after deployment: /api/setup-db

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!databaseUrl || !authToken) {
    return NextResponse.json({
      success: false,
      error: 'Database environment variables not set'
    }, { status: 500 })
  }

  const db = createClient({
    url: databaseUrl,
    authToken: authToken,
  })

  try {
    console.log('[setup-db] Checking existing tables...')

    // Check if User table exists
    const tableCheck = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
    )

    if (tableCheck.rows.length === 0) {
      console.log('[setup-db] Creating tables...')

      // Create all tables
      await db.execute(`
        CREATE TABLE IF NOT EXISTS School (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          domain TEXT,
          logo TEXT,
          address TEXT,
          phone TEXT,
          email TEXT,
          website TEXT,
          description TEXT,
          settings TEXT,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS User (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'STUDENT',
          schoolId TEXT REFERENCES School(id),
          avatar TEXT,
          phone TEXT,
          bio TEXT,
          dateOfBirth TEXT,
          address TEXT,
          isActive INTEGER DEFAULT 1,
          isVerified INTEGER DEFAULT 0,
          lastLogin TEXT,
          preferences TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Class (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          description TEXT,
          subject TEXT,
          gradeLevel TEXT,
          academicYear TEXT,
          room TEXT,
          schedule TEXT,
          coverImage TEXT,
          color TEXT DEFAULT '#3B82F6',
          teacherId TEXT NOT NULL REFERENCES User(id),
          schoolId TEXT REFERENCES School(id),
          isActive INTEGER DEFAULT 1,
          allowStudentPosts INTEGER DEFAULT 1,
          allowStudentChat INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Enrollment (
          id TEXT PRIMARY KEY,
          classId TEXT NOT NULL REFERENCES Class(id) ON DELETE CASCADE,
          studentId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'ACTIVE',
          enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
          droppedAt TEXT,
          UNIQUE(classId, studentId)
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Session (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          userAgent TEXT,
          ipAddress TEXT,
          expiresAt TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Assignment (
          id TEXT PRIMARY KEY,
          classId TEXT NOT NULL REFERENCES Class(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          instructions TEXT,
          assignmentType TEXT DEFAULT 'HOMEWORK',
          points REAL DEFAULT 100,
          dueDate TEXT,
          allowLateSubmission INTEGER DEFAULT 0,
          latePenalty REAL,
          maxAttempts INTEGER DEFAULT 1,
          attachments TEXT,
          rubric TEXT,
          status TEXT DEFAULT 'DRAFT',
          publishedAt TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Submission (
          id TEXT PRIMARY KEY,
          assignmentId TEXT NOT NULL REFERENCES Assignment(id) ON DELETE CASCADE,
          studentId TEXT NOT NULL REFERENCES User(id),
          content TEXT,
          attachments TEXT,
          submittedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          attemptNumber INTEGER DEFAULT 1,
          status TEXT DEFAULT 'SUBMITTED',
          late INTEGER DEFAULT 0,
          resubmittedAt TEXT,
          gradeId TEXT UNIQUE,
          UNIQUE(assignmentId, studentId, attemptNumber)
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Grade (
          id TEXT PRIMARY KEY,
          submissionId TEXT UNIQUE NOT NULL REFERENCES Submission(id),
          assignmentId TEXT NOT NULL REFERENCES Assignment(id),
          studentId TEXT NOT NULL REFERENCES User(id),
          score REAL NOT NULL,
          maxScore REAL DEFAULT 100,
          percentage REAL,
          letterGrade TEXT,
          feedback TEXT,
          rubricScores TEXT,
          gradedBy TEXT NOT NULL REFERENCES User(id),
          gradedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          isFinal INTEGER DEFAULT 1,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Attendance (
          id TEXT PRIMARY KEY,
          classId TEXT NOT NULL REFERENCES Class(id) ON DELETE CASCADE,
          studentId TEXT NOT NULL REFERENCES User(id),
          date TEXT NOT NULL,
          status TEXT DEFAULT 'PRESENT',
          checkInTime TEXT,
          notes TEXT,
          recordedBy TEXT NOT NULL REFERENCES User(id),
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(classId, studentId, date)
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Message (
          id TEXT PRIMARY KEY,
          senderId TEXT NOT NULL REFERENCES User(id),
          receiverId TEXT NOT NULL REFERENCES User(id),
          subject TEXT,
          content TEXT NOT NULL,
          read INTEGER DEFAULT 0,
          readAt TEXT,
          archived INTEGER DEFAULT 0,
          starred INTEGER DEFAULT 0,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Announcement (
          id TEXT PRIMARY KEY,
          classId TEXT REFERENCES Class(id) ON DELETE CASCADE,
          authorId TEXT NOT NULL REFERENCES User(id),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          priority INTEGER DEFAULT 0,
          pinned INTEGER DEFAULT 0,
          expiresAt TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Notification (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          link TEXT,
          read INTEGER DEFAULT 0,
          readAt TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS File (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          originalName TEXT NOT NULL,
          path TEXT NOT NULL,
          size INTEGER NOT NULL,
          mimeType TEXT NOT NULL,
          category TEXT,
          uploadedBy TEXT NOT NULL REFERENCES User(id),
          isPublic INTEGER DEFAULT 0,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await db.execute(`
        CREATE TABLE IF NOT EXISTS Schedule (
          id TEXT PRIMARY KEY,
          classId TEXT NOT NULL REFERENCES Class(id) ON DELETE CASCADE,
          dayOfWeek INTEGER NOT NULL,
          startTime TEXT NOT NULL,
          endTime TEXT NOT NULL,
          room TEXT,
          notes TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Create indexes
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_school_code ON School(code)`)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_email ON User(email)`)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_schoolId ON User(schoolId)`)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_role ON User(role)`)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_class_code ON Class(code)`)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_class_teacherId ON Class(teacherId)`)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_session_token ON Session(token)`)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_session_userId ON Session(userId)`)

      console.log('[setup-db] Tables created successfully')
    }

    // Check if admin user exists
    const existingAdmin = await db.execute({
      sql: "SELECT id, email, role FROM User WHERE email = ?",
      args: ['admin@smzedu.com']
    })

    if (existingAdmin.rows.length > 0) {
      // Update the admin password with a fresh hash
      console.log('[setup-db] Updating admin password with fresh hash...')
      const freshHash = await bcrypt.hash('password123', 12)

      await db.execute({
        sql: 'UPDATE User SET password = ? WHERE email = ?',
        args: [freshHash, 'admin@smzedu.com']
      })

      // Verify the hash works
      const testCompare = await bcrypt.compare('password123', freshHash)

      return NextResponse.json({
        success: true,
        message: 'Admin password updated with fresh hash',
        adminCredentials: {
          email: 'admin@smzedu.com',
          password: 'password123'
        },
        hashVerified: testCompare
      })
    }

    // Create admin user with fresh hash
    console.log('[setup-db] Creating admin user...')
    const hashedPassword = await bcrypt.hash('password123', 12)

    const adminId = generateCuid()
    await db.execute({
      sql: `INSERT INTO User (id, email, password, name, role, isActive, isVerified)
            VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 1, 1)`,
      args: [adminId, 'admin@smzedu.com', hashedPassword, 'System Admin']
    })

    // Verify the hash works
    const testCompare = await bcrypt.compare('password123', hashedPassword)

    console.log('[setup-db] Admin user created')

    return NextResponse.json({
      success: true,
      message: 'Database setup complete! Tables created and admin user seeded.',
      tablesCreated: true,
      adminCreated: true,
      adminCredentials: {
        email: 'admin@smzedu.com',
        password: 'password123'
      },
      hashVerified: testCompare
    })

  } catch (error) {
    console.error('[setup-db] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Simple CUID generator
function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${random}`
}
