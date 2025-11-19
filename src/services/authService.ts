// src/services/authService.ts
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getStoredAuthUser = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_USER_KEY);
};

export const setStoredAuthUser = (userJson: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_USER_KEY, userJson);
};

export const removeStoredAuthUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_USER_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
