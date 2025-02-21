"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password) // ⚠️ You should hash passwords instead
      .single();

    if (error || !data) throw new Error("Invalid email or password");

    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    router.push("/dashboard");
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase
      .from("users")
      .insert([{ email, password, username }]) // ⚠️ Hash passwords in production
      .select()
      .single();

    if (error) throw error;

    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    router.push("/dashboard");
  }

  useEffect(() => {
    if (user === null) {
      router.push("/");
    }
  }, [user, router]);
  
  async function signOut() {
    setUser(null);
    localStorage.removeItem("user");
  }

  return (
    <AuthContext.Provider value={{ user,setUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
