'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  supabase: SupabaseClient | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        if (mounted) setLoading(false);
        return;
      }

      const client = createClient(supabaseUrl, supabaseAnonKey);
      if (mounted) setSupabase(client);

      const { data: { user } } = await client.auth.getUser();
      if (mounted) {
        if (user) {
          setUser({ id: user.id, email: user.email || '' });
        }
        setLoading(false);
      }

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
          } else {
            setUser(null);
          }
        }
      });

      return () => subscription.unsubscribe();
    };

    const cleanup = initAuth();
    
    return () => {
      mounted = false;
      cleanup.then(fn => fn && fn());
    };
  }, []);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}
