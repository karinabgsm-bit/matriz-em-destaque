import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "./supabase";

export type Role = "editor" | "approver";
export type Profile = { id: string; name: string; email: string | null; role: Role };

type AuthState = {
  loading: boolean;
  userId: string | null;
  profile: Profile | null;
  isEditor: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function loadProfile(uid: string | null) {
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id,name,email,role")
      .eq("id", uid)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      await loadProfile(uid);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      await loadProfile(uid);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUserId(null);
  };

  return (
    <Ctx.Provider
      value={{
        loading,
        userId,
        profile,
        isEditor: profile?.role === "editor",
        signIn,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
