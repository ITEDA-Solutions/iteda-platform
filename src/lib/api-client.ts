'use client'

// Client-side API wrapper that mimics Supabase structure
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

class ApiClient {
  private baseUrl = '/api';

  // Helper method to make API calls
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: data.error || 'An error occurred' } };
    }

    return { data, error: null };
  }

  // Auth methods
  auth = {
    signUp: async ({ email, password, options }: {
      email: string;
      password: string;
      options?: {
        data?: { full_name?: string };
        emailRedirectTo?: string;
      }
    }) => {
      const result = await this.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          fullName: options?.data?.full_name,
        }),
      });

      if (result.data?.token) {
        localStorage.setItem('auth_token', result.data.token);
      }

      return result;
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const result = await this.request('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result.data?.token) {
        localStorage.setItem('auth_token', result.data.token);
      }

      return result;
    },

    signOut: async () => {
      localStorage.removeItem('auth_token');
      return { error: null };
    },

    getSession: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { data: { session: null }, error: null };
      }

      const result = await this.request('/auth/session');
      return { data: { session: result.data }, error: result.error };
    },

    onAuthStateChange: (callback: (event: string, session: AuthSession | null) => void) => {
      // Simple implementation - check auth state
      const checkAuth = async () => {
        const { data } = await this.auth.getSession();
        callback(data.session ? 'SIGNED_IN' : 'SIGNED_OUT', data.session);
      };

      checkAuth();

      // Return unsubscribe function
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              // Cleanup logic here
            }
          }
        }
      };
    }
  };

  // Realtime subscription methods (mocked)
  channel(name: string) {
    return {
      on: (event: string, config: any, callback: () => void) => {
        return {
          subscribe: () => {
            return { unsubscribe: () => { } };
          }
        }
      },
      subscribe: () => {
        return {
          unsubscribe: () => { }
        }
      },
      unsubscribe: () => { }
    };
  }

  removeChannel(channel: any) {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
  }

  // Database query methods
  from(table: string) {
    return new QueryBuilder(table, this.request.bind(this));
  }
}

// Type definitions for Supabase-compatible responses
export interface PostgrestResponse<T = any> {
  data: T | null;
  error: { message: string } | null;
}

class QueryBuilder implements PromiseLike<PostgrestResponse> {
  private tableName: string;
  private request: (endpoint: string, options?: RequestInit) => Promise<any>;
  private selectFields: string[] = ['*'];
  private whereConditions: any[] = [];
  private orderByFields: any[] = [];
  private limitCount?: number;
  private isSingle: boolean = false;

  constructor(tableName: string, request: (endpoint: string, options?: RequestInit) => Promise<any>) {
    this.tableName = tableName;
    this.request = request;
  }

  select(fields: string = '*') {
    this.selectFields = fields === '*' ? ['*'] : fields.split(',').map(f => f.trim());
    return this;
  }

  eq(column: string, value: any) {
    this.whereConditions.push({ column, operator: '=', value });
    return this;
  }

  neq(column: string, value: any) {
    this.whereConditions.push({ column, operator: '!=', value });
    return this;
  }

  gt(column: string, value: any) {
    this.whereConditions.push({ column, operator: '>', value });
    return this;
  }

  gte(column: string, value: any) {
    this.whereConditions.push({ column, operator: '>=', value });
    return this;
  }

  lt(column: string, value: any) {
    this.whereConditions.push({ column, operator: '<', value });
    return this;
  }

  lte(column: string, value: any) {
    this.whereConditions.push({ column, operator: '<=', value });
    return this;
  }

  like(column: string, pattern: string) {
    this.whereConditions.push({ column, operator: 'LIKE', value: pattern });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.whereConditions.push({ column, operator: 'ILIKE', value: pattern });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByFields.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    this.limitCount = 1;
    return this;
  }

  insert(values: any | any[]) {
    return new TerminalQuery(async () => {
      const result = await this.request(`/db/${this.tableName}`, {
        method: 'POST',
        body: JSON.stringify({ values }),
      });
      return result;
    });
  }

  update(values: any) {
    return new TerminalQuery(async () => {
      return await this.request(`/db/${this.tableName}`, {
        method: 'PUT',
        body: JSON.stringify({
          values,
          where: this.whereConditions,
        }),
      });
    });
  }

  delete() {
    return new TerminalQuery(async () => {
      return await this.request(`/db/${this.tableName}`, {
        method: 'DELETE',
        body: JSON.stringify({ where: this.whereConditions }),
      });
    });
  }

  // Make QueryBuilder thenable so it can be awaited directly
  then(onfulfilled?: any, onrejected?: any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch(onrejected?: any) {
    return this.execute().catch(onrejected);
  }

  // Execute the query
  async execute() {
    const params = new URLSearchParams();

    if (this.selectFields.length > 0 && this.selectFields[0] !== '*') {
      params.append('select', this.selectFields.join(','));
    }

    if (this.whereConditions.length > 0) {
      params.append('where', JSON.stringify(this.whereConditions));
    }

    if (this.orderByFields.length > 0) {
      params.append('order', JSON.stringify(this.orderByFields));
    }

    if (this.limitCount) {
      params.append('limit', this.limitCount.toString());
    }

    const queryString = params.toString();
    const endpoint = `/db/${this.tableName}${queryString ? `?${queryString}` : ''}`;

    const result = await this.request(endpoint);

    // If single() was called, return just the first item
    if (this.isSingle && result.data && Array.isArray(result.data)) {
      return { ...result, data: result.data[0] || null };
    }

    return result;
  }
}

// Terminal query class for insert/update/delete that need to be chained with select().single()
class TerminalQuery implements PromiseLike<PostgrestResponse> {
  private executor: () => Promise<any>;
  private selectFields: boolean = false;
  private isSingle: boolean = false;

  constructor(executor: () => Promise<any>) {
    this.executor = executor;
  }

  select(fields: string = '*') {
    this.selectFields = true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Make TerminalQuery thenable
  then(onfulfilled?: any, onrejected?: any) {
    return this.executor().then((result) => {
      if (this.isSingle && result.data && Array.isArray(result.data)) {
        return { ...result, data: result.data[0] || null };
      }
      return result;
    }).then(onfulfilled, onrejected);
  }

  catch(onrejected?: any) {
    return this.executor().catch(onrejected);
  }

  // Explicit execution method
  execute() {
    return this.executor();
  }
}

// Export the client instance
export const apiClient = new ApiClient();

// For backward compatibility with existing Supabase imports
export const supabase = apiClient;
