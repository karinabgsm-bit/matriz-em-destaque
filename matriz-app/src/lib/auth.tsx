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

  // IMPORTANTE: nao fazer chamadas ao banco DENTRO do onAuthStateChange
  // (isso causa deadlock no supabase-js). Aqui so guardamos o userId.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // O perfil e carregado num efeito separado, reagindo ao userId.
  useEffect(() => {
    let active = true;
    if (userId == null) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("id,name,email,role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile((data as Profile) ?? null);
      });
    return () => {
      active = false;
    };
  }, [userId]);

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
