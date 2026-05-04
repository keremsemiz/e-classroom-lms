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

// Ghanaian/Senegalese/West African names for realistic data - Extended lists for variety
const FIRST_NAMES_MALE = [
  // Akan day names (Ghana)
  "Kwame", "Kofi", "Kwesi", "Yaw", "Kojo", "Kwabena", "Kwaku", "Akwasi", "Yao", "Kwasi",
  "Kwadwo", "Kwabena", "Yaw", "Kofi", "Kwaku", "Akwasi", "Kwame", "Kojo",
  // Ewe names (Ghana/Togo)
  "Kofi", "Koku", "Mawuena", "Mawuko", "Selorm", "Segbefia", "Kafui", "Dzifa", "Etornam", "Eyram",
  "Delali", "Dela", "Mawutor", "Gameli", "Kudzo", "Edem", "Eli", "Enock",
  // Ga names (Ghana)
  "Nii", "Nii Ama", "Nii Laryea", "Nii Adjei", "Nii Okai", "Nii Ayi", "Nii Quaye", "Nii Amah",
  "Laryea", "Amarfio", "Okai", "Ayi", "Adjetey", "Aryertey", "Lamptey", "Nartey",
  // Northern Ghana names
  "Abdul", "Ibrahim", "Mohammed", "Ahmed", "Omar", "Ali", "Hassan", "Hussein", "Yusuf", "Khalid",
  "Rashid", "Karim", "Salisu", "Haruna", "Yakubu", "Idrissu", "Mohammed", "Abubakar", "Umar", "Abdullah",
  "Alhassan", "Muktar", "Farouk", "Nazir", "Fatawu", "Majeed", "Wahab", "Baba", "Sulemana", "Sherif",
  // Christian names (common in Ghana)
  "Emmanuel", "Samuel", "Daniel", "Michael", "David", "Joseph", "Joshua", "Gabriel", "Andrew", "Peter",
  "John", "James", "Thomas", "Matthew", "Mark", "Luke", "Paul", "Stephen", "Philip", "Simon",
  "Benjamin", "Isaac", "Abraham", "Moses", "Aaron", "Elijah", "Elisha", "Nathaniel", "Timothy", "Titus",
  "Jonathan", "Patrick", "Richard", "Robert", "William", "Charles", "Edward", "George", "Henry", "Anthony",
  "Christopher", "Nicholas", "Vincent", "Victor", "Alexander", "Dennis", "Felix", "Raymond", "Martin", "Francis",
  // Senegalese names (Wolof/Fulani/Serer)
  "Cheikh", "Mamadou", "Ousmane", "Ibrahima", "Modou", "Pape", "Serigne", "Moustapha", "Abdou", "Samba",
  "Moussa", "Lamine", "Abdoulaye", "Malick", "Birame", "Mbaye", "Ndongo", "Assane", "Cheikhou", "Babacar",
  "Ibrahima", "Mouhamed", "Youssouf", "Souleymane", "Alioune", "Maguette", "Djibril", "Abdou", "Madiop", "Cheikh",
  "Amadou", "Bouna", "Doudou", "Pape", "Serigne", "Mamour", "Bara", "Oumar", "Bocar", "Mamadou",
  // Nigerian names (common in West Africa)
  "Chukwuemeka", "Emeka", "Olufemi", "Femi", "Olumide", "Oluwaseun", "Adebowale", "Adebayo", "Olumuyiwa",
  "Chinedu", "Obinna", "Uche", "Nnamdi", "Ekene", "Emmanuel", "Tunde", "Bayo", "Tobi", "Seyi",
  "Kunle", "Wale", "Dele", "Fola", "Tayo", "Remi", "Biodun", "Yinka", "Sola", "Bunmi",
  // Other West African names
  "Kwesi", "Kwabena", "Yaw", "Kojo", "Kofi", "Kwame", "Akwasi", "Kwaku", "Akwasi", "Kwasi",
  "Nana", "Ohene", "Osei", "Opoku", "Ofori", "Owusu", "Asante", "Mensah", "Boateng", "Amponsah"
]

const FIRST_NAMES_FEMALE = [
  // Akan day names (Ghana)
  "Ama", "Akua", "Yaa", "Adwoa", "Afia", "Akosua", "Abena", "Efua", "Adisa", "Esi",
  "Akosua", "Ama", "Adwoa", "Abenaa", "Akua", "Yaa", "Afia", "Ama", "Akosua", "Adwoa",
  // Ewe names (Ghana/Togo)
  "Akua", "Adzo", "Mawuenyega", "Selorm", "Mawusi", "Enyonam", "Eyram", "Dzifa", "Kafui", "Make",
  "Delali", "Dela", "Enam", "Mawuko", "Dzidzor", "Edem", "Eli", "Enock", "Nutsua", "Akorfa",
  // Ga names (Ghana)
  "Naa", "Naa Lamiley", "Naa Dede", "Naa Yaley", "Naa Ayorkor", "Naa Korkoi", "Naa Ayika",
  "Dede", "Aku", "Nyuiemedi", "Aryertey", "Amarteifio", "Lamptey", "Quaye", "Nartey", "Laryea",
  // Northern Ghana names
  "Fatima", "Amina", "Khadija", "Zainab", "Aisha", "Ramatu", "Fati", "Hauwa", "Aisha", "Fatima",
  "Hawa", "Aminata", "Memunatu", "Fulera", "Azara", "Laila", "Mariama", "Sadia", "Rakiya", "Adisa",
  // Christian names (common in Ghana)
  "Mary", "Martha", "Ruth", "Esther", "Hannah", "Sarah", "Rebecca", "Rachel", "Elizabeth", "Grace",
  "Joyce", "Patricia", "Jennifer", "Michelle", "Stephanie", "Catherine", "Margaret", "Victoria", "Beatrice", "Florence",
  "Dorothy", "Agnes", "Veronica", "Christiana", "Priscilla", "Lydia", "Deborah", "Juliana", "Monica", "Rita",
  "Gloria", "Juliet", "Sandra", "Nancy", "Alice", "Helen", "Linda", "Susan", "Barbara", "Natalie",
  "Angela", "Monica", "Ruth", "Patience", "Gifty", "Comfort", "Mercy", "Faith", "Hope", "Love",
  // Senegalese names (Wolof/Fulani/Serer)
  "Fatou", "Mariama", "Aissatou", "Fatoumata", "Khady", "Coumba", "Dieynaba", "Marieme", "Ndeye", "Sokhna",
  "Awa", "Aminata", "Bintou", "Kadiatou", "Adama", "Mame", "Fatou", "Aida", "Mame Diarra", "Fatou Binetou",
  "Ndèye", "Dieynaba", "Khady", "Sokhna", "Mame", "Fatou", "Mariama", "Aissatou", "Coumba", "Marème",
  "Ndèye Fatou", "Mame Diarra", "Aminata", "Binta", "Oumy", "Rokia", "Salimata", "Seynabou", "Thioro", "Yacine",
  // Nigerian names (common in West Africa)
  "Chioma", "Ngozi", "Oluchi", "Obioma", "Chidinma", "Chiamaka", "Nneka", "Ifunanya", "Chisom", "Somto",
  "Funke", "Tolu", "Tomi", "Bimpe", "Folake", "Titi", "Nike", "Bunmi", "Sade", "Ronke",
  "Ada", "Chidinma", "Oluchi", "Ngozi", "Chioma", "Obioma", "Chiamaka", "Ifunanya", "Nneka", "Somto",
  // Other West African names
  "Akua", "Yaa", "Adwoa", "Afia", "Akosua", "Abena", "Efua", "Adisa", "Esi", "Ama"
]

const LAST_NAMES = [
  // Akan/Ghanaian names
  "Mensah", "Owusu", "Amponsah", "Boateng", "Osei", "Asante", "Danso", "Adu", "Oppong", "Kwaku",
  "Agyeman", "Appiah", "Kwarteng", "Adjei", "Darko", "Tetteh", "Aryee", "Quarshie", "Lartey", "Nartey",
  "Anim", "Addo", "Oteng", "Ofori", "Koranteng", "Manu", "Aidoo", "Donkor", "Fosu", "Bempah",
  "Owusu", "Asare", "Mensah", "Boateng", "Osei", "Adusei", "Oppong", "Kuffour", "Agyapong", "Asamoah",
  "Frimpong", "Owusu", "Asare", "Mensah", "Boateng", "Adjei", "Appiah", "Agyeman", "Danso", "Adu",
  "Bonsu", "Adubofour", "Agyei", "Boakye", "Obeng", "Adu", "Mireku", "Okyere", "Prempeh", "Sarpong",
  "Ampofo", "Antwi", "Bediako", "Bempah", "Bentum", "Boadu", "Dankwa", "Dapaah", "Darkwah", "Donkor",
  "Duah", "Fofie", "Gyamfi", "Gyasi", "Kankam", "Kofi", "Koomson", "Kyei", "Mensa", "Nimo",
  "Nkrumah", "Ntiamoah", "Nyame", "Oduro", "Ohene", "Okai", "Okyeampong", "Opoku", "Owusua", "Poku",
  // Ga names (Accra)
  "Laryea", "Amarfio", "Okai", "Ayi", "Adjetey", "Aryertey", "Lamptey", "Nartey", "Quaye", "Amah",
  "Nii", "Adote", "Ankrah", "Ashong", "Attoh", "Bortei", "Cudjoe", "Djanie", "Dodoo", "Lamptey",
  // Ewe names
  "Doe", "Gbedemah", "Gbesemi", "Kumah", "Kudzo", "Adzah", "Agbe", "Dzidzienyo", "Foli", "Gakpo",
  "Gbolonyo", "Honorat", "Klu", "Kudzi", "Kumawu", "Mawuko", "Megbor", "Morny", "Nutsuawor", "Selorm",
  // Northern Ghana names
  "Abdulai", "Alhassan", "Baba", "Dauda", "Haruna", "Idrissu", "Imoro", "Mahama", "Mumuni", "Salifu",
  "Seidu", "Sulemana", "Wahab", "Yakubu", "Yussif", "Zakaria", "Abubakar", "Ahmed", "Dramani", "Fuseini",
  // Senegalese/Wolof names
  "Diouf", "Ndiaye", "Fall", "Sow", "Ba", "Gueye", "Seck", "Diallo", "Niang", "Thiam",
  "Mbaye", "Sarr", "Diao", "Sy", "Ndao", "Kane", "Cisse", "Toure", "Gomis", "Faye",
  "Diop", "N'daw", "Sene", "Gaye", "Jallow", "Jammeh", "Mbow", "Samb", "Goudiaby", "Badji",
  "Coly", "Sonko", "Drammeh", "Jatta", "Saho", "Jobe", "Manga", "Jorbateh", "Bojang", "Manneh",
  // Nigerian names
  "Adeyemi", "Adeoye", "Adesina", "Adewale", "Adebowale", "Adebayo", "Adegoke", "Adelakun", "Adeniyi", "Adeleke",
  "Olatunji", "Olaniyi", "Olawale", "Olayinka", "Olowolagba", "Olubunmi", "Olufemi", "Olumide", "Oluwaseun", "Oluwadamilola",
  "Chukwuemeka", "Nwosu", "Okafor", "Okeke", "Onyeka", "Onyema", "Onyekachi", "Onyebuchi", "Onyedinma", "Onyenwe",
  "Eze", "Ezejiofor", "Ezenwa", "Igwe", "Igwealor", "Ibekwe", "Ibezim", "Ibe", "Ibegbu", "Ibeji",
  // Other West African names
  "Kone", "Traore", "Coulibaly", "Keita", "Diarra", "Sissoko", "Konate", "Diarra", "Toure", "Sangare",
  "Bamba", "Ouedraogo", "Zongo", "Sawadogo", "Compaore", "Dabo", "Diallo", "Barry", "Sylla", "Konneh"
]

// Generate a unique ID
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `c${timestamp}${random}`
}

// Generate random Ghanaian phone number
function randomPhone(): string {
  const prefixes = ['020', '023', '024', '025', '026', '027', '028', '029', '050', '053', '054', '055', '056', '057']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return `+233 ${prefix} ${number.substring(0, 3)} ${number.substring(3)}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const batchSize = parseInt(searchParams.get('batch') || '50') // Smaller batches for Turso
  const schoolIndex = parseInt(searchParams.get('school') || '-1') // -1 means all schools
  
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
    console.log('[seed-database] Starting seeding process...')
    const startTime = Date.now()

    // Check if schools already exist
    const existingSchools = await db.execute("SELECT COUNT(*) as count FROM School")
    const schoolCount = existingSchools.rows[0]?.count as number

    if (schoolCount > 0) {
      // Clear existing data (optional - comment out if you want to keep existing)
      console.log('[seed-database] Clearing existing data...')
      await db.execute("DELETE FROM Enrollment")
      await db.execute("DELETE FROM Attendance")
      await db.execute("DELETE FROM Grade")
      await db.execute("DELETE FROM Submission")
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
    }

    // Hash password for all users (same password for demo)
    const hashedPassword = await bcrypt.hash('password123', 12)
    console.log('[seed-database] Password hashed')

    // Schools to process
    const schoolsToProcess = schoolIndex >= 0 && schoolIndex < SCHOOLS.length 
      ? [SCHOOLS[schoolIndex]] 
      : SCHOOLS

    let totalUsers = 0
    let totalTeachers = 0
    let totalStudents = 0
    let totalAdmins = 0

    const results = []

    for (const schoolData of schoolsToProcess) {
      console.log(`[seed-database] Processing school: ${schoolData.name}`)
      
      // Create school
      const schoolId = generateId()
      await db.execute({
        sql: `INSERT INTO School (id, name, code, address, email, isActive, description)
              VALUES (?, ?, ?, ?, ?, 1, ?)`,
        args: [
          schoolId,
          schoolData.name,
          schoolData.code,
          schoolData.location,
          `info@${schoolData.code.toLowerCase()}.smzedu.com`,
          `${schoolData.type} - Partner of SMZ Education Network`
        ]
      })

      // Determine user counts based on school type
      // GARDCCA is special - it's an association with 1000+ schools
      const isGARDCCA = schoolData.code === 'GARDCCA'
      const baseUsers = isGARDCCA ? 1200 : 880 // ~880 users per school to get ~34,500 total
      
      // User distribution: ~5% teachers, ~1.5% admins, rest students
      const teacherCount = Math.floor(baseUsers * 0.05) // ~44 teachers
      const adminCount = Math.floor(baseUsers * 0.015) // ~13 admins
      const studentCount = baseUsers - teacherCount - adminCount // ~823 students

      // Create users in batches to avoid memory issues
      const adminUsers: Array<{id: string, email: string, name: string}> = []
      const teacherUsers: Array<{id: string, email: string, name: string}> = []
      const studentUsers: Array<{id: string, email: string, name: string}> = []

      // Create School Admins
      for (let i = 0; i < adminCount; i++) {
        const firstName = i % 2 === 0 
          ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
          : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)]
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
        const id = generateId()
        const email = `admin${i + 1}.${schoolData.code.toLowerCase()}@smzedu.com`
        const name = `${firstName} ${lastName}`
        
        adminUsers.push({ id, email, name })
      }

      // Create Teachers
      for (let i = 0; i < teacherCount; i++) {
        const firstName = i % 2 === 0 
          ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
          : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)]
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
        const id = generateId()
        const email = `teacher${i + 1}.${schoolData.code.toLowerCase()}@smzedu.com`
        const name = `${firstName} ${lastName}`
        
        teacherUsers.push({ id, email, name })
      }

      // Create Students
      for (let i = 0; i < studentCount; i++) {
        const firstName = i % 2 === 0 
          ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
          : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)]
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
        const id = generateId()
        const email = `student${i + 1}.${schoolData.code.toLowerCase()}@smzedu.com`
        const name = `${firstName} ${lastName}`
        
        studentUsers.push({ id, email, name })
      }

      // Combine all users
      const allUsers = [
        ...adminUsers.map(u => ({ ...u, role: 'SCHOOL_ADMIN', isActive: 1, isVerified: 1 })),
        ...teacherUsers.map(u => ({ ...u, role: 'TEACHER', isActive: 1, isVerified: Math.random() > 0.1 ? 1 : 0 })),
        ...studentUsers.map(u => ({ ...u, role: 'STUDENT', isActive: 1, isVerified: Math.random() > 0.2 ? 1 : 0 }))
      ]

      // Batch insert users
      for (let i = 0; i < allUsers.length; i += batchSize) {
        const batch = allUsers.slice(i, i + batchSize)
        
        for (const user of batch) {
          await db.execute({
            sql: `INSERT INTO User (id, email, password, name, role, schoolId, phone, isActive, isVerified)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [user.id, user.email, hashedPassword, user.name, user.role, schoolId, randomPhone(), user.isActive, user.isVerified]
          })
        }
        
        console.log(`[seed-database] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allUsers.length / batchSize)} for ${schoolData.code}`)
      }

      totalUsers += allUsers.length
      totalTeachers += teacherCount
      totalStudents += studentCount
      totalAdmins += adminCount

      results.push({
        school: schoolData.name,
        code: schoolData.code,
        users: allUsers.length,
        teachers: teacherCount,
        students: studentCount,
        admins: adminCount
      })

      console.log(`[seed-database] Completed ${schoolData.name}: ${allUsers.length} users`)
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      summary: {
        totalSchools: schoolsToProcess.length,
        totalUsers,
        totalTeachers,
        totalStudents,
        totalAdmins,
        duration: `${(duration / 1000).toFixed(2)} seconds`,
        defaultPassword: 'password123',
        loginFormat: {
          admins: 'admin{N}.{SCHOOL_CODE}@smzedu.com (e.g., admin1.mnsk@smzedu.com)',
          teachers: 'teacher{N}.{SCHOOL_CODE}@smzedu.com (e.g., teacher1.mnsk@smzedu.com)',
          students: 'student{N}.{SCHOOL_CODE}@smzedu.com (e.g., student1.mnsk@smzedu.com)'
        }
      },
      schools: results
    })

  } catch (error) {
    console.error('[seed-database] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
