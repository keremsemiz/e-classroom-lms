import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

// SMZ Education Network Schools - 39 Schools
const SCHOOLS = [
  { name: "Marina Nursery School & Kindergarten", code: "MNSK", location: "Accra, Ghana", type: "Nursery/Kindergarten" },
  { name: "Great Stars Montessori School", code: "GSMS", location: "Accra, Ghana", type: "Montessori" },
  { name: "Young Christian International School", code: "YCIS", location: "Accra, Ghana", type: "International" },
  { name: "Glorious Prince Academy", code: "GPA", location: "Accra, Ghana", type: "Academy" },
  { name: "Theobeth Grandee School", code: "TGS", location: "Accra, Ghana", type: "Primary" },
  { name: "Natbek School", code: "NS", location: "Accra, Ghana", type: "Primary" },
  { name: "Virgins Preparatory School", code: "VPS", location: "Accra, Ghana", type: "Preparatory" },
  { name: "Zion Academy", code: "ZA", location: "Accra, Ghana", type: "Academy" },
  { name: "Arose Academy", code: "AA", location: "Accra, Ghana", type: "Academy" },
  { name: "Prime Will Academy", code: "PWA", location: "Accra, Ghana", type: "Academy" },
  { name: "Victory Kids Complex", code: "VKC", location: "Accra, Ghana", type: "Nursery/Primary" },
  { name: "Nole Royals International School", code: "NRIS", location: "Accra, Ghana", type: "International" },
  { name: "Apostolic Church Academy", code: "ACA", location: "Accra, Ghana", type: "Faith-based" },
  { name: "Joeracle Preparatory School", code: "JPS", location: "Accra, Ghana", type: "Preparatory" },
  { name: "St Thomas G4 International School", code: "STG4", location: "Accra, Ghana", type: "International" },
  { name: "Lizzy Montessori", code: "LM", location: "Accra, Ghana", type: "Montessori" },
  { name: "Daniel Vision School", code: "DVS", location: "Accra, Ghana", type: "Primary" },
  { name: "Zamsa Academy", code: "ZamA", location: "Accra, Ghana", type: "Academy" },
  { name: "I. J. J. International School", code: "IJJIS", location: "Accra, Ghana", type: "International" },
  { name: "Divine Overcomers Academy", code: "DOA", location: "Accra, Ghana", type: "Faith-based" },
  { name: "Jokese Montessori School", code: "JMS", location: "Accra, Ghana", type: "Montessori" },
  { name: "Vision Redeemers Academy", code: "VRA", location: "Accra, Ghana", type: "Academy" },
  { name: "Golden Spring School", code: "GSS", location: "Accra, Ghana", type: "Primary" },
  { name: "Peace Home Education Centre", code: "PHEC", location: "Accra, Ghana", type: "Education Centre" },
  { name: "Golden Grace Mercedes School", code: "GGMS", location: "Accra, Ghana", type: "Primary" },
  { name: "Heaven Seed Academy", code: "HSA", location: "Accra, Ghana", type: "Academy" },
  { name: "Shalom Revival Mission School", code: "SRMS", location: "Accra, Ghana", type: "Faith-based" },
  { name: "Rao Royal Memorial School", code: "RRMS", location: "Accra, Ghana", type: "Primary" },
  { name: "Divine Extra Tuition Academy", code: "DETA", location: "Accra, Ghana", type: "Tuition Centre" },
  { name: "God's Field Montessori School", code: "GFMS", location: "Accra, Ghana", type: "Montessori" },
  { name: "Greenland International School", code: "GIS", location: "Accra, Ghana", type: "International" },
  { name: "Legacyfield Montessori School", code: "LfMS", location: "Accra, Ghana", type: "Montessori" },
  { name: "GARDCCA - Greater Accra Regional Daycare Centres Association", code: "GARDCCA", location: "Accra, Ghana", type: "Association" },
  { name: "Winterville Rangers Montessori School", code: "WRMS", location: "Accra, Ghana", type: "Montessori" },
  { name: "Decent Learning Academy", code: "DLA", location: "Accra, Ghana", type: "Academy" },
  { name: "Rosda School", code: "RS", location: "Accra, Ghana", type: "Primary" },
  { name: "St. K Michael's School", code: "SKMS", location: "Accra, Ghana", type: "Primary" },
  { name: "École EVA Dakar", code: "EED", location: "Dakar, Senegal", type: "International" },
  { name: "École Bilingue Shiloh Académie", code: "EBSA", location: "Gandigal-Est, Senegal", type: "Bilingual" },
]

// Extended West African names
const FIRST_NAMES_MALE = [
  "Kwame", "Kofi", "Kwesi", "Yaw", "Kojo", "Kwabena", "Kwaku", "Akwasi", "Yao", "Kwasi",
  "Kwadwo", "Mawuena", "Mawuko", "Selorm", "Kafui", "Dzifa", "Etornam", "Eyram", "Delali", "Dela",
  "Nii", "Nii Ama", "Nii Laryea", "Laryea", "Amarfio", "Okai", "Ayi", "Adjetey", "Aryertey",
  "Abdul", "Ibrahim", "Mohammed", "Ahmed", "Omar", "Ali", "Hassan", "Hussein", "Yusuf", "Khalid",
  "Emmanuel", "Samuel", "Daniel", "Michael", "David", "Joseph", "Joshua", "Gabriel", "Andrew", "Peter",
  "John", "James", "Thomas", "Matthew", "Mark", "Luke", "Paul", "Stephen", "Philip", "Simon",
  "Benjamin", "Isaac", "Abraham", "Moses", "Aaron", "Elijah", "Nathaniel", "Timothy", "Jonathan",
  "Cheikh", "Mamadou", "Ousmane", "Ibrahima", "Modou", "Pape", "Serigne", "Moustapha", "Abdou", "Samba",
  "Chukwuemeka", "Emeka", "Olufemi", "Femi", "Olumide", "Adebayo", "Chinedu", "Obinna", "Uche", "Nnamdi",
  "Tunde", "Bayo", "Tobi", "Seyi", "Kunle", "Wale", "Dele", "Nana", "Ohene", "Osei"
]

const FIRST_NAMES_FEMALE = [
  "Ama", "Akua", "Yaa", "Adwoa", "Afia", "Akosua", "Abena", "Efua", "Adisa", "Esi",
  "Adzo", "Mawuenyega", "Selorm", "Mawusi", "Enyonam", "Eyram", "Dzifa", "Kafui", "Delali", "Dela",
  "Naa", "Naa Lamiley", "Naa Dede", "Dede", "Aku", "Fatima", "Amina", "Khadija", "Zainab", "Aisha",
  "Mary", "Martha", "Ruth", "Esther", "Hannah", "Sarah", "Rebecca", "Rachel", "Elizabeth", "Grace",
  "Joyce", "Patricia", "Jennifer", "Michelle", "Catherine", "Margaret", "Victoria", "Beatrice",
  "Gloria", "Juliet", "Sandra", "Nancy", "Alice", "Helen", "Linda", "Susan", "Patience", "Gifty",
  "Fatou", "Mariama", "Aissatou", "Fatoumata", "Khady", "Coumba", "Dieynaba", "Marieme", "Ndeye", "Sokhna",
  "Chioma", "Ngozi", "Oluchi", "Chidinma", "Chiamaka", "Nneka", "Funke", "Tolu", "Tomi", "Bunmi"
]

const LAST_NAMES = [
  "Mensah", "Owusu", "Amponsah", "Boateng", "Osei", "Asante", "Danso", "Adu", "Oppong", "Kwaku",
  "Agyeman", "Appiah", "Kwarteng", "Adjei", "Darko", "Tetteh", "Aryee", "Quarshie", "Lartey", "Nartey",
  "Anim", "Addo", "Oteng", "Ofori", "Koranteng", "Manu", "Aidoo", "Donkor", "Fosu", "Bempah",
  "Asare", "Kuffour", "Agyapong", "Asamoah", "Frimpong", "Bonsu", "Agyei", "Boakye", "Obeng", "Mireku",
  "Okyere", "Prempeh", "Sarpong", "Ampofo", "Antwi", "Bediako", "Laryea", "Amarfio", "Okai", "Ayi",
  "Adjetey", "Aryertey", "Lamptey", "Quaye", "Doe", "Gbedemah", "Kumah", "Kudzo", "Adzah", "Agbe",
  "Abdulai", "Alhassan", "Baba", "Dauda", "Haruna", "Idrissu", "Mahama", "Mumuni", "Salifu", "Seidu",
  "Diouf", "Ndiaye", "Fall", "Sow", "Ba", "Gueye", "Seck", "Diallo", "Niang", "Thiam",
  "Mbaye", "Sarr", "Sy", "Ndao", "Kane", "Cisse", "Toure", "Faye", "Diop", "Adeyemi",
  "Adeoye", "Adesina", "Adewale", "Adebayo", "Chukwuemeka", "Nwosu", "Okafor", "Okeke", "Eze", "Igwe"
]

let idCounter = 0

function generateId(): string {
  idCounter++
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `c${timestamp}${random}${idCounter}`
}

function randomPhone(): string {
  const prefixes = ['020', '024', '027', '050', '054', '055']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return `+233 ${prefix} ${number.substring(0, 3)} ${number.substring(3)}`
}

let cachedHashedPassword: string | null = null

async function getHashedPassword(): Promise<string> {
  if (!cachedHashedPassword) {
    cachedHashedPassword = await bcrypt.hash('password123', 12)
  }
  return cachedHashedPassword
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'status'
  const schoolIndex = parseInt(searchParams.get('schoolIndex') || '0')
  const userOffset = parseInt(searchParams.get('userOffset') || '0')
  const userBatchSize = parseInt(searchParams.get('userBatch') || '200')

  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!databaseUrl || !authToken) {
    return NextResponse.json({ success: false, error: 'Database environment variables not set' }, { status: 500 })
  }

  const db = createClient({ url: databaseUrl, authToken: authToken })

  try {
    const startTime = Date.now()

    if (action === 'status') {
      const schoolCount = await db.execute('SELECT COUNT(*) as count FROM School')
      const userCount = await db.execute('SELECT COUNT(*) as count FROM User WHERE role != \'SUPER_ADMIN\'')
      
      return NextResponse.json({
        success: true,
        action: 'status',
        currentSchools: Number(schoolCount.rows[0]?.count || 0),
        currentUsers: Number(userCount.rows[0]?.count || 0),
        targetSchools: SCHOOLS.length,
        totalTargetUsers: '~34,640',
        defaultPassword: 'password123'
      })
    }

    if (action === 'init') {
      console.log('[seed-batch] Initializing database...')
      
      await db.execute("DELETE FROM Grade")
      await db.execute("DELETE FROM Submission")
      await db.execute("DELETE FROM Attendance")
      await db.execute("DELETE FROM Enrollment")
      await db.execute("DELETE FROM Assignment")
      await db.execute("DELETE FROM Announcement")
      await db.execute("DELETE FROM Message")
      await db.execute("DELETE FROM Notification")
      await db.execute("DELETE FROM Session")
      await db.execute("DELETE FROM File")
      await db.execute("DELETE FROM Schedule")
      await db.execute("DELETE FROM Class")
      await db.execute("DELETE FROM User WHERE role != 'SUPER_ADMIN'")
      await db.execute("DELETE FROM School")

      return NextResponse.json({
        success: true,
        action: 'init',
        message: 'Database cleared',
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        nextStep: { action: 'seed-schools', description: 'Call with action=seed-schools' }
      })
    }

    if (action === 'seed-schools') {
      console.log('[seed-batch] Creating schools...')
      let created = 0
      let skipped = 0
      
      for (const schoolData of SCHOOLS) {
        // Check if school already exists
        const existing = await db.execute({
          sql: 'SELECT id FROM School WHERE code = ?',
          args: [schoolData.code]
        })
        
        if (existing.rows.length > 0) {
          skipped++
          continue
        }
        
        const schoolId = generateId()
        await db.execute({
          sql: `INSERT INTO School (id, name, code, address, email, isActive, description) VALUES (?, ?, ?, ?, ?, 1, ?)`,
          args: [schoolId, schoolData.name, schoolData.code, schoolData.location, `info@${schoolData.code.toLowerCase()}.smzedu.com`, `${schoolData.type} - SMZ Education`]
        })
        created++
      }

      return NextResponse.json({
        success: true,
        action: 'seed-schools',
        message: `Created ${created} schools, ${skipped} already existed`,
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        nextStep: { action: 'seed-users', schoolIndex: 0, userOffset: 0, description: 'Start seeding users' }
      })
    }

    if (action === 'seed-users') {
      if (schoolIndex < 0 || schoolIndex >= SCHOOLS.length) {
        return NextResponse.json({
          success: true,
          action: 'seed-users',
          complete: true,
          message: 'All schools seeded!',
          summary: { totalSchools: SCHOOLS.length, defaultPassword: 'password123' }
        })
      }

      const schoolData = SCHOOLS[schoolIndex]
      const schoolResult = await db.execute({ sql: 'SELECT id FROM School WHERE code = ?', args: [schoolData.code] })
      
      if (schoolResult.rows.length === 0) {
        // School doesn't exist, skip to next
        return NextResponse.json({
          success: true,
          action: 'seed-users',
          school: { code: schoolData.code, name: schoolData.name, index: schoolIndex, total: SCHOOLS.length },
          message: 'School not found, skipping',
          nextStep: { action: 'seed-users', schoolIndex: schoolIndex + 1, userOffset: 0 }
        })
      }
      
      const schoolId = schoolResult.rows[0].id as string
      const hashedPassword = await getHashedPassword()
      
      const baseUsers = schoolData.code === 'GARDCCA' ? 1200 : 880
      const adminCount = Math.floor(baseUsers * 0.015)
      const teacherCount = Math.floor(baseUsers * 0.05)
      const studentCount = baseUsers - teacherCount - adminCount
      const totalUsers = adminCount + teacherCount + studentCount
      
      // Check how many users already exist for this school
      const existingCount = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM User WHERE schoolId = ?',
        args: [schoolId]
      })
      const existingUsers = Number(existingCount.rows[0]?.count || 0)
      
      // If school is complete, move to next
      if (existingUsers >= totalUsers) {
        return NextResponse.json({
          success: true,
          action: 'seed-users',
          school: { code: schoolData.code, name: schoolData.name, index: schoolIndex, total: SCHOOLS.length },
          message: 'School already complete',
          nextStep: { action: 'seed-users', schoolIndex: schoolIndex + 1, userOffset: 0 }
        })
      }
      
      // Start from where we left off
      let currentIndex = Math.max(userOffset, existingUsers)
      let insertedThisBatch = 0
      
      while (currentIndex < totalUsers && insertedThisBatch < userBatchSize) {
        let userRole: string, userNumber: number
        
        if (currentIndex < adminCount) {
          userRole = 'SCHOOL_ADMIN'
          userNumber = currentIndex + 1
        } else if (currentIndex < adminCount + teacherCount) {
          userRole = 'TEACHER'
          userNumber = currentIndex - adminCount + 1
        } else {
          userRole = 'STUDENT'
          userNumber = currentIndex - adminCount - teacherCount + 1
        }
        
        const isMale = currentIndex % 2 === 0
        const firstNames = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
        
        const email = `${userRole.toLowerCase().replace('_', '')}${userNumber}.${schoolData.code.toLowerCase()}@smzedu.com`
        const isVerified = userRole === 'STUDENT' ? (Math.random() > 0.2 ? 1 : 0) : 1
        
        try {
          await db.execute({
            sql: `INSERT INTO User (id, email, password, name, role, schoolId, phone, isActive, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            args: [generateId(), email, hashedPassword, `${firstName} ${lastName}`, userRole, schoolId, randomPhone(), isVerified]
          })
          insertedThisBatch++
        } catch (e) { 
          // User might already exist, skip
        }
        
        currentIndex++
      }
      
      const schoolComplete = currentIndex >= totalUsers
      const nextSchoolIndex = schoolComplete ? schoolIndex + 1 : schoolIndex
      const nextUserOffset = schoolComplete ? 0 : currentIndex
      
      return NextResponse.json({
        success: true,
        action: 'seed-users',
        school: { code: schoolData.code, name: schoolData.name, index: schoolIndex, total: SCHOOLS.length },
        progress: { insertedThisBatch, usersInSchool: currentIndex, totalUsers, schoolComplete },
        duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        nextStep: schoolComplete && nextSchoolIndex >= SCHOOLS.length 
          ? { action: 'status', message: 'Seeding complete!' }
          : { action: 'seed-users', schoolIndex: nextSchoolIndex, userOffset: nextUserOffset }
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use: status, init, seed-schools, or seed-users' }, { status: 400 })

  } catch (error) {
    console.error('[seed-batch] Error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
