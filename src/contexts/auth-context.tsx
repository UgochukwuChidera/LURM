
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface User { 
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
  // updatePassword method removed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const { toast } = useToast();

  useEffect(() => {
    // localStorage access removed here
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          let isAdmin = false;
          // Always fetch profile from DB for is_admin status as localStorage is not used
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', supabaseUser.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { 
            console.error('Error fetching profile for admin status:', profileError.message);
            // Potentially handle this error more gracefully, e.g. default isAdmin to false or show a toast
          } else if (profile) {
            isAdmin = profile.is_admin || false;
          }

          const appUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name as string || supabaseUser.email?.split('@')[0] || 'User',
            avatarUrl: supabaseUser.user_metadata?.avatar_url as string || `https://placehold.co/100x100.png?text=${(supabaseUser.user_metadata?.name as string || supabaseUser.email || 'U').charAt(0).toUpperCase()}`,
            isAdmin: isAdmin,
          };
          setUser(appUser);
          // localStorage.setItem removed
        } else {
          setUser(null);
          // localStorage.removeItem removed
        }
        setIsLoading(false); 
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // No dependencies needed here as onAuthStateChange handles updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); 

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const register = async (email: string, password: string, name: string): Promise<{ error: AuthError | null }> => {
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
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); 
  };

  const updateUserMetadata = async (metadata: { name?: string; avatarUrl?: string }): Promise<{ error: AuthError | null }> => {
    if (!user) return { error: { name: "AuthError", message: "User not authenticated" } as AuthError };
    
    const updateData: { name?: string; avatar_url?: string } = {};
    if (metadata.name) updateData.name = metadata.name;
    if (metadata.avatarUrl) updateData.avatar_url = metadata.avatarUrl;
    
    const { data: updatedAuthUser, error: authUpdateError } = await supabase.auth.updateUser({ data: updateData });

    if (authUpdateError) {
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
            // Consider how to handle this error: perhaps toast it or return it.
            // For now, we'll prioritize the auth update error.
        }
    }

    if (updatedAuthUser?.user) {
      // Optimistically update local user state. onAuthStateChange will eventually sync if there's a discrepancy.
      setUser(prevUser => ({
        ...(prevUser as User), // Cast to User, assuming prevUser is not null if we reached here
        id: updatedAuthUser.user.id,
        email: updatedAuthUser.user.email,
        name: updatedAuthUser.user.user_metadata?.name as string || prevUser?.name,
        avatarUrl: updatedAuthUser.user.user_metadata?.avatar_url as string || prevUser?.avatarUrl,
        // isAdmin status is not changed by this operation, so it remains from prevUser
      }));
    }
    return { error: null };
  };
  
  // updatePassword function removed entirely

  if (isLoading) {
     return <div className="flex h-screen items-center justify-center"><p>Loading application...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUserMetadata }}>
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
