import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, profiles, userRoles } from '@/lib/schema';
import { AuthService } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Get all users with their profiles and roles
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await AuthService.isAdmin(currentUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all users with their profiles and roles
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        fullName: profiles.fullName,
        phone: profiles.phone,
        role: userRoles.role,
        region: userRoles.region,
        roleCreatedAt: userRoles.createdAt,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.id))
      .leftJoin(userRoles, eq(profiles.id, userRoles.userId))
      .orderBy(users.createdAt);

    return NextResponse.json(allUsers);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const isAdmin = await AuthService.isAdmin(currentUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { email, password, fullName, phone, role, region } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
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
      phone,
    }).returning();

    // Create user role
    const [userRole] = await db.insert(userRoles).values({
      userId: newUser.id,
      role,
      region,
    }).returning();

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      fullName: profile.fullName,
      phone: profile.phone,
      role: userRole.role,
      region: userRole.region,
      createdAt: newUser.createdAt,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
