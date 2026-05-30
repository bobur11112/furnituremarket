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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AuthUser, Profile, UserRole } from "@/types/user";

type AuthContextValue = {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: "buyer" | "seller") => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const demoStorageKey = "mobel-demo-auth";

function roleFromMetadata(metadata: Record<string, unknown> | undefined): UserRole {
  const role = metadata?.role;
  if (role === "seller" || role === "admin" || role === "buyer") return role;
  return "buyer";
}

function userFromSupabase(user: User | null): AuthUser | null {
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}

function createDemoProfile(id: string, email: string, fullName?: string, role?: UserRole): Profile {
  const inferredRole: UserRole = role ?? (email.includes("admin") ? "admin" : email.includes("seller") ? "seller" : "buyer");
  return {
    id,
    full_name: fullName ?? (inferredRole === "seller" ? "Demo Seller" : "Demo Buyer"),
    avatar_url: null,
    role: inferredRole,
    created_at: new Date().toISOString(),
  };
}

function readDemoAuth(): { user: AuthUser; profile: Profile } | null {
  const rawValue = window.localStorage.getItem(demoStorageKey);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as { user?: AuthUser; profile?: Profile };
    if (parsed.user?.id && parsed.user.email && parsed.profile?.id) {
      return { user: parsed.user, profile: parsed.profile };
    }
  } catch {
    window.localStorage.removeItem(demoStorageKey);
  }

  return null;
}

async function fetchProfile(user: User): Promise<Profile> {
  if (!isSupabaseConfigured) {
    return createDemoProfile(user.id, user.email ?? "buyer@mobel.test");
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;

  if (data) return data;

  return {
    id: user.id,
    full_name: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null,
    avatar_url: typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    role: roleFromMetadata(user.user_metadata),
    created_at: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!isSupabaseConfigured) {
        const demoAuth = readDemoAuth();
        if (isMounted && demoAuth) {
          setUser(demoAuth.user);
          setProfile(demoAuth.profile);
        }
        if (isMounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (isMounted) setLoading(false);
        return;
      }

      const nextUser = userFromSupabase(data.session?.user ?? null);
      if (isMounted) {
        setSession(data.session);
        setUser(nextUser);
      }

      if (data.session?.user) {
        const nextProfile = await fetchProfile(data.session.user);
        if (isMounted) setProfile(nextProfile);
      }

      if (isMounted) setLoading(false);
    }

    void loadSession();

    if (!isSupabaseConfigured) {
      return () => {
        isMounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(userFromSupabase(nextSession?.user ?? null));
      if (nextSession?.user) {
        void fetchProfile(nextSession.user).then(setProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      const demoUser = { id: email.includes("seller") ? "demo-seller" : "demo-buyer", email };
      const demoProfile = createDemoProfile(demoUser.id, email);
      window.localStorage.setItem(demoStorageKey, JSON.stringify({ user: demoUser, profile: demoProfile }));
      setUser(demoUser);
      setProfile(demoProfile);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    setSession(data.session);
    setUser(userFromSupabase(data.user));
    if (data.user) setProfile(await fetchProfile(data.user));
    setLoading(false);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, role: "buyer" | "seller") => {
      setLoading(true);

      if (!isSupabaseConfigured) {
        const demoUser = { id: role === "seller" ? "demo-seller" : "demo-buyer", email };
        const demoProfile = createDemoProfile(demoUser.id, email, fullName, role);
        window.localStorage.setItem(demoStorageKey, JSON.stringify({ user: demoUser, profile: demoProfile }));
        setUser(demoUser);
        setProfile(demoProfile);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });
      if (error) {
        setLoading(false);
        throw error;
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          role,
        });
        setUser(userFromSupabase(data.user));
        setProfile(await fetchProfile(data.user));
      }
      setSession(data.session);
      setLoading(false);
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setLoading(false);
        throw error;
      }
    } else {
      window.localStorage.removeItem(demoStorageKey);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, profile, loading, signIn, signUp, signInWithGoogle, signOut }),
    [loading, profile, session, signIn, signInWithGoogle, signOut, signUp, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
