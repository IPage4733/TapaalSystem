// src/services/authService.ts
const ACCESS_TOKEN_KEY = 'access_token';
const AUTH_USER_KEY = 'auth_user';

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const clearAccessToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
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
