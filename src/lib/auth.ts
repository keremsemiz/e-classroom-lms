import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@libsql/client';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'e-classroom-smz-education-secret-key-2024';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 12;

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string | null;
  avatar?: string | null;
}

// Get database client
function getDb() {
  const databaseUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!databaseUrl || !authToken) {
    throw new Error('Database environment variables not set')
  }

  return createClient({
    url: databaseUrl,
    authToken: authToken,
  })
}

// ============================================
// PASSWORD UTILITIES
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================
// JWT UTILITIES
// ============================================

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string }> {
  const db = getDb()

  // Get user info
  const result = await db.execute({
    sql: 'SELECT id, email, role, schoolId FROM User WHERE id = ?',
    args: [userId]
  })

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0]
  const token = generateToken({
    userId: user.id as string,
    email: user.email as string,
    role: user.role as UserRole,
    schoolId: user.schoolId as string | undefined,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const sessionId = generateCuid()
  await db.execute({
    sql: `INSERT INTO Session (id, userId, token, userAgent, ipAddress, expiresAt)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [sessionId, userId, token, userAgent || null, ipAddress || null, expiresAt.toISOString()]
  });

  return { token };
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  const db = getDb()
  const payload = verifyToken(token);
  if (!payload) return null;

  const result = await db.execute({
    sql: `SELECT s.id as sessionId, s.expiresAt, u.id, u.email, u.name, u.role, u.schoolId, u.avatar, u.isActive
          FROM Session s
          JOIN User u ON s.userId = u.id
          WHERE s.token = ?`,
    args: [token]
  })

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0]

  if (row.isActive !== 1) {
    return null;
  }

  const expiresAt = new Date(row.expiresAt as string)
  if (expiresAt < new Date()) {
    await db.execute({
      sql: 'DELETE FROM Session WHERE id = ?',
      args: [row.sessionId]
    })
    return null;
  }

  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as UserRole,
    schoolId: row.schoolId as string | null,
    avatar: row.avatar as string | null,
  };
}

export async function invalidateSession(token: string): Promise<void> {
  const db = getDb()
  try {
    await db.execute({
      sql: 'DELETE FROM Session WHERE token = ?',
      args: [token]
    })
  } catch {
    // Session might not exist, ignore
  }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  schoolId?: string;
}): Promise<{ user: AuthUser; token: string }> {
  const db = getDb()

  // Check if user already exists
  const existing = await db.execute({
    sql: 'SELECT id FROM User WHERE email = ?',
    args: [data.email.toLowerCase()]
  })

  if (existing.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const userId = generateCuid()
  await db.execute({
    sql: `INSERT INTO User (id, email, password, name, role, schoolId, isActive)
          VALUES (?, ?, ?, ?, ?, ?, 1)`,
    args: [
      userId,
      data.email.toLowerCase(),
      hashedPassword,
      data.name,
      data.role || 'STUDENT',
      data.schoolId || null
    ]
  })

  // Create session
  const { token } = await createSession(userId);

  return {
    user: {
      id: userId,
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role || UserRole.STUDENT,
      schoolId: data.schoolId || null,
      avatar: null,
    },
    token,
  };
}

export async function loginUser(
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ user: AuthUser; token: string }> {
  console.log('[loginUser] Starting login for:', email)
  const db = getDb()

  const result = await db.execute({
    sql: 'SELECT * FROM User WHERE email = ?',
    args: [email.toLowerCase()]
  })

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0]

  if (user.isActive !== 1) {
    throw new Error('Account is disabled. Please contact administrator.');
  }

  const isValidPassword = await verifyPassword(password, user.password as string);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await db.execute({
    sql: 'UPDATE User SET lastLogin = ? WHERE id = ?',
    args: [new Date().toISOString(), user.id]
  })

  // Create session
  const { token } = await createSession(user.id as string, userAgent, ipAddress);

  return {
    user: {
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      role: user.role as UserRole,
      schoolId: user.schoolId as string | null,
      avatar: user.avatar as string | null,
    },
    token,
  };
}

export async function logoutUser(token: string): Promise<void> {
  await invalidateSession(token);
}

// ============================================
// AUTHORIZATION HELPERS
// ============================================

export function hasRole(user: AuthUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

export function isTeacher(user: AuthUser): boolean {
  return user.role === UserRole.TEACHER;
}

export function isStudent(user: AuthUser): boolean {
  return user.role === UserRole.STUDENT;
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === UserRole.SCHOOL_ADMIN || user.role === UserRole.SUPER_ADMIN;
}

export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === UserRole.SUPER_ADMIN;
}

export function canManageClass(user: AuthUser, classTeacherId: string): boolean {
  if (isSuperAdmin(user)) return true;
  if (user.role === UserRole.SCHOOL_ADMIN) return true;
  if (user.role === UserRole.TEACHER && user.id === classTeacherId) return true;
  return false;
}

export function canGrade(user: AuthUser): boolean {
  return user.role === UserRole.TEACHER ||
         user.role === UserRole.SCHOOL_ADMIN ||
         user.role === UserRole.SUPER_ADMIN;
}

export function canViewAllUsers(user: AuthUser): boolean {
  return isAdmin(user);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${random}`
}
