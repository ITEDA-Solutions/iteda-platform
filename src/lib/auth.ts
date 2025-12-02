import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, profiles, userRoles } from './schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export class AuthService {
  // Sign up new user
  static async signUp(email: string, password: string, fullName?: string): Promise<AuthSession> {
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
      }).returning();

      // Create profile
      const [profile] = await db.insert(profiles).values({
        id: newUser.id,
        email,
        fullName: fullName || email,
      }).returning();

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName || undefined,
          phone: profile.phone || undefined,
        },
        token,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in user
  static async signIn(email: string, password: string): Promise<AuthSession> {
    try {
      // Find user
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Get profile
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName || undefined,
          phone: profile.phone || undefined,
        },
        token,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      
      // Get user profile
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, decoded.userId)).limit(1);
      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName || undefined,
        phone: profile.phone || undefined,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Get user session from token
  static async getSession(token?: string): Promise<AuthSession | null> {
    if (!token) return null;

    const user = await this.verifyToken(token);
    if (!user) return null;

    return { user, token };
  }

  // Sign out (client-side token removal)
  static async signOut(): Promise<void> {
    // In a real app, you might want to blacklist the token
    // For now, we'll just rely on client-side token removal
    return Promise.resolve();
  }

  // Check if user has specific role
  static async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const [userRole] = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId))
        .limit(1);

      return userRole?.role === role;
    } catch (error) {
      console.error('Role check error:', error);
      return false;
    }
  }

  // Check if user is admin
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const roles = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

      return roles.some(role => ['admin', 'super_admin'].includes(role.role));
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }
}
