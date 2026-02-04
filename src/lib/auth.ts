import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, profiles, staffRoles as userRoles, dryerAssignments, dryers } from './schema';
import { eq } from 'drizzle-orm';
import { UserRole } from './permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: UserRole;
  region?: string;
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
      
      // Get user profile with role
      const [result] = await db
        .select({
          id: profiles.id,
          email: profiles.email,
          fullName: profiles.fullName,
          phone: profiles.phone,
          role: userRoles.role,
          region: userRoles.region,
        })
        .from(profiles)
        .leftJoin(userRoles, eq(profiles.id, userRoles.staffId))
        .where(eq(profiles.id, decoded.userId))
        .limit(1);

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        email: result.email,
        fullName: result.fullName || undefined,
        phone: result.phone || undefined,
        role: result.role || undefined,
        region: result.region || undefined,
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
        .where(eq(userRoles.staffId, userId))
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
        .where(eq(userRoles.staffId, userId));

      return roles.some(role => ['admin', 'super_admin'].includes(role.role));
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }

  // Check if user is super admin
  static async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const [userRole] = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.staffId, userId))
        .limit(1);

      return userRole?.role === 'super_admin';
    } catch (error) {
      console.error('Super admin check error:', error);
      return false;
    }
  }

  // Get user role
  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const [userRole] = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.staffId, userId))
        .limit(1);

      return userRole?.role || null;
    } catch (error) {
      console.error('Get user role error:', error);
      return null;
    }
  }

  // Get user's assigned region (for regional managers)
  static async getUserRegion(userId: string): Promise<string | null> {
    try {
      const [userRole] = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.staffId, userId))
        .limit(1);

      return userRole?.region || null;
    } catch (error) {
      console.error('Get user region error:', error);
      return null;
    }
  }

  // Get assigned dryer IDs for field technician
  static async getAssignedDryerIds(userId: string): Promise<string[]> {
    try {
      const assignments = await db
        .select({ dryerId: dryerAssignments.dryerId })
        .from(dryerAssignments)
        .where(eq(dryerAssignments.technicianId, userId));

      return assignments.map(a => a.dryerId);
    } catch (error) {
      console.error('Get assigned dryers error:', error);
      return [];
    }
  }

  // Check if user can access specific dryer
  static async canAccessDryer(userId: string, dryerId: string): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId);
      
      if (!role) return false;

      // Super admin and admin can access all dryers
      if (role === 'super_admin' || role === 'admin') {
        return true;
      }

      // Regional manager can access dryers in their region
      if (role === 'regional_manager') {
        const userRegion = await this.getUserRegion(userId);
        if (!userRegion) return false;

        const [dryer] = await db
          .select()
          .from(dryers)
          .where(eq(dryers.id, dryerId))
          .limit(1);

        return dryer?.regionId === userRegion;
      }

      // Field technician can only access assigned dryers
      if (role === 'field_technician') {
        const assignedDryerIds = await this.getAssignedDryerIds(userId);
        return assignedDryerIds.includes(dryerId);
      }

      return false;
    } catch (error) {
      console.error('Can access dryer error:', error);
      return false;
    }
  }
}
