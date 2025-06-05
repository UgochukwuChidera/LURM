
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  updateAvatar: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load user from localStorage on initial mount
    const storedUser = localStorage.getItem('lurmUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email: string, name: string = 'User') => {
    const newUser: User = { id: Date.now().toString(), email, name, avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0).toUpperCase()}` };
    setUser(newUser);
    localStorage.setItem('lurmUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lurmUser');
  };
  
  const updateAvatar = (url: string) => {
    if (user) {
      const updatedUser = { ...user, avatarUrl: url };
      setUser(updatedUser);
      localStorage.setItem('lurmUser', JSON.stringify(updatedUser));
    }
  };


  if (loading) {
    return <div className="flex h-screen items-center justify-center"><p>Loading...</p></div>; // Or a proper skeleton loader
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
