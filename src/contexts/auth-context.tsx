
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
  isAdmin?: boolean;
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
        if (typeof storedUser.isAdmin !== 'undefined') {
          setUser(storedUser);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('lurmUser');
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          let isAdmin = false;
          // Attempt to get admin status from existing user state first if available
          if (user && user.id === supabaseUser.id && typeof user.isAdmin !== 'undefined') {
            isAdmin = user.isAdmin;
          } else {
            // Otherwise, fetch from profiles table
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', supabaseUser.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') { 
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
        setIsLoading(false); 
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // user dependency removed to avoid re-running profile fetch unnecessarily on user object change if not related to session
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); 

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    // setIsLoading(true); // Removed
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // if (error) setIsLoading(false); // Removed
    return { error };
  };

  const register = async (email: string, password: string, name: string): Promise<{ error: AuthError | null }> => {
    // setIsLoading(true); // Removed
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
    // if (error) setIsLoading(false); // Removed
    return { error };
  };

  const logout = async () => {
    // setIsLoading(true); // Removed - logout should be quick, onAuthStateChange will handle UI update
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('lurmUser');
    // setIsLoading(false); // Removed - onAuthStateChange handles this
  };

  const updateUserMetadata = async (metadata: { name?: string; avatarUrl?: string }): Promise<{ error: AuthError | null }> => {
    if (!user) return { error: { name: "AuthError", message: "User not authenticated" } as AuthError };
    // setIsLoading(true); // Removed
    
    const updateData: { name?: string; avatar_url?: string } = {};
    if (metadata.name) updateData.name = metadata.name;
    if (metadata.avatarUrl) updateData.avatar_url = metadata.avatarUrl;
    
    const { data: updatedAuthUser, error: authUpdateError } = await supabase.auth.updateUser({ data: updateData });

    if (authUpdateError) {
        // setIsLoading(false); // Removed
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
            // Potentially return this error too, or handle it differently
        }
    }

    if (updatedAuthUser?.user) {
      // Re-fetch profile or optimistically update? For now, rely on onAuthStateChange or a manual refresh if needed.
      // For simplicity, let's optimistically update the local user state based on the successful auth update.
      // The onAuthStateChange might eventually bring the isAdmin status if it changes, but that's less direct.
      const updatedAppUser: User = {
        ...user, // Preserve existing fields like isAdmin
        id: updatedAuthUser.user.id,
        email: updatedAuthUser.user.email,
        name: updatedAuthUser.user.user_metadata?.name as string || user.name,
        avatarUrl: updatedAuthUser.user.user_metadata?.avatar_url as string || user.avatarUrl,
      };
      setUser(updatedAppUser);
      localStorage.setItem('lurmUser', JSON.stringify(updatedAppUser));
    }
    // setIsLoading(false); // Removed
    return { error: null };
  };
  
  const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
    if (!user) return { error: { name: "AuthError", message: "User not authenticated" } as AuthError };
    // setIsLoading(true); // Removed
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    // setIsLoading(false); // Removed
    return { error };
  };

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

