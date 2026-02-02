import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.find((u) => u.email === email);

    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth (auto-confirmed for development)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ✅ Auto-confirm email - no verification needed!
      user_metadata: {
        full_name: fullName || email,
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    console.log('✅ User created and auto-confirmed:', email);

    // Create profile in public.profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName || email,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Continue even if profile creation fails - it might be handled by trigger
    }

    // Sign in the user immediately to get a session token
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
    }

    console.log('✅ User signed in automatically:', email);

    return NextResponse.json({
      user: sessionData.user,
      session: sessionData.session,
      token: sessionData.session?.access_token,
      message: 'Account created and signed in successfully',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 400 }
    );
  }
}
