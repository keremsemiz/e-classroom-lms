import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { User, UserRole, Session } from '@prisma/client';

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

export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ session: Session; token: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, schoolId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId ?? undefined,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const session = await db.session.create({
    data: {
      userId,
      token,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  return { session, token };
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          schoolId: true,
          avatar: true,
          isActive: true,
        },
      },
    },
  });

  if (!session || !session.user || !session.user.isActive) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    schoolId: session.user.schoolId,
    avatar: session.user.avatar,
  };
}

export async function invalidateSession(token: string): Promise<void> {
  try {
    await db.session.delete({ where: { token } });
  } catch {
    // Session might not exist, ignore
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
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
  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await db.user.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      role: data.role || UserRole.STUDENT,
      schoolId: data.schoolId,
    },
  });

  // Create session
  const { token } = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      avatar: user.avatar,
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
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is disabled. Please contact administrator.');
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await db.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Create session
  const { token } = await createSession(user.id, userAgent, ipAddress);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      avatar: user.avatar,
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

export async function generateUniqueClassCode(): Promise<string> {
  let code = generateRandomCode(6);
  let attempts = 0;
  
  while (attempts < 100) {
    const existing = await db.class.findUnique({ where: { code } });
    if (!existing) return code;
    code = generateRandomCode(6);
    attempts++;
  }
  
  throw new Error('Unable to generate unique class code');
}
