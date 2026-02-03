import api from './api';

const TOKEN_KEY = 'docuquery_token';
const USER_KEY = 'docuquery_user';

export interface User {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

/**
 * Get stored auth token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set auth token
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear auth token
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * Set stored user
 */
export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Register a new user
 */
export async function register(email: string, password: string, name: string): Promise<User> {
  const response = await api.post<User>('/auth/register', {
    email,
    password,
    name,
  });
  return response.data;
}

/**
 * Login user and store token
 */
export async function login(email: string, password: string): Promise<User> {
  // Get token
  const tokenResponse = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  setToken(tokenResponse.data.access_token);

  // Get user info
  const user = await getMe();
  setStoredUser(user);

  return user;
}

/**
 * Logout user
 */
export function logout(): void {
  clearToken();
}

/**
 * Get current user from API
 */
export async function getMe(): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await api.get<User>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setStoredUser(response.data);
  return response.data;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}
