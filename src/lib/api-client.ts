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
      options?: { data?: { full_name?: string } } 
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

  // Database query methods
  from(table: string) {
    return new QueryBuilder(table, this.request.bind(this));
  }
}

class QueryBuilder {
  private tableName: string;
  private request: (endpoint: string, options?: RequestInit) => Promise<any>;
  private selectFields: string[] = ['*'];
  private whereConditions: any[] = [];
  private orderByFields: any[] = [];
  private limitCount?: number;

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

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByFields.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async insert(values: any | any[]) {
    return await this.request(`/db/${this.tableName}`, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  }

  async update(values: any) {
    return await this.request(`/db/${this.tableName}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        values,
        where: this.whereConditions,
      }),
    });
  }

  async delete() {
    return await this.request(`/db/${this.tableName}`, {
      method: 'DELETE',
      body: JSON.stringify({ where: this.whereConditions }),
    });
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
    
    return await this.request(endpoint);
  }
}

// Export the client instance
export const apiClient = new ApiClient();

// For backward compatibility with existing Supabase imports
export const supabase = apiClient;
