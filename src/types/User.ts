export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  phoneNumber: string;
}

export type UserRole = 
  | 'collector'
  | 'joint_collector'
  | 'co_officer'
  | 'dro'
  | 'rdo'
  | 'tahsildar'
  | 'naib_tahsildar'
  | 'ri'
  | 'vro'
  | 'clerk';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phoneNumber: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}