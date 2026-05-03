-- E-Classroom LMS - Turso Database Seed
-- Run this in Turso SQL console or via turso db shell

-- Create Admin User (password: password123, bcrypt hashed)
INSERT INTO User (id, email, password, name, role, isActive, isVerified, createdAt, updatedAt)
VALUES (
  'clxadmin0000000000000000001',
  'admin@smzedu.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qVh.N9NJ.KQXCK',
  'System Administrator',
  'SUPER_ADMIN',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- Create a sample school
INSERT INTO School (id, name, code, email, phone, address, description, isActive, createdAt, updatedAt)
VALUES (
  'clxschool000000000000000001',
  'SMZ Education Academy',
  'SMZ001',
  'info@smzedu.com',
  '+1-555-0100',
  '123 Education Street',
  'Premier educational institution',
  1,
  datetime('now'),
  datetime('now')
);

-- Create a teacher
INSERT INTO User (id, email, password, name, role, schoolId, isActive, isVerified, createdAt, updatedAt)
VALUES (
  'clxteacher00000000000000001',
  'teacher@smzedu.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qVh.N9NJ.KQXCK',
  'John Smith',
  'TEACHER',
  'clxschool000000000000000001',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- Create a student
INSERT INTO User (id, email, password, name, role, schoolId, isActive, isVerified, createdAt, updatedAt)
VALUES (
  'clxstudent00000000000000001',
  'student@smzedu.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qVh.N9NJ.KQXCK',
  'Alice Johnson',
  'STUDENT',
  'clxschool000000000000000001',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- Create a sample class
INSERT INTO Class (id, name, code, description, subject, teacherId, schoolId, color, isActive, createdAt, updatedAt)
VALUES (
  'clxclass0000000000000000001',
  'Introduction to Computer Science',
  'CS101',
  'Learn programming fundamentals',
  'Computer Science',
  'clxteacher00000000000000001',
  'clxschool000000000000000001',
  '#3B82F6',
  1,
  datetime('now'),
  datetime('now')
);

-- Verify inserted data
SELECT 'Users:' as type, email, role FROM User;
SELECT 'Schools:' as type, name, code FROM School;
SELECT 'Classes:' as type, name, code FROM Class;
