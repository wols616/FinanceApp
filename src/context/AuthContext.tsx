import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, shouldUseMockData } from '../lib/supabase';
import type { AuthSession } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      if (!isSupabaseConfigured() && !shouldUseMockData()) {
        setError('Authentication service is not configured');
        setIsLoading(false);
        return;
      }

      timeout = setTimeout(() => {
        setIsLoading(false);
        setError('Timeout while initializing authentication');
      }, 10000);

      if (shouldUseMockData()) {
        try {
          const storedUser = localStorage.getItem('currentUser');
          const storedProfile = localStorage.getItem('currentProfile');
          
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          
          if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
          } else if (storedUser) {
            const defaultProfile: Profile = {
              id: '1',
              name: 'Usuario Demo',
              avatar_url: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
              currency: 'MXN',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setProfile(defaultProfile);
            localStorage.setItem('currentProfile', JSON.stringify(defaultProfile));
          }
        } catch (err) {
          setError('Error loading mock data');
          console.error(err);
        } finally {
          clearTimeout(timeout);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          await handleUserSession(session.user);
        }

        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: AuthSession | null) => {
            if (session?.user) {
              await handleUserSession(session.user);
            } else {
              setUser(null);
              setProfile(null);
            }
            setIsLoading(false);
          }
        );

        subscription = authSubscription;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
        console.error(err);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };

    const handleUserSession = async (user: any) => {
      try {
        const userData: User = {
          id: user.id,
          name: user.user_metadata?.name || user.email || 'Usuario',
          email: user.email || '',
          avatar: user.user_metadata?.avatar_url
        };
        setUser(userData);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile(profileData);
        } else {
          const newProfile: Omit<Profile, 'created_at' | 'updated_at'> = {
            id: user.id,
            name: userData.name,
            avatar_url: userData.avatar,
            currency: 'MXN'
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile);

          if (insertError) throw insertError;

          setProfile({
            ...newProfile,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
        console.error(err);
        throw err;
      }
    };

    initializeAuth();

    return () => {
      clearTimeout(timeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    if (shouldUseMockData()) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (email === 'demo@financeapp.com' && password === 'demo123') {
          const user: User = {
            id: '1',
            name: 'Usuario Demo',
            email: email,
            avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
          };
          const profile: Profile = {
            id: '1',
            name: 'Usuario Demo',
            avatar_url: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            currency: 'MXN',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUser(user);
          setProfile(profile);
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('currentProfile', JSON.stringify(profile));
          return true;
        }
        
        setError('Invalid credentials for demo mode');
        return false;
      } finally {
        setIsLoading(false);
      }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (shouldUseMockData()) {
      return { 
        success: false, 
        error: 'Registration not available in demo mode. Please connect to Supabase.' 
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (authError) {
        setError(authError.message);
        return { success: false, error: authError.message };
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          name: name,
          avatar_url: null,
          currency: 'MXN',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        setError(profileError.message);
        return { success: false, error: profileError.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
  
    try {
      if (shouldUseMockData()) {
        // Limpieza para modo demo
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentProfile');
        setUser(null);
        setProfile(null);
        window.location.replace('/login');
        return;
      }
  
      // 1. Eliminar el token específico y cualquier otro token de Supabase
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') && key.includes('auth-token')
      );
      supabaseKeys.forEach(key => localStorage.removeItem(key));
  
      // 5. Forzar recarga de la aplicación
      window.location.replace('/login');
      
      // 6. Detener cualquier carga pendiente
      setIsLoading(false);
      return;
  
    } catch (err) {
      console.error('Error during sign out:', err);
      
      // Forzar recarga incluso si hay error
      window.location.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      if (shouldUseMockData()) {
        if (profile) {
          const updatedProfile = { 
            ...profile, 
            ...profileData, 
            updated_at: new Date().toISOString() 
          };
          setProfile(updatedProfile);
          localStorage.setItem('currentProfile', JSON.stringify(updatedProfile));
        }
        return;
      }

      const updates = {
        ...profileData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      login, 
      signOut, 
      register, 
      updateProfile,
      isLoading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};