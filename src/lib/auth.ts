import { supabaseAdmin } from './supabase-server';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export class AuthService {
  // Sign up new user using Supabase Auth
  static async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<AuthSession> {
    try {
      const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Signup failed - no user or session returned');
      }

      // The trigger will automatically create the profile
      // Fetch the profile to return complete user data
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          fullName: profile?.full_name || fullName,
          phone: profile?.phone || undefined,
          avatarUrl: profile?.avatar_url || undefined,
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in user using Supabase Auth
  static async signIn(email: string, password: string): Promise<AuthSession> {
    try {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Sign in failed - no user or session returned');
      }

      // Fetch the profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          fullName: profile?.full_name || undefined,
          phone: profile?.phone || undefined,
          avatarUrl: profile?.avatar_url || undefined,
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Verify access token and get user
  static async verifyToken(accessToken: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

      if (error || !data.user) {
        return null;
      }

      // Fetch the profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        id: data.user.id,
        email: data.user.email!,
        fullName: profile?.full_name || undefined,
        phone: profile?.phone || undefined,
        avatarUrl: profile?.avatar_url || undefined,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Get user session from access token
  static async getSession(accessToken?: string): Promise<AuthSession | null> {
    if (!accessToken) return null;

    const user = await this.verifyToken(accessToken);
    if (!user) return null;

    return { user, accessToken };
  }

  // Sign out user
  static async signOut(accessToken?: string): Promise<void> {
    try {
      if (accessToken) {
        // Sign out the specific session
        await supabaseAdmin.auth.admin.signOut(accessToken);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Don't throw - sign out should be graceful
    }
  }

  // Check if user has specific role
  static async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const { data: userRole, error } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', role as any)
        .single();

      return !error && !!userRole;
    } catch (error) {
      console.error('Role check error:', error);
      return false;
    }
  }

  // Check if user is admin
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data: roles, error } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error || !roles) {
        return false;
      }

      return roles.some((r) => ['admin', 'super_admin'].includes(r.role));
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }

  // Get user's roles
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      const { data: roles, error } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error || !roles) {
        return [];
      }

      return roles.map((r) => r.role);
    } catch (error) {
      console.error('Get roles error:', error);
      return [];
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string,
    updates: { fullName?: string; phone?: string; avatarUrl?: string }
  ): Promise<User | null> {
    try {
      const updateData: Record<string, any> = {};
      if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error || !profile) {
        throw new Error(error?.message || 'Failed to update profile');
      }

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name || undefined,
        phone: profile.phone || undefined,
        avatarUrl: profile.avatar_url || undefined,
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return null;
    }
  }

  // Assign role to user (admin only)
  static async assignRole(
    userId: string,
    role: string,
    region?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.from('user_roles').upsert(
        {
          user_id: userId,
          role: role as any,
          region,
        },
        {
          onConflict: 'user_id,role',
        }
      );

      return !error;
    } catch (error) {
      console.error('Assign role error:', error);
      return false;
    }
  }

  // Remove role from user (admin only)
  static async removeRole(userId: string, role: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      return !error;
    } catch (error) {
      console.error('Remove role error:', error);
      return false;
    }
  }
}
