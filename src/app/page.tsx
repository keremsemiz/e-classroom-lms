'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore, AuthUser } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useClassStore } from '@/store/classStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  BookOpen,
  Users,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Home,
  ClipboardList,
  GraduationCap,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  User,
  Mail,
  Lock,
  UserPlus,
  Building2,
  Hash,
  Edit,
  Trash2,
  Send,
  ArrowLeft,
  Eye,
  Download,
  Upload,
  MoreVertical,
  Pin,
  Star,
  Paperclip,
  File,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';

interface ClassData {
  id: string;
  name: string;
  code: string;
  description?: string;
  subject?: string;
  color: string;
  teacher?: { id: string; name: string; email: string; avatar?: string };
  _count?: { enrollments: number; assignments: number };
  enrollments?: { student: { id: string; name: string; email: string; avatar?: string } }[];
  assignments?: AssignmentData[];
}

interface AssignmentData {
  id: string;
  title: string;
  description?: string;
  points: number;
  dueDate?: string;
  status: string;
  assignmentType: string;
  class?: { id: string; name: string; color: string };
  _count?: { submissions: number };
  submissions?: SubmissionData[];
}

interface SubmissionData {
  id: string;
  content?: string;
  attachments?: string[];
  submittedAt: string;
  status: string;
  late: boolean;
  student?: { id: string; name: string; email: string; avatar?: string };
  grade?: GradeData;
}

interface GradeData {
  id: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback?: string;
}

interface MessageData {
  id: string;
  subject?: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: { id: string; name: string; email: string; avatar?: string; role: string };
  receiver?: { id: string; name: string; email: string; avatar?: string; role: string };
}

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ============================================
// API HELPERS
// ============================================

const api = {
  async get<T>(url: string): Promise<{ success: boolean; data?: T; error?: string } & T> {
    try {
      const res = await fetch(url, { credentials: 'include' });
      return await res.json();
    } catch (error) {
      return { success: false, error: 'Network error' } as { success: boolean; error: string } & T;
    }
  },

  async post<T>(url: string, body?: unknown): Promise<{ success: boolean; data?: T; error?: string } & T> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: 'Network error' } as { success: boolean; error: string } & T;
    }
  },

  async put<T>(url: string, body?: unknown): Promise<{ success: boolean; data?: T; error?: string } & T> {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: 'Network error' } as { success: boolean; error: string } & T;
    }
  },

  async delete<T>(url: string): Promise<{ success: boolean; data?: T; error?: string } & T> {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      return await res.json();
    } catch (error) {
      return { success: false, error: 'Network error' } as { success: boolean; error: string } & T;
    }
  },
};

// ============================================
// LANDING PAGE
// ============================================

function LandingPage({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">E-Classroom</span>
              <span className="text-[10px] text-muted-foreground font-medium">SMZ Education</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onLogin}>Sign In</Button>
            <Button onClick={onRegister} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border-0">✨ Simple. Clean. Accessible.</Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Modern Learning Management</span>
          <br />
          <span className="text-gray-900 dark:text-white">for Schools Worldwide</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          E-Classroom helps schools manage classes, assignments, grading, and communication in one simple platform.
          Built for accessibility and designed for schools with limited resources.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg" onClick={onRegister}>
            <UserPlus className="w-5 h-5" /> Start Free Today
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={onLogin}>
            <Lock className="w-5 h-5" /> Sign In
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">A complete learning management solution designed with simplicity and accessibility in mind.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: 'Class Management', desc: 'Create and manage classes with unique join codes. Easy enrollment for students.', color: 'from-blue-500 to-blue-600' },
            { icon: ClipboardList, title: 'Assignments', desc: 'Create, distribute, and collect assignments. Support for PDF and text submissions.', color: 'from-green-500 to-green-600' },
            { icon: GraduationCap, title: 'Grading', desc: 'Simple grading interface with feedback. Track student progress over time.', color: 'from-purple-500 to-purple-600' },
            { icon: Calendar, title: 'Attendance', desc: 'Mark and track daily attendance. View attendance history and patterns.', color: 'from-orange-500 to-orange-600' },
            { icon: MessageSquare, title: 'Communication', desc: 'Direct messaging between teachers and students. Class announcements.', color: 'from-pink-500 to-pink-600' },
            { icon: BarChart3, title: 'Analytics', desc: 'Visual dashboards for performance tracking. Insights for improvement.', color: 'from-cyan-500 to-cyan-600' },
          ].map((feature, i) => (
            <Card key={i} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
              <div className={`h-1 bg-gradient-to-r ${feature.color}`} />
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Trusted Worldwide</h2>
            <p className="text-blue-100">Join thousands of schools already using E-Classroom</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Schools' },
              { value: '500K+', label: 'Students' },
              { value: '50K+', label: 'Teachers' },
              { value: '100+', label: 'Countries' },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-lg">E-Classroom</span>
                <span className="text-xs text-muted-foreground">A product of SMZ Education</span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-muted-foreground">© 2024 SMZ Education. All rights reserved.</p>
              <p className="text-sm text-muted-foreground mt-1">Building educational infrastructure for schools worldwide.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// LOGIN FORM
// ============================================

function LoginForm({ onSuccess, onSwitchToRegister }: { onSuccess: (user: AuthUser) => void; onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await api.post<{ user: AuthUser }>('/api/auth/login', { email, password });

    if (result.success && result.user) {
      useAuthStore.getState().login(result.user, 'session');
      toast({ title: 'Welcome back!', description: `Logged in as ${result.user.name}` });
      onSuccess(result.user);
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to your E-Classroom account</CardDescription>
        <p className="text-xs text-muted-foreground mt-1">SMZ Education</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onSwitchToRegister}>
          Don't have an account? Register
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================
// REGISTER FORM
// ============================================

function RegisterForm({ onSuccess, onSwitchToLogin }: { onSuccess: (user: AuthUser) => void; onSwitchToLogin: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await api.post<{ user: AuthUser }>('/api/auth/register', { name, email, password, role });

    if (result.success && result.user) {
      useAuthStore.getState().login(result.user, 'session');
      toast({ title: 'Account created!', description: `Welcome to E-Classroom, ${result.user.name}` });
      onSuccess(result.user);
    } else {
      setError(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Join E-Classroom today</CardDescription>
        <p className="text-xs text-muted-foreground mt-1">SMZ Education</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">I am a</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onSwitchToLogin}>
          Already have an account? Sign In
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================
// DASHBOARD LAYOUT
// ============================================

function DashboardLayout({
  user,
  onLogout,
  currentView,
  onViewChange,
  notifications,
  unreadCount,
  unreadMessages,
  children,
}: {
  user: AuthUser;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  notifications: NotificationData[];
  unreadCount: number;
  unreadMessages?: number;
  children: React.ReactNode;
}) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { toast } = useToast();

  const navItems = user.role === 'STUDENT' ? [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'grades', label: 'Grades', icon: GraduationCap },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ] : user.role === 'TEACHER' ? [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'classes', label: 'My Classes', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'gradebook', label: 'Gradebook', icon: GraduationCap },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'schools', label: 'Schools', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'classes', label: 'All Classes', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    await api.post('/api/auth/logout');
    useAuthStore.getState().logout();
    onLogout();
    toast({ title: 'Logged out', description: 'See you next time!' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b z-50 flex items-center px-4 justify-between">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm">E-Classroom</span>
            <span className="text-[10px] text-muted-foreground">by SMZ Education</span>
          </div>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => onViewChange('notifications')}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r z-40 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-16 flex items-center px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base">E-Classroom</span>
              <span className="text-[10px] text-muted-foreground">SMZ Education</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={toggleSidebar}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-8rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? 'secondary' : 'ghost'}
                className={`w-full justify-start gap-3 relative ${currentView === item.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : ''}`}
                onClick={() => {
                  onViewChange(item.id);
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.id === 'messages' && unreadMessages > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Button>
            ))}
          </nav>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={toggleSidebar} />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

// ============================================
// STUDENT DASHBOARD
// ============================================

function StudentDashboard({ user, onViewChange }: { user: AuthUser; onViewChange: (view: string) => void }) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [classesRes, assignmentsRes, gradesRes] = await Promise.all([
        api.get<{ classes: ClassData[] }>('/api/classes'),
        api.get<{ assignments: AssignmentData[] }>('/api/assignments?status=PUBLISHED'),
        api.get<{ grades: GradeData[] }>('/api/grades'),
      ]);

      if (classesRes.success) setClasses(classesRes.classes || []);
      if (assignmentsRes.success) setAssignments(assignmentsRes.assignments || []);
      if (gradesRes.success) setGrades(gradesRes.grades || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const upcomingAssignments = assignments
    .filter(a => a.dueDate && new Date(a.dueDate) > new Date())
    .slice(0, 5);

  const recentGrades = grades.slice(0, 5);
  const avgGrade = grades.length > 0
    ? Math.round(grades.reduce((acc, g) => acc + g.percentage, 0) / grades.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's what's happening in your classes today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingAssignments.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgGrade}%</p>
                <p className="text-sm text-muted-foreground">Avg Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{grades.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Assignments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onViewChange('assignments')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming assignments</p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => onViewChange(`assignment-${assignment.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: assignment.class?.color || '#3B82F6' }}
                      >
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.class?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{assignment.points} pts</p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Grades</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onViewChange('grades')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentGrades.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No grades yet</p>
            ) : (
              <div className="space-y-3">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div>
                      <p className="font-medium">{grade.percentage.toFixed(0)}%</p>
                      <p className="text-sm text-muted-foreground">{grade.score}/{grade.maxScore} points</p>
                    </div>
                    <Progress value={grade.percentage} className="w-24" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Classes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">My Classes</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onViewChange('classes')}>
            View All <ChevronRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Card
                key={cls.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewChange(`class-${cls.id}`)}
              >
                <div className="h-2 rounded-t-lg" style={{ backgroundColor: cls.color }} />
                <CardContent className="pt-4">
                  <h3 className="font-semibold">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground">{cls.subject}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {cls._count?.enrollments || 0} students
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// TEACHER DASHBOARD
// ============================================

function TeacherDashboard({ user, onViewChange }: { user: AuthUser; onViewChange: (view: string) => void }) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const classesRes = await api.get<{ classes: ClassData[] }>('/api/classes');
      if (classesRes.success) {
        setClasses(classesRes.classes || []);
        
        // Fetch submissions for first few classes
        const allSubmissions: SubmissionData[] = [];
        for (const cls of (classesRes.classes || []).slice(0, 3)) {
          const assignRes = await api.get<{ assignments: AssignmentData[] }>(`/api/assignments?classId=${cls.id}`);
          if (assignRes.success) {
            for (const assignment of (assignRes.assignments || []).slice(0, 2)) {
              const assignDetail = await api.get<{ assignment: AssignmentData }>(`/api/assignments/${assignment.id}`);
              if (assignDetail.success && assignDetail.assignment?.submissions) {
                allSubmissions.push(...assignDetail.assignment.submissions);
              }
            }
          }
        }
        setRecentSubmissions(allSubmissions.slice(0, 10));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const totalStudents = classes.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);
  const totalAssignments = classes.reduce((acc, c) => acc + (c._count?.assignments || 0), 0);
  const pendingGrading = recentSubmissions.filter(s => s.status === 'SUBMITTED' || s.status === 'LATE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
          <p className="text-muted-foreground">Here's your teaching overview.</p>
        </div>
        <Button onClick={() => onViewChange('create-class')}>
          <Plus className="w-4 h-4 mr-2" /> Create Class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAssignments}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingGrading}</p>
                <p className="text-sm text-muted-foreground">To Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Classes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onViewChange('classes')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classes.slice(0, 4).map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => onViewChange(`class-${cls.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cls.color }}>
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls._count?.enrollments || 0} students • {cls._count?.assignments || 0} assignments
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">{cls.code}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Submissions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onViewChange('assignments')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent submissions</p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={sub.student?.avatar} />
                        <AvatarFallback>{sub.student?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{sub.student?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={sub.status === 'GRADED' ? 'default' : 'secondary'}>
                      {sub.late ? 'Late' : sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// SUPER ADMIN DASHBOARD
// ============================================

function SuperAdminDashboard({ user, onViewChange }: { user: AuthUser; onViewChange: (view: string) => void }) {
  const [stats, setStats] = useState({
    schools: 0,
    users: 0,
    teachers: 0,
    students: 0,
    classes: 0,
  });
  const [recentUsers, setRecentUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const usersRes = await api.get<{ users: { id: string; name: string; email: string; role: string }[] }>('/api/users');
      const classesRes = await api.get<{ classes: ClassData[] }>('/api/classes');

      if (isMounted && usersRes.success && classesRes.success) {
        const users = usersRes.users || [];
        const classes = classesRes.classes || [];

        setStats({
          schools: 2, // From seed data
          users: users.length,
          teachers: users.filter(u => u.role === 'TEACHER').length,
          students: users.filter(u => u.role === 'STUDENT').length,
          classes: classes.length,
        });
        setRecentUsers(users.slice(0, 6));
      }
      if (isMounted) setLoading(false);
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Administration</h1>
          <p className="text-muted-foreground">Manage all schools and users on E-Classroom</p>
        </div>
        <Button onClick={() => onViewChange('schools')}>
          <Building2 className="w-4 h-4 mr-2" /> Manage Schools
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.schools}</p>
                <p className="text-sm text-muted-foreground">Schools</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.users}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.teachers}</p>
                <p className="text-sm text-muted-foreground">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.students}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.classes}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => onViewChange('schools')}>
                <Building2 className="w-6 h-6" />
                <span>Manage Schools</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => onViewChange('users')}>
                <Users className="w-6 h-6" />
                <span>Manage Users</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => onViewChange('classes')}>
                <BookOpen className="w-6 h-6" />
                <span>View All Classes</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => onViewChange('analytics')}>
                <BarChart3 className="w-6 h-6" />
                <span>Platform Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Users</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onViewChange('users')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{u.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">{u.role.toLowerCase().replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">E-Classroom Platform</h3>
                <p className="text-sm text-muted-foreground">SMZ Education • Version 1.0.0</p>
              </div>
            </div>
            <Badge className="bg-green-500 hover:bg-green-500">All Systems Operational</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// SCHOOL ADMIN DASHBOARD
// ============================================

function SchoolAdminDashboard({ user, onViewChange }: { user: AuthUser; onViewChange: (view: string) => void }) {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    assignments: 0,
    attendanceRate: 0,
  });
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const usersRes = await api.get<{ users: { id: string; name: string; email: string; role: string }[] }>('/api/users');
      const classesRes = await api.get<{ classes: ClassData[] }>('/api/classes');
      const assignmentsRes = await api.get<{ assignments: AssignmentData[] }>('/api/assignments');

      if (isMounted && usersRes.success && classesRes.success && assignmentsRes.success) {
        const users = usersRes.users || [];
        const classList = classesRes.classes || [];
        const assignments = assignmentsRes.assignments || [];

        setStats({
          teachers: users.filter(u => u.role === 'TEACHER').length,
          students: users.filter(u => u.role === 'STUDENT').length,
          classes: classList.length,
          assignments: assignments.length,
          attendanceRate: 95, // Sample data
        });
        setClasses(classList.slice(0, 4));
      }
      if (isMounted) setLoading(false);
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">School Dashboard</h1>
          <p className="text-muted-foreground">Overview of your school's activity</p>
        </div>
        <Button onClick={() => onViewChange('users')}>
          <Users className="w-4 h-4 mr-2" /> Manage Users
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.teachers}</p>
                <p className="text-sm text-muted-foreground">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.students}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.classes}</p>
                <p className="text-sm text-muted-foreground">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.assignments}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                <p className="text-sm text-muted-foreground">Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => onViewChange('users')}>
                <Users className="w-6 h-6" />
                <span>Manage Users</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => onViewChange('classes')}>
                <BookOpen className="w-6 h-6" />
                <span>View Classes</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => onViewChange('analytics')}>
                <BarChart3 className="w-6 h-6" />
                <span>School Analytics</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => onViewChange('messages')}>
                <MessageSquare className="w-6 h-6" />
                <span>Messages</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Classes Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Classes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onViewChange('classes')}>
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => onViewChange(`class-${cls.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cls.color }}>
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">{cls.subject}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{cls._count?.enrollments || 0} students</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">School Information</h3>
                <p className="text-sm text-muted-foreground">Manage your school settings • SMZ Education</p>
              </div>
            </div>
            <Button variant="outline" size="sm">School Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// USERS VIEW (Admin)
// ============================================

function UsersView({ user }: { user: AuthUser }) {
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string; avatar?: string; schoolId?: string; school?: { id: string; name: string } }[]>([]);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, schoolsRes] = await Promise.all([
        api.get<{ users: { id: string; name: string; email: string; role: string; avatar?: string; schoolId?: string; school?: { id: string; name: string } }[] }>('/api/users'),
        user.role === 'SUPER_ADMIN' ? api.get<{ schools: SchoolData[] }>('/api/schools') : Promise.resolve({ success: false, schools: [] }),
      ]);
      if (usersRes.success) setUsers(usersRes.users || []);
      if (schoolsRes.success) setSchools(schoolsRes.schools || []);
      setLoading(false);
    };
    fetchData();
  }, [user.role]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (data: { name: string; email: string; password: string; role: string; schoolId?: string }) => {
    const res = await api.post<{ user: { id: string; name: string; email: string; role: string } }>('/api/users', data);
    if (res.success && res.user) {
      toast({ title: 'User created!', description: `${res.user.name} has been added` });
      setShowCreateModal(false);
      setUsers([res.user, ...users]);
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all users in the platform</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
            <SelectItem value="TEACHER">Teacher</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <Card>
        <CardContent className="pt-6">
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{u.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      {u.school && <p className="text-xs text-muted-foreground">{u.school.name}</p>}
                    </div>
                  </div>
                  <Badge variant={u.role === 'SUPER_ADMIN' ? 'default' : u.role === 'SCHOOL_ADMIN' ? 'secondary' : 'outline'} className="capitalize">
                    {u.role.toLowerCase().replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateUser}
        schools={schools}
        currentUserRole={user.role}
      />
    </div>
  );
}

// ============================================
// CREATE USER MODAL
// ============================================

function CreateUserModal({
  open,
  onOpenChange,
  onSubmit,
  schools,
  currentUserRole,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; email: string; password: string; role: string; schoolId?: string }) => void;
  schools: SchoolData[];
  currentUserRole: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('STUDENT');
  const [schoolId, setSchoolId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password) return;
    setLoading(true);
    await onSubmit({ name, email, password, role, schoolId: schoolId || undefined });
    setLoading(false);
    setName('');
    setEmail('');
    setPassword('');
    setRole('STUDENT');
    setSchoolId('');
  };

  const availableRoles = currentUserRole === 'SUPER_ADMIN' 
    ? [
        { value: 'STUDENT', label: 'Student' },
        { value: 'TEACHER', label: 'Teacher' },
        { value: 'SCHOOL_ADMIN', label: 'School Admin' },
        { value: 'SUPER_ADMIN', label: 'Super Admin' },
      ]
    : [
        { value: 'STUDENT', label: 'Student' },
        { value: 'TEACHER', label: 'Teacher' },
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new user to the platform</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Full Name *</Label>
            <Input id="userName" placeholder="e.g., John Doe" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userEmail">Email *</Label>
            <Input id="userEmail" type="email" placeholder="user@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userPassword">Password *</Label>
            <Input id="userPassword" type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userRole">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentUserRole === 'SUPER_ADMIN' && schools.length > 0 && role !== 'SUPER_ADMIN' && (
            <div className="space-y-2">
              <Label htmlFor="userSchool">School</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || !email || password.length < 6 || loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// SCHOOLS VIEW (Super Admin)
// ============================================

interface SchoolData {
  id: string;
  name: string;
  code: string;
  email?: string;
  address?: string;
  phone?: string;
  website?: string;
  _count?: { users: number; classes: number };
}

function SchoolsView() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSchools = async () => {
      const res = await api.get<{ schools: SchoolData[] }>('/api/schools');
      if (res.success) setSchools(res.schools || []);
      setLoading(false);
    };
    fetchSchools();
  }, []);

  const handleCreateSchool = async (data: { name: string; code: string; email?: string; address?: string; phone?: string }) => {
    const res = await api.post<{ school: SchoolData }>('/api/schools', data);
    if (res.success && res.school) {
      toast({ title: 'School created!', description: `${res.school.name} has been added` });
      setShowCreateModal(false);
      setSchools([res.school, ...schools]);
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schools Management</h1>
          <p className="text-muted-foreground">Manage all schools on the platform</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add School
        </Button>
      </div>

      {schools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No schools yet</h3>
            <p className="text-muted-foreground text-center mb-4">Create your first school to get started</p>
            <Button onClick={() => setShowCreateModal(true)}>Add School</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {schools.map((school) => (
            <Card key={school.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                  <Badge variant="outline">{school.code}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {school.email && <p><strong>Email:</strong> {school.email}</p>}
                  {school.address && <p><strong>Address:</strong> {school.address}</p>}
                  {school.phone && <p><strong>Phone:</strong> {school.phone}</p>}
                </div>
                <div className="flex gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {school._count?.users || 0} users</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {school._count?.classes || 0} classes</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create School Modal */}
      <CreateSchoolModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateSchool}
      />
    </div>
  );
}

// ============================================
// CREATE SCHOOL MODAL
// ============================================

function CreateSchoolModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; code: string; email?: string; address?: string; phone?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !code) return;
    setLoading(true);
    await onSubmit({ name, code: code.toUpperCase(), email: email || undefined, address: address || undefined, phone: phone || undefined });
    setLoading(false);
    setName('');
    setCode('');
    setEmail('');
    setAddress('');
    setPhone('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New School</DialogTitle>
          <DialogDescription>Add a new school to the platform</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name *</Label>
            <Input id="schoolName" placeholder="e.g., Lincoln High School" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolCode">School Code *</Label>
            <Input id="schoolCode" placeholder="e.g., LHS001" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} />
            <p className="text-xs text-muted-foreground">Unique identifier for the school (3-10 characters)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolEmail">Email</Label>
            <Input id="schoolEmail" type="email" placeholder="admin@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolPhone">Phone</Label>
            <Input id="schoolPhone" placeholder="+1 234 567 8900" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolAddress">Address</Label>
            <Textarea id="schoolAddress" placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || code.length < 3 || loading}>
            {loading ? 'Creating...' : 'Create School'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// ANALYTICS VIEW
// ============================================

function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Platform analytics and insights</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">89%</p>
              <p className="text-sm text-muted-foreground">Assignment Completion Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">95%</p>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">78%</p>
              <p className="text-sm text-muted-foreground">Average Grade</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">156</p>
              <p className="text-sm text-muted-foreground">Active Classes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            Detailed analytics charts will be displayed here. This feature can be expanded with Recharts for visualizations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// CLASSES VIEW
// ============================================

function ClassesView({ user, onViewChange }: { user: AuthUser; onViewChange: (view: string) => void }) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      const res = await api.get<{ classes: ClassData[] }>('/api/classes');
      if (isMounted) {
        if (res.success) setClasses(res.classes || []);
        setLoading(false);
      }
    };
    fetchClasses();
    return () => { isMounted = false; };
  }, []);

  const handleJoinClass = async () => {
    if (!joinCode || joinCode.length !== 6) {
      toast({ title: 'Invalid code', description: 'Class code must be 6 characters', variant: 'destructive' });
      return;
    }

    const res = await api.post<{ class: ClassData }>('/api/classes/join', { code: joinCode });
    if (res.success) {
      toast({ title: 'Joined class!', description: `You joined ${res.class?.name}` });
      setShowJoinModal(false);
      setJoinCode('');
      // Refresh classes
      const refreshRes = await api.get<{ classes: ClassData[] }>('/api/classes');
      if (refreshRes.success) setClasses(refreshRes.classes || []);
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.role === 'STUDENT' ? 'My Classes' : 'My Classes'}</h1>
          <p className="text-muted-foreground">
            {user.role === 'STUDENT' ? 'Classes you are enrolled in' : 'Classes you are teaching'}
          </p>
        </div>
        <div className="flex gap-2">
          {user.role === 'STUDENT' && (
            <Button variant="outline" onClick={() => setShowJoinModal(true)}>
              <Hash className="w-4 h-4 mr-2" /> Join Class
            </Button>
          )}
          {user.role === 'TEACHER' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Class
            </Button>
          )}
        </div>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No classes yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {user.role === 'STUDENT' ? 'Join a class using the code provided by your teacher' : 'Create your first class to get started'}
            </p>
            {user.role === 'STUDENT' ? (
              <Button onClick={() => setShowJoinModal(true)}>Join a Class</Button>
            ) : (
              <Button onClick={() => setShowCreateModal(true)}>Create Class</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => onViewChange(`class-${cls.id}`)}
            >
              <div className="h-2" style={{ backgroundColor: cls.color }} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <CardDescription>{cls.subject}</CardDescription>
                  </div>
                  {user.role === 'TEACHER' && (
                    <Badge variant="outline" className="font-mono">{cls.code}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {cls.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{cls.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {cls._count?.enrollments || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />
                    {cls._count?.assignments || 0}
                  </div>
                </div>
                {cls.teacher && user.role === 'STUDENT' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={cls.teacher.avatar} />
                      <AvatarFallback>{cls.teacher.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{cls.teacher.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Join Class Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a Class</DialogTitle>
            <DialogDescription>Enter the 6-character class code provided by your teacher</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter class code (e.g., ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinModal(false)}>Cancel</Button>
            <Button onClick={handleJoinClass}>Join Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Class Modal */}
      <CreateClassModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={(cls) => {
          setShowCreateModal(false);
          fetchClasses();
          toast({ title: 'Class created!', description: `Class code: ${cls.code}` });
        }}
      />
    </div>
  );
}

// ============================================
// CREATE CLASS MODAL
// ============================================

function CreateClassModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (cls: ClassData) => void;
}) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setLoading(true);

    const res = await api.post<{ class: ClassData }>('/api/classes', {
      name,
      subject,
      description,
      room,
    });

    setLoading(false);
    if (res.success && res.class) {
      onSuccess(res.class);
      setName('');
      setSubject('');
      setDescription('');
      setRoom('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>Create a new class for your students</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name *</Label>
            <Input
              id="className"
              placeholder="e.g., Mathematics 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What will students learn in this class?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              placeholder="e.g., Room 101"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || loading}>
            {loading ? 'Creating...' : 'Create Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// CLASS DETAIL VIEW
// ============================================

function ClassDetailView({ classId, user, onViewChange }: { classId: string; user: AuthUser; onViewChange: (view: string) => void }) {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    const fetchClass = async () => {
      const res = await api.get<{ class: ClassData }>(`/api/classes/${classId}`);
      if (res.success) setClassData(res.class || null);
      setLoading(false);
    };
    fetchClass();
  }, [classId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (!classData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Class not found</h2>
        <Button onClick={() => onViewChange('classes')}>Back to Classes</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => onViewChange('classes')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: classData.color }} />
            <h1 className="text-2xl font-bold">{classData.name}</h1>
          </div>
          <p className="text-muted-foreground">{classData.subject}</p>
          {user.role === 'TEACHER' && (
            <Badge variant="outline" className="mt-2 font-mono">Code: {classData.code}</Badge>
          )}
        </div>
        {user.role === 'TEACHER' && (
          <Button onClick={() => onViewChange(`class-${classId}-assignment-create`)}>
            <Plus className="w-4 h-4 mr-2" /> Add Assignment
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          {user.role === 'TEACHER' && <TabsTrigger value="attendance">Attendance</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {classData.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About this class</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{classData.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{classData.enrollments?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{classData.assignments?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Assignments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{classData._count?.enrollments || 0}</p>
                <p className="text-sm text-muted-foreground">Enrolled</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Assignments */}
          {classData.assignments && classData.assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {classData.assignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100"
                      onClick={() => onViewChange(`assignment-${assignment.id}`)}
                    >
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.points} points</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {classData.assignments && classData.assignments.length > 0 ? (
                <div className="space-y-2">
                  {classData.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100"
                      onClick={() => onViewChange(`assignment-${assignment.id}`)}
                    >
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.points} pts • {assignment.dueDate ? `Due ${new Date(assignment.dueDate).toLocaleDateString()}` : 'No due date'}
                        </p>
                      </div>
                      <Badge>{assignment.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No assignments yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students ({classData.enrollments?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {classData.enrollments && classData.enrollments.length > 0 ? (
                <div className="space-y-2">
                  {classData.enrollments.map((enrollment) => (
                    <div key={enrollment.student.id} className="flex items-center gap-3 p-2">
                      <Avatar>
                        <AvatarImage src={enrollment.student.avatar} />
                        <AvatarFallback>
                          {enrollment.student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{enrollment.student.name}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No students enrolled</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === 'TEACHER' && (
          <TabsContent value="attendance">
            <AttendanceView classId={classId} students={classData.enrollments?.map(e => e.student) || []} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ============================================
// ATTENDANCE VIEW
// ============================================

function AttendanceView({ classId, students }: { classId: string; students: { id: string; name: string; email: string; avatar?: string }[] }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAttendance = async () => {
      const res = await api.get<{ attendance: { studentId: string; status: string }[] }>(
        `/api/attendance?classId=${classId}&date=${date}`
      );
      if (res.success && res.attendance) {
        const records: Record<string, string> = {};
        res.attendance.forEach((a) => {
          records[a.studentId] = a.status;
        });
        setAttendance(records);
      }
    };
    fetchAttendance();
  }, [classId, date]);

  const handleSave = async () => {
    setLoading(true);
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    const res = await api.post('/api/attendance', {
      classId,
      date,
      records,
    });

    setLoading(false);
    if (res.success) {
      toast({ title: 'Attendance saved!' });
    } else {
      toast({ title: 'Error saving attendance', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attendance</CardTitle>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <span>{student.name}</span>
              </div>
              <Select
                value={attendance[student.id] || 'PRESENT'}
                onValueChange={(v) => setAttendance({ ...attendance, [student.id]: v })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Attendance'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// ASSIGNMENTS VIEW
// ============================================

function AssignmentsView({ user, onViewChange }: { user: AuthUser; onViewChange: (view: string) => void }) {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      const res = await api.get<{ assignments: AssignmentData[] }>('/api/assignments');
      if (res.success) setAssignments(res.assignments || []);
      setLoading(false);
    };
    fetchAssignments();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const upcoming = assignments.filter(a => a.dueDate && new Date(a.dueDate) > new Date() && a.status === 'PUBLISHED');
  const past = assignments.filter(a => !a.dueDate || new Date(a.dueDate) <= new Date() || a.status !== 'PUBLISHED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">
            {user.role === 'STUDENT' ? 'Your assignments and homework' : 'Manage your assignments'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No upcoming assignments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onViewChange(`assignment-${assignment.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: assignment.class?.color || '#3B82F6' }}
                        >
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">{assignment.class?.name}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                            </span>
                            <span>{assignment.points} pts</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {past.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No past assignments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {past.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                  onClick={() => onViewChange(`assignment-${assignment.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{assignment.title}</h3>
                        <p className="text-sm text-muted-foreground">{assignment.class?.name}</p>
                      </div>
                      <Badge variant="outline">{assignment.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// ASSIGNMENT DETAIL VIEW
// ============================================

interface UploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
}

function AssignmentDetailView({ assignmentId, user, onViewChange }: { assignmentId: string; user: AuthUser; onViewChange: (view: string) => void }) {
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [mySubmission, setMySubmission] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssignment = async () => {
      const res = await api.get<{ assignment: AssignmentData; mySubmission?: SubmissionData }>(`/api/assignments/${assignmentId}`);
      if (res.success) {
        setAssignment(res.assignment || null);
        setMySubmission(res.mySubmission || null);
      }
      setLoading(false);
    };
    fetchAssignment();
  }, [assignmentId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedList: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: 'Invalid file type', description: `${file.name} is not a PDF or image file`, variant: 'destructive' });
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds 10MB limit`, variant: 'destructive' });
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'submission');

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const data = await res.json();

        if (data.success && data.file) {
          uploadedList.push(data.file);
          toast({ title: 'File uploaded', description: `${file.name} uploaded successfully` });
        } else {
          toast({ title: 'Upload failed', description: data.error || 'Unknown error', variant: 'destructive' });
        }
      } catch (err) {
        toast({ title: 'Upload failed', description: `Failed to upload ${file.name}`, variant: 'destructive' });
      }
    }

    setUploadedFiles([...uploadedFiles, ...uploadedList]);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!submitContent.trim() && uploadedFiles.length === 0) {
      toast({ title: 'Please add your submission', description: 'Add text or upload a file', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const res = await api.post(`/api/assignments/${assignmentId}/submit`, {
      content: submitContent,
      attachments: uploadedFiles.map(f => f.path),
    });
    setSubmitting(false);

    if (res.success) {
      toast({ title: 'Assignment submitted!' });
      // Refresh
      const refreshRes = await api.get<{ assignment: AssignmentData; mySubmission?: SubmissionData }>(`/api/assignments/${assignmentId}`);
      if (refreshRes.success) {
        setAssignment(refreshRes.assignment || null);
        setMySubmission(refreshRes.mySubmission || null);
      }
    } else {
      toast({ title: res.error || 'Error submitting', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Assignment not found</h2>
        <Button onClick={() => onViewChange('assignments')}>Back to Assignments</Button>
      </div>
    );
  }

  const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => onViewChange('assignments')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <Badge className="mb-2" style={{ backgroundColor: assignment.class?.color }}>
                {assignment.class?.name}
              </Badge>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <CardDescription>{assignment.description}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{assignment.points}</p>
              <p className="text-sm text-muted-foreground">points</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={isPastDue ? 'text-red-500' : ''}>
                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'No due date'}
              </span>
            </div>
            <Badge variant="outline">{assignment.assignmentType}</Badge>
          </div>

          {assignment.instructions && (
            <div className="prose dark:prose-invert max-w-none">
              <h4>Instructions</h4>
              <p className="whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {user.role === 'STUDENT' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {mySubmission ? (
              <div className="space-y-4">
                {mySubmission.content && (
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="whitespace-pre-wrap">{mySubmission.content}</p>
                  </div>
                )}
                
                {/* Show submitted files */}
                {mySubmission.attachments && Array.isArray(mySubmission.attachments) && mySubmission.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Attached Files:</p>
                    <div className="space-y-2">
                      {(mySubmission.attachments as string[]).map((path, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800">
                          <File className="w-4 h-4 text-red-500" />
                          <span className="text-sm">{path.split('/').pop()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Submitted: {new Date(mySubmission.submittedAt).toLocaleString()}
                    {mySubmission.late && <Badge variant="destructive" className="ml-2">Late</Badge>}
                  </p>
                  <Badge>{mySubmission.status}</Badge>
                </div>
                {mySubmission.grade && (
                  <Card className="bg-green-50 dark:bg-green-900/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Grade</span>
                        <span className="text-2xl font-bold text-green-600">
                          {mySubmission.grade.score}/{mySubmission.grade.maxScore}
                        </span>
                      </div>
                      <Progress value={mySubmission.grade.percentage} className="mb-2" />
                      {mySubmission.grade.feedback && (
                        <p className="text-sm mt-2">{mySubmission.grade.feedback}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your submission here (optional if uploading a file)..."
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  rows={6}
                />

                {/* File Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Attach Files (PDF or Images)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center gap-2">
                            <File className={`w-5 h-5 ${file.mimeType === 'application/pdf' ? 'text-red-500' : 'text-blue-500'}`} />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Max file size: 10MB. Supported formats: PDF, PNG, JPG, JPEG
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || uploading || (isPastDue && !assignment.allowLateSubmission)}
                  className="w-full"
                >
                  {submitting ? 'Submitting...' : isPastDue ? 'Submit Late' : 'Submit Assignment'}
                </Button>
                {isPastDue && !assignment.allowLateSubmission && (
                  <p className="text-sm text-red-500 text-center">This assignment is past due and does not accept late submissions</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {user.role === 'TEACHER' && assignment.submissions && (
        <Card>
          <CardHeader>
            <CardTitle>Submissions ({assignment.submissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assignment.submissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {assignment.submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={submission.student?.avatar} />
                            <AvatarFallback>
                              {submission.student?.name?.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{submission.student?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={submission.status === 'GRADED' ? 'default' : 'secondary'}>
                          {submission.late ? 'Late' : submission.status}
                        </Badge>
                      </div>
                      {submission.content && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{submission.content}</p>
                      )}
                      {/* Show attachments for teacher view */}
                      {submission.attachments && Array.isArray(submission.attachments) && submission.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(submission.attachments as string[]).map((path, idx) => (
                            <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm">
                              <File className="w-3 h-3 text-red-500" />
                              <span>{path.split('/').pop()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {submission.grade ? (
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-green-600">
                            {submission.grade.score}/{submission.grade.maxScore}
                          </span>
                          <Progress value={submission.grade.percentage} className="flex-1" />
                        </div>
                      ) : (
                        <GradingPanel submissionId={submission.id} maxPoints={assignment.points} onGraded={() => {}} />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// GRADING PANEL
// ============================================

function GradingPanel({ submissionId, maxPoints, onGraded }: { submissionId: string; maxPoints: number; onGraded: () => void }) {
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGrade = async () => {
    if (!score) return;
    setLoading(true);

    const res = await api.post('/api/grades', {
      submissionId,
      score: parseFloat(score),
      maxScore: maxPoints,
      feedback,
    });

    setLoading(false);
    if (res.success) {
      toast({ title: 'Grade saved!' });
      onGraded();
    } else {
      toast({ title: 'Error saving grade', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-end gap-2 mt-2 pt-2 border-t">
      <div className="flex-1">
        <Label className="text-xs">Score</Label>
        <Input
          type="number"
          placeholder="0"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          max={maxPoints}
          min={0}
          className="w-24"
        />
      </div>
      <div className="flex-1">
        <Label className="text-xs">Feedback</Label>
        <Input
          placeholder="Optional feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </div>
      <Button size="sm" onClick={handleGrade} disabled={loading || !score}>
        Grade
      </Button>
    </div>
  );
}

// ============================================
// GRADES VIEW
// ============================================

function GradesView({ onViewChange }: { onViewChange: (view: string) => void }) {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      const res = await api.get<{ grades: GradeData[] }>('/api/grades');
      if (res.success) setGrades(res.grades || []);
      setLoading(false);
    };
    fetchGrades();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const avgGrade = grades.length > 0
    ? Math.round(grades.reduce((acc, g) => acc + g.percentage, 0) / grades.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Grades</h1>
        <p className="text-muted-foreground">View your grades and performance</p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold">{avgGrade}%</p>
              <p className="text-muted-foreground">Overall Average</p>
            </div>
            <div className="w-32 h-32">
              <Progress value={avgGrade} className="h-32 w-6 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade List */}
      <Card>
        <CardHeader>
          <CardTitle>All Grades</CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No grades yet</p>
          ) : (
            <div className="space-y-3">
              {grades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="font-medium">{grade.assignment?.title}</p>
                    <p className="text-sm text-muted-foreground">{grade.assignment?.class?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: grade.percentage >= 70 ? '#22c55e' : grade.percentage >= 50 ? '#eab308' : '#ef4444' }}>
                      {grade.percentage.toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">{grade.score}/{grade.maxScore}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// MESSAGES VIEW
// ============================================

function MessagesView({ user }: { user: AuthUser }) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const [messagesRes, usersRes] = await Promise.all([
        api.get<{ messages: MessageData[] }>('/api/messages'),
        api.get<{ users: { id: string; name: string; role: string }[] }>('/api/users'),
      ]);
      if (messagesRes.success) setMessages(messagesRes.messages || []);
      if (usersRes.success) setUsers(usersRes.users || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCompose = async (receiverId: string, subject: string, content: string) => {
    const res = await api.post('/api/messages', { receiverId, subject, content });
    if (res.success) {
      toast({ title: 'Message sent!' });
      setShowCompose(false);
      // Refresh messages
      const messagesRes = await api.get<{ messages: MessageData[] }>('/api/messages');
      if (messagesRes.success) setMessages(messagesRes.messages || []);
    } else {
      toast({ title: 'Error sending message', variant: 'destructive' });
    }
  };

  const markAsRead = async (messageId: string) => {
    await api.put(`/api/messages/${messageId}/read`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const inbox = messages.filter(m => m.receiver?.id === user.id);
  const sent = messages.filter(m => m.sender?.id === user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communicate with teachers and classmates</p>
        </div>
        <Button onClick={() => setShowCompose(true)}>
          <Send className="w-4 h-4 mr-2" /> Compose
        </Button>
      </div>

      {selectedMessage ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <CardTitle>{selectedMessage.subject || 'No Subject'}</CardTitle>
              <CardDescription>
                From: {selectedMessage.sender?.name} • {new Date(selectedMessage.createdAt).toLocaleString()}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inbox">Inbox ({inbox.length})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <Card>
              <CardContent className="pt-6">
                {inbox.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No messages</p>
                ) : (
                  <div className="space-y-2">
                    {inbox.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${!msg.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => {
                          setSelectedMessage(msg);
                          if (!msg.read) markAsRead(msg.id);
                        }}
                      >
                        <Avatar>
                          <AvatarImage src={msg.sender?.avatar} />
                          <AvatarFallback>{msg.sender?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{msg.sender?.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{msg.subject || msg.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <CardContent className="pt-6">
                {sent.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sent messages</p>
                ) : (
                  <div className="space-y-2">
                    {sent.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <Avatar>
                          <AvatarImage src={msg.receiver?.avatar} />
                          <AvatarFallback>{msg.receiver?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">To: {msg.receiver?.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{msg.subject || msg.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Compose Modal */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <ComposeMessageForm users={users.filter(u => u.id !== user.id)} onSend={handleCompose} onCancel={() => setShowCompose(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComposeMessageForm({
  users,
  onSend,
  onCancel,
}: {
  users: { id: string; name: string; role: string }[];
  onSend: (receiverId: string, subject: string, content: string) => void;
  onCancel: () => void;
}) {
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="space-y-4">
      <Select value={receiverId} onValueChange={setReceiverId}>
        <SelectTrigger>
          <SelectValue placeholder="Select recipient" />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name} ({u.role.toLowerCase()})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <Textarea placeholder="Write your message..." value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSend(receiverId, subject, content)} disabled={!receiverId || !content}>
          Send
        </Button>
      </div>
    </div>
  );
}

// ============================================
// NOTIFICATIONS VIEW
// ============================================

function NotificationsView({ notifications }: { notifications: NotificationData[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Your recent notifications</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-3 rounded-lg ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{notif.title}</p>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function EClassroomApp() {
  const { user, isAuthenticated, isLoading, setLoading, login, logout } = useAuthStore();
  const { currentView, setCurrentView } = useUIStore();
  const [view, setView] = useState('landing');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const res = await api.get<{ user: AuthUser }>('/api/auth/me');
      if (res.success && res.user) {
        login(res.user, 'session');
      }
      setLoading(false);
    };
    checkAuth();
  }, [login, setLoading]);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchNotifications = async () => {
        const res = await api.get<{ notifications: NotificationData[]; unreadCount: number }>('/api/notifications');
        if (res.success) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      };
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  // Fetch unread message count
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchUnreadMessages = async () => {
        const res = await api.get<{ unreadCount: number }>('/api/messages');
        if (res.success) {
          setUnreadMessages(res.unreadCount || 0);
        }
      };
      fetchUnreadMessages();
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchUnreadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      if (hash === '/') {
        setView(isAuthenticated ? 'dashboard' : 'landing');
      } else {
        setView(hash.slice(1));
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  const handleViewChange = (newView: string) => {
    window.location.hash = `#/${newView}`;
  };

  const handleLogout = async () => {
    await api.post('/api/auth/logout');
    logout();
    window.location.hash = '/';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading E-Classroom...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show public pages
  if (!isAuthenticated) {
    if (view === 'login') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <LoginForm
            onSuccess={(u) => {
              login(u, 'session');
              handleViewChange('dashboard');
            }}
            onSwitchToRegister={() => handleViewChange('register')}
          />
        </div>
      );
    }

    if (view === 'register') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <RegisterForm
            onSuccess={(u) => {
              login(u, 'session');
              handleViewChange('dashboard');
            }}
            onSwitchToLogin={() => handleViewChange('login')}
          />
        </div>
      );
    }

    return (
      <LandingPage
        onLogin={() => handleViewChange('login')}
        onRegister={() => handleViewChange('register')}
      />
    );
  }

  // Authenticated - show dashboard
  const renderContent = () => {
    // Dashboard
    if (view === 'dashboard' || view === '') {
      return user?.role === 'STUDENT' ? (
        <StudentDashboard user={user} onViewChange={handleViewChange} />
      ) : user?.role === 'TEACHER' ? (
        <TeacherDashboard user={user} onViewChange={handleViewChange} />
      ) : user?.role === 'SUPER_ADMIN' ? (
        <SuperAdminDashboard user={user} onViewChange={handleViewChange} />
      ) : (
        <SchoolAdminDashboard user={user} onViewChange={handleViewChange} />
      );
    }

    // Schools (Super Admin only)
    if (view === 'schools') {
      return <SchoolsView />;
    }

    // Users (Admin only)
    if (view === 'users') {
      return <UsersView user={user} />;
    }

    // Analytics (Admin/Teacher)
    if (view === 'analytics') {
      return <AnalyticsView />;
    }

    // Classes
    if (view === 'classes') {
      return <ClassesView user={user} onViewChange={handleViewChange} />;
    }

    // Class Detail
    if (view.startsWith('class-') && !view.includes('assignment')) {
      const classId = view.replace('class-', '');
      return <ClassDetailView classId={classId} user={user} onViewChange={handleViewChange} />;
    }

    // Assignments
    if (view === 'assignments') {
      return <AssignmentsView user={user} onViewChange={handleViewChange} />;
    }

    // Assignment Detail
    if (view.startsWith('assignment-')) {
      const assignmentId = view.replace('assignment-', '');
      return <AssignmentDetailView assignmentId={assignmentId} user={user} onViewChange={handleViewChange} />;
    }

    // Grades
    if (view === 'grades' || view === 'gradebook') {
      return <GradesView onViewChange={handleViewChange} />;
    }

    // Messages
    if (view === 'messages') {
      return <MessagesView user={user} />;
    }

    // Notifications
    if (view === 'notifications') {
      return <NotificationsView notifications={notifications} />;
    }

    // Default - dashboard based on role
    return user?.role === 'STUDENT' ? (
      <StudentDashboard user={user} onViewChange={handleViewChange} />
    ) : user?.role === 'TEACHER' ? (
      <TeacherDashboard user={user} onViewChange={handleViewChange} />
    ) : user?.role === 'SUPER_ADMIN' ? (
      <SuperAdminDashboard user={user} onViewChange={handleViewChange} />
    ) : (
      <SchoolAdminDashboard user={user} onViewChange={handleViewChange} />
    );
  };

  return (
    <DashboardLayout
      user={user}
      onLogout={handleLogout}
      currentView={view}
      onViewChange={handleViewChange}
      notifications={notifications}
      unreadCount={unreadCount}
      unreadMessages={unreadMessages}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
