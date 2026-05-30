import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { requireSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AuthUser, Profile } from "@/types/user";

type AuthContextValue = {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userFromSupabase(user: User | null): AuthUser | null {
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}

async function fetchAdminProfile(user: User): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return { ...data, role: "admin" };

  const profile = {
    id: user.id,
    full_name: user.email ?? "Admin",
    avatar_url: null,
    role: "admin" as const,
    created_at: user.created_at,
  };
  const { data: createdProfile, error: createError } = await supabase.from("profiles").insert(profile).select("*").single();
  if (createError) throw createError;
  return { ...createdProfile, role: "admin" };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      if (!nextSession?.user) {
        clearAuth();
        return;
      }

      const adminProfile = await fetchAdminProfile(nextSession.user);
      setSession(nextSession);
      setUser(userFromSupabase(nextSession.user));
      setProfile(adminProfile);
    },
    [clearAuth],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        requireSupabaseConfigured();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) await applySession(data.session);
      } catch {
        if (isMounted) clearAuth();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      void applySession(nextSession).catch(() => {
        clearAuth();
        window.setTimeout(() => void supabase.auth.signOut({ scope: "local" }), 0);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession, clearAuth]);

  const signIn = useCallback(async (email: string, password: string) => {
    requireSupabaseConfigured();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await applySession(data.session);
    } catch (error) {
      await supabase.auth.signOut({ scope: "local" });
      clearAuth();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applySession, clearAuth]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, profile, loading, signIn, signOut }),
    [loading, profile, session, signIn, signOut, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
