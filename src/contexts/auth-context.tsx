
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface User { // App-specific User interface
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  register: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  updateUserMetadata: (metadata: { name?: string; avatarUrl?: string }) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for persisted user on initial mount (helps with flicker before Supabase listener fires)
    const storedUser = localStorage.getItem('lurmUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('lurmUser');
      }
    }
    // Initial loading true, will be set to false once onAuthStateChange fires for the first time
    // or if there's an immediate session available (though onAuthStateChange handles this robustly).
    setIsLoading(true); 

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          const appUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name as string || supabaseUser.email?.split('@')[0] || 'User',
            avatarUrl: supabaseUser.user_metadata?.avatar_url as string || `https://placehold.co/100x100.png?text=${(supabaseUser.user_metadata?.name as string || supabaseUser.email || 'U').charAt(0).toUpperCase()}`,
          };
          setUser(appUser);
          localStorage.setItem('lurmUser', JSON.stringify(appUser));
        } else {
          setUser(null);
          localStorage.removeItem('lurmUser');
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    return { error };
  };

  const register = async (email: string, password: string, name: string): Promise<{ error: AuthError | null }> => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          avatar_url: `https://placehold.co/100x100.png?text=${name ? name.charAt(0).toUpperCase() : 'U'}`,
        },
      },
    });
    setIsLoading(false);
    return { error };
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('lurmUser');
    setIsLoading(false);
  };

  const updateUserMetadata = async (metadata: { name?: string; avatarUrl?: string }): Promise<{ error: AuthError | null }> => {
    if (!user) return { error: { name: "AuthError", message: "User not authenticated" } as AuthError };
    setIsLoading(true);
    const updateData: { name?: string; avatar_url?: string } = {};
    if (metadata.name) updateData.name = metadata.name;
    if (metadata.avatarUrl) updateData.avatar_url = metadata.avatarUrl;

    const { data: updatedSupabaseUser, error } = await supabase.auth.updateUser({ data: updateData });
    if (updatedSupabaseUser?.user) {
      const updatedAppUser: User = {
        id: updatedSupabaseUser.user.id,
        email: updatedSupabaseUser.user.email,
        name: updatedSupabaseUser.user.user_metadata?.name as string || user.name,
        avatarUrl: updatedSupabaseUser.user.user_metadata?.avatar_url as string || user.avatarUrl,
      };
      setUser(updatedAppUser);
      localStorage.setItem('lurmUser', JSON.stringify(updatedAppUser));
    }
    setIsLoading(false);
    return { error };
  };
  
  const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
    if (!user) return { error: { name: "AuthError", message: "User not authenticated" } as AuthError };
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    return { error };
  };

  if (isLoading && !user) { // Show loading only if no user is yet available (e.g. on first load)
     return <div className="flex h-screen items-center justify-center"><p>Loading application...</p></div>;
  }


  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUserMetadata, updatePassword }}>
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
