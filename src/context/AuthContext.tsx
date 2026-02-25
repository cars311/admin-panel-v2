import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, logoutActiveUser } from '../services/auth/auth';
import type { SignInProps } from '../types/auth';

interface User {
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isVerified: boolean;
  picture: string;
}

interface AuthContextType {
  readonly user: User;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly login: (props: SignInProps) => Promise<{ message: string }>;
  readonly logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({
    email: '',
    roles: [],
    isVerified: false,
    picture: '',
  });
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuthenticated(true);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    }
    setIsLoading(false);
  }, []);

  const login = async ({
    email,
    password,
    isUndertakeSession = false,
    isFromAdminPanel = true,
  }: SignInProps): Promise<{ message: string }> => {
    const res = await signIn({
      email,
      password,
      isUndertakeSession,
      isFromAdminPanel,
    });

    if (res.accessToken) {
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem(
        'user',
        JSON.stringify({
          email,
          roles: res.roles,
          isVerified: res.isEmailVerified,
          picture: res.picture,
        }),
      );

      setUser({
        email,
        roles: res.roles,
        isVerified: res.isEmailVerified,
        picture: res.picture,
      });

      setAuthenticated(true);
      navigate('/');
    }

    return { message: res.message };
  };

  const logout = async () => {
    try {
      await logoutActiveUser();
    } catch (e) {
      // silent
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser({
      email: '',
      roles: [],
      isVerified: false,
      picture: '',
    });
    setAuthenticated(false);
    setIsLoading(false);

    navigate('/auth/signin');
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
