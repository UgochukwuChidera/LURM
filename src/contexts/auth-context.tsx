
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
  isAdmin?: boolean; // Added isAdmin
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
  const [isLoading, setIsLoading] = useState(true); // isLoading is true initially
  const { toast } = useToast();

  useEffect(() => {
    // Attempt to load user from localStorage only on the client side
    const storedUserString = localStorage.getItem('lurmUser');
    if (storedUserString) {
      try {
        const storedUser = JSON.parse(storedUserString);
         // Check if stored user has isAdmin, if not, it's an older version or not fetched yet.
        if (typeof storedUser.isAdmin !== 'undefined') {
          setUser(storedUser); // Set user if found in localStorage
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('lurmUser');
      }
    }
    // setIsLoading(true) is not needed here as it's already true by default.
    // setIsLoading(false) will be called by the onAuthStateChange listener.

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          let isAdmin = false;
          // Attempt to get admin status from existing user state first if available (e.g., from localStorage)
          if (user && user.id === supabaseUser.id && typeof user.isAdmin !== 'undefined') {
            isAdmin = user.isAdmin;
          } else {
            // Otherwise, fetch from profiles table
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', supabaseUser.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found
              console.error('Error fetching profile for admin status:', profileError.message);
            } else if (profile) {
              isAdmin = profile.is_admin || false;
            }
          }

          const appUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name as string || supabaseUser.email?.split('@')[0] || 'User',
            avatarUrl: supabaseUser.user_metadata?.avatar_url as string || `https://placehold.co/100x100.png?text=${(supabaseUser.user_metadata?.name as string || supabaseUser.email || 'U').charAt(0).toUpperCase()}`,
            isAdmin: isAdmin,
          };
          setUser(appUser);
          localStorage.setItem('lurmUser', JSON.stringify(appUser));
        } else {
          setUser(null);
          localStorage.removeItem('lurmUser');
        }
        setIsLoading(false); // Set loading to false after auth state is determined
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount (client-side)

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setIsLoading(false);
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
    if (error) setIsLoading(false);
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
    
    const { data: updatedAuthUser, error: authUpdateError } = await supabase.auth.updateUser({ data: updateData });

    if (authUpdateError) {
        setIsLoading(false);
        return { error: authUpdateError };
    }

    const profileUpdates: {name?: string; avatar_url?: string} = {};
    if(metadata.name) profileUpdates.name = metadata.name;
    if(metadata.avatarUrl) profileUpdates.avatar_url = metadata.avatarUrl;

    if (Object.keys(profileUpdates).length > 0) {
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id);
        
        if (profileUpdateError) {
            console.error("Error updating profile table:", profileUpdateError);
        }
    }

    if (updatedAuthUser?.user) {
      const updatedAppUser: User = {
        ...user,
        id: updatedAuthUser.user.id,
        email: updatedAuthUser.user.email,
        name: updatedAuthUser.user.user_metadata?.name as string || user.name,
        avatarUrl: updatedAuthUser.user.user_metadata?.avatar_url as string || user.avatarUrl,
      };
      setUser(updatedAppUser);
      localStorage.setItem('lurmUser', JSON.stringify(updatedAppUser));
    }
    setIsLoading(false);
    return { error: null };
  };
  
  const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
    if (!user) return { error: { name: "AuthError", message: "User not authenticated" } as AuthError };
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    return { error };
  };

  // Display a loading indicator while authentication status is being determined.
  // This check now correctly avoids localStorage access on the server.
  if (isLoading) {
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
