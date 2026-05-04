import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

// SMZ Education Schools Data - 39 schools
const SCHOOLS_DATA = [
  { code: 'MNSK', name: 'Marina Nursery School & Kindergarten', email: 'info@mnsk.smzedu.com', address: 'Accra, Ghana', students: 890 },
  { code: 'GSMS', name: 'Ghana School of Modern Studies', email: 'info@gsms.smzedu.com', address: 'Accra, Ghana', students: 1200 },
  { code: 'YCIS', name: 'Younas College of Islamic Studies', email: 'info@ycis.smzedu.com', address: 'Accra, Ghana', students: 450 },
  { code: 'GPA', name: 'Ghana Police Academy', email: 'info@gpa.smzedu.com', address: 'Accra, Ghana', students: 780 },
  { code: 'SKMS', name: 'Sheikh Khalid Model School', email: 'info@skms.smzedu.com', address: 'Kumasi, Ghana', students: 650 },
  { code: 'EED', name: 'Excel Educational Center Dawhenya', email: 'info@eed.smzedu.com', address: 'Dawhenya, Ghana', students: 520 },
  { code: 'EBSA', name: 'Excel Business School Ashaiman', email: 'info@ebsa.smzedu.com', address: 'Ashaiman, Ghana', students: 890 },
  { code: 'DLA', name: 'Decent Learning Academy', email: 'info@dla.smzedu.com', address: 'Tema, Ghana', students: 430 },
  { code: 'RS', name: 'Rosda School', email: 'info@rs.smzedu.com', address: 'Accra, Ghana', students: 560 },
  { code: 'SIS', name: 'Success International School', email: 'info@sis.smzedu.com', address: 'Accra, Ghana', students: 720 },
  { code: 'MIS', name: 'Muslim International School', email: 'info@mis.smzedu.com', address: 'Accra, Ghana', students: 680 },
  { code: 'AES', name: 'Al-Azhar English School', email: 'info@aes.smzedu.com', address: 'Kumasi, Ghana', students: 540 },
  { code: 'FCS', name: 'Future Care School', email: 'info@fcs.smzedu.com', address: 'Takoradi, Ghana', students: 480 },
  { code: 'GPS', name: 'Green Pastures School', email: 'info@gps.smzedu.com', address: 'Cape Coast, Ghana', students: 620 },
  { code: 'HIS', name: 'Horizon International School', email: 'info@his.smzedu.com', address: 'Accra, Ghana', students: 950 },
  { code: 'ILS', name: 'Islamic Learning School', email: 'info@ils.smzedu.com', address: 'Tamale, Ghana', students: 390 },
  { code: 'JMS', name: 'Jamea Model School', email: 'info@jms.smzedu.com', address: 'Sunyani, Ghana', students: 450 },
  { code: 'KAS', name: 'Kingdom Academy School', email: 'info@kas.smzedu.com', address: 'Accra, Ghana', students: 780 },
  { code: 'LPS', name: 'Little Pearls School', email: 'info@lps.smzedu.com', address: 'Accra, Ghana', students: 340 },
  { code: 'MPS', name: 'Modern Prep School', email: 'info@mps.smzedu.com', address: 'Kumasi, Ghana', students: 560 },
  { code: 'NIS', name: 'Noble International School', email: 'info@nis.smzedu.com', address: 'Accra, Ghana', students: 670 },
  { code: 'OAS', name: 'Oxford Academy School', email: 'info@oas.smzedu.com', address: 'Tema, Ghana', students: 820 },
  { code: 'PIS', name: 'Premier International School', email: 'info@pis.smzedu.com', address: 'Accra, Ghana', students: 910 },
  { code: 'QAS', name: 'Quality Academy School', email: 'info@qas.smzedu.com', address: 'Sekondi, Ghana', students: 430 },
  { code: 'RMS', name: 'Rising Model School', email: 'info@rms.smzedu.com', address: 'Accra, Ghana', students: 550 },
  { code: 'SMS', name: 'Sunrise Model School', email: 'info@sms.smzedu.com', address: 'Koforidua, Ghana', students: 480 },
  { code: 'TIS', name: 'Trust International School', email: 'info@tis.smzedu.com', address: 'Accra, Ghana', students: 720 },
  { code: 'UIS', name: 'Unique International School', email: 'info@uis.smzedu.com', address: 'Ho, Ghana', students: 390 },
  { code: 'VIS', name: 'Victory International School', email: 'info@vis.smzedu.com', address: 'Accra, Ghana', students: 640 },
  { code: 'WIS', name: 'Wisdom International School', email: 'info@wis.smzedu.com', address: 'Wa, Ghana', students: 420 },
  { code: 'XIS', name: 'Excellence International School', email: 'info@xis.smzedu.com', address: 'Accra, Ghana', students: 580 },
  { code: 'YPS', name: 'Young Professionals School', email: 'info@yps.smzedu.com', address: 'Bolgatanga, Ghana', students: 350 },
  { code: 'ZIS', name: 'Zenith International School', email: 'info@zis.smzedu.com', address: 'Accra, Ghana', students: 690 },
  { code: 'APS', name: 'Al-Adab Preparatory School', email: 'info@aps.smzedu.com', address: 'Kumasi, Ghana', students: 520 },
  { code: 'BIS', name: 'Bright International School', email: 'info@bis.smzedu.com', address: 'Accra, Ghana', students: 760 },
  { code: 'CIS', name: 'Crescent International School', email: 'info@cis.smzedu.com', address: 'Tamale, Ghana', students: 480 },
  { code: 'DIS', name: 'Diamond International School', email: 'info@dis.smzedu.com', address: 'Accra, Ghana', students: 610 },
  { code: 'EMS', name: 'Excellence Model School', email: 'info@ems.smzedu.com', address: 'Sunyani, Ghana', students: 540 },
]

// Generate CUID-style ID
function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${prefix}${timestamp}${random}`
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'status'

  try {
    // STATUS - Get current database status
    if (action === 'status') {
      const schoolsResult = await db.execute('SELECT id, code, name FROM School')
      const usersResult = await db.execute('SELECT COUNT(*) as count FROM User')
      const usersWithSchoolResult = await db.execute('SELECT COUNT(*) as count FROM User WHERE schoolId IS NOT NULL')
      const usersBySchoolResult = await db.execute(`
        SELECT s.code, s.name, COUNT(u.id) as userCount
        FROM School s
        LEFT JOIN User u ON u.schoolId = s.id
        GROUP BY s.id
        ORDER BY s.code
      `)

      return NextResponse.json({
        success: true,
        status: {
          totalSchools: schoolsResult.rows.length,
          totalUsers: usersResult.rows[0]?.count || 0,
          usersWithSchool: usersWithSchoolResult.rows[0]?.count || 0,
          schools: schoolsResult.rows,
          usersBySchool: usersBySchoolResult.rows
        }
      })
    }

    // FRESH-START - Wipe everything and start clean
    if (action === 'fresh-start') {
      console.log('[seed-batch] Starting fresh wipe...')

      // Delete in correct order due to foreign keys
      await db.execute('DELETE FROM Session')
      await db.execute('DELETE FROM Notification')
      await db.execute('DELETE FROM Message')
      await db.execute('DELETE FROM Announcement')
      await db.execute('DELETE FROM Grade')
      await db.execute('DELETE FROM Submission')
      await db.execute('DELETE FROM Attendance')
      await db.execute('DELETE FROM Enrollment')
      await db.execute('DELETE FROM Schedule')
      await db.execute('DELETE FROM Assignment')
      await db.execute('DELETE FROM Class')
      await db.execute('DELETE FROM File')
      await db.execute('DELETE FROM User')
      await db.execute('DELETE FROM School')

      console.log('[seed-batch] Wipe complete')

      // Re-create admin user
      const adminId = generateId('admin_')
      const hashedPassword = await hashPassword('password123')

      await db.execute({
        sql: `INSERT INTO User (id, email, password, name, role, isActive, isVerified, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 1, 1, datetime('now'), datetime('now'))`,
        args: [adminId, 'admin@smzedu.com', hashedPassword, 'System Administrator']
      })

      console.log('[seed-batch] Admin user recreated')

      return NextResponse.json({
        success: true,
        message: 'Fresh start complete. All data wiped and admin user recreated.',
        adminCredentials: {
          email: 'admin@smzedu.com',
          password: 'password123'
        }
      })
    }

    // SEED-SCHOOLS - Create all 39 schools
    if (action === 'seed-schools') {
      console.log('[seed-batch] Creating schools...')

      let created = 0
      let existing = 0

      for (const school of SCHOOLS_DATA) {
        // Check if school exists
        const existingSchool = await db.execute({
          sql: 'SELECT id FROM School WHERE code = ?',
          args: [school.code]
        })

        if (existingSchool.rows.length > 0) {
          existing++
          continue
        }

        // Create school with a deterministic ID based on code
        const schoolId = `school_${school.code.toLowerCase()}_${Date.now()}`

        await db.execute({
          sql: `INSERT INTO School (id, name, code, email, address, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
          args: [schoolId, school.name, school.code, school.email, school.address]
        })

        created++
      }

      console.log(`[seed-batch] Schools created: ${created}, existing: ${existing}`)

      return NextResponse.json({
        success: true,
        message: `Schools seeding complete. Created: ${created}, Already existed: ${existing}`,
        schoolsCreated: created,
        schoolsExisting: existing
      })
    }

    // SEED-USERS - Create users for schools
    if (action === 'seed-users') {
      const batchSize = parseInt(searchParams.get('batch') || '100')
      const offset = parseInt(searchParams.get('offset') || '0')

      console.log(`[seed-batch] Seeding users batch: offset=${offset}, size=${batchSize}`)

      // Get all schools with their IDs
      const schoolsResult = await db.execute('SELECT id, code, name FROM School')

      if (schoolsResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No schools found. Run seed-schools first.'
        }, { status: 400 })
      }

      // Create a map of school code to school ID
      const schoolMap = new Map<string, string>()
      for (const row of schoolsResult.rows) {
        const code = row.code as string
        const id = row.id as string
        schoolMap.set(code, id)
        schoolMap.set(code.toLowerCase(), id) // Also store lowercase
      }

      console.log('[seed-batch] School map:', Object.fromEntries(schoolMap))

      // Find the school data for each code
      const schoolDataMap = new Map(SCHOOLS_DATA.map(s => [s.code, s]))

      // Calculate which users to create
      const hashedPassword = await hashPassword('password123')
      let usersCreated = 0
      let usersSkipped = 0
      let totalUsersCreated = 0
      let currentOffset = 0
      let stopBatch = false

      for (const school of SCHOOLS_DATA) {
        if (stopBatch) break

        const schoolId = schoolMap.get(school.code)
        if (!schoolId) {
          console.log(`[seed-batch] WARNING: School ID not found for code ${school.code}`)
          continue
        }

        console.log(`[seed-batch] Processing school ${school.code} with ID ${schoolId}`)

        // Create students for this school
        for (let i = 1; i <= school.students; i++) {
          if (currentOffset < offset) {
            currentOffset++
            continue
          }

          if (usersCreated >= batchSize) {
            stopBatch = true
            break
          }

          const studentNum = i
          const email = `student${studentNum}.${school.code.toLowerCase()}@smzedu.com`

          // Check if user exists
          const existingUser = await db.execute({
            sql: 'SELECT id FROM User WHERE email = ?',
            args: [email]
          })

          if (existingUser.rows.length > 0) {
            usersSkipped++
            currentOffset++
            continue
          }

          const userId = generateId('user_')
          const name = `Student ${studentNum} ${school.code}`

          // CRITICAL: Use raw SQL with explicit schoolId
          try {
            await db.execute({
              sql: `INSERT INTO User (id, email, password, name, role, schoolId, isActive, isVerified, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, 'STUDENT', ?, 1, 1, datetime('now'), datetime('now'))`,
              args: [userId, email, hashedPassword, name, schoolId]
            })

            // Verify the insert worked
            const verifyResult = await db.execute({
              sql: 'SELECT id, email, schoolId FROM User WHERE id = ?',
              args: [userId]
            })

            if (verifyResult.rows.length > 0) {
              const insertedUser = verifyResult.rows[0]
              if (insertedUser.schoolId === schoolId) {
                usersCreated++
              } else {
                console.log(`[seed-batch] ERROR: User ${email} has wrong schoolId: ${insertedUser.schoolId} (expected ${schoolId})`)
              }
            }
          } catch (insertError) {
            console.log(`[seed-batch] Error creating user ${email}:`, insertError)
          }

          currentOffset++
        }
      }

      // Get updated stats
      const totalUsersResult = await db.execute('SELECT COUNT(*) as count FROM User')
      const usersWithSchoolResult = await db.execute('SELECT COUNT(*) as count FROM User WHERE schoolId IS NOT NULL')

      console.log(`[seed-batch] Batch complete. Created: ${usersCreated}, Skipped: ${usersSkipped}`)

      return NextResponse.json({
        success: true,
        message: `Batch complete. Created ${usersCreated} users, skipped ${usersSkipped} existing.`,
        batch: {
          offset,
          size: batchSize,
          created: usersCreated,
          skipped: usersSkipped
        },
        totals: {
          totalUsers: totalUsersResult.rows[0]?.count || 0,
          usersWithSchool: usersWithSchoolResult.rows[0]?.count || 0
        },
        hasMore: !stopBatch && usersCreated >= batchSize
      })
    }

    // FIX-USERS - Fix users that have NULL schoolId
    if (action === 'fix-users') {
      console.log('[seed-batch] Fixing users with NULL schoolId...')

      // Get all schools with their IDs
      const schoolsResult = await db.execute('SELECT id, code FROM School')
      const schoolMap = new Map<string, string>()
      for (const row of schoolsResult.rows) {
        schoolMap.set(row.code as string, row.id as string)
        schoolMap.set((row.code as string).toLowerCase(), row.id as string)
      }

      // Get users with NULL schoolId
      const nullSchoolUsers = await db.execute(`
        SELECT id, email FROM User
        WHERE schoolId IS NULL AND email LIKE '%@smzedu.com' AND role = 'STUDENT'
      `)

      console.log(`[seed-batch] Found ${nullSchoolUsers.rows.length} users with NULL schoolId`)

      let fixed = 0
      let notFound = 0

      for (const user of nullSchoolUsers.rows) {
        const email = user.email as string
        const userId = user.id as string

        // Extract school code from email: student1.mnsk@smzedu.com -> mnsk
        const match = email.match(/student\d+\.([a-z]+)@smzedu\.com/i)
        if (match) {
          const schoolCode = match[1].toUpperCase()
          const schoolId = schoolMap.get(schoolCode)

          if (schoolId) {
            await db.execute({
              sql: 'UPDATE User SET schoolId = ?, updatedAt = datetime(\'now\') WHERE id = ?',
              args: [schoolId, userId]
            })
            fixed++
          } else {
            notFound++
            console.log(`[seed-batch] School not found for code: ${schoolCode}`)
          }
        } else {
          notFound++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Fixed ${fixed} users. School not found for ${notFound} users.`,
        fixed,
        notFound,
        totalProcessed: nullSchoolUsers.rows.length
      })
    }

    return NextResponse.json({
      success: false,
      error: `Unknown action: ${action}. Valid actions: status, fresh-start, seed-schools, seed-users, fix-users`
    }, { status: 400 })

  } catch (error) {
    console.error('[seed-batch] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}