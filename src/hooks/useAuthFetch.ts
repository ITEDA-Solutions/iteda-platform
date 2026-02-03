'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

interface FetchResult<T> {
  data: T | null;
  error: { message: string } | null;
  status: number;
}

/**
 * Hook that provides an authenticated fetch function
 * Automatically includes the Supabase access token in API requests
 */
export function useAuthFetch() {
  const authFetch = useCallback(async <T = unknown>(
    url: string,
    options: FetchOptions = {}
  ): Promise<FetchResult<T>> => {
    const { skipAuth, ...fetchOptions } = options;

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        return {
          data: null,
          error: { message: 'Failed to get session' },
          status: 401,
        };
      }

      if (!session?.access_token && !skipAuth) {
        return {
          data: null,
          error: { message: 'Not authenticated' },
          status: 401,
        };
      }

      // Merge headers with auth token
      const headers = new Headers(fetchOptions.headers);

      if (!headers.has('Content-Type') && fetchOptions.body) {
        headers.set('Content-Type', 'application/json');
      }

      if (session?.access_token && !skipAuth) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          data: null,
          error: { message: data?.error || `Request failed with status ${response.status}` },
          status: response.status,
        };
      }

      return {
        data: data as T,
        error: null,
        status: response.status,
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Network error' },
        status: 0,
      };
    }
  }, []);

  return { authFetch };
}

/**
 * Standalone function to get auth headers for fetch calls
 * Useful when you can't use hooks (e.g., in callbacks)
 */
export async function getAuthHeaders(): Promise<Headers> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  } catch (error) {
    console.error('Failed to get auth headers:', error);
  }

  return headers;
}

/**
 * Standalone authenticated fetch function
 * Automatically includes the Supabase access token
 */
export async function authFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: { message: string } | null; status: number }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: { message: data?.error || `Request failed with status ${response.status}` },
        status: response.status,
      };
    }

    return {
      data: data as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    console.error('Fetch error:', error);
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : 'Network error' },
      status: 0,
    };
  }
}
