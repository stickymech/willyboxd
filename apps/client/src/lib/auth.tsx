import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, API_ENDPOINTS } from "./api";
import type { User } from "@willyboxd/shared";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<{ user: User | null }>(API_ENDPOINTS.auth.me).then((res) => res.user),
    staleTime: 5 * 60 * 1000,
  });

  const login = async (identifier: string, password: string) => {
    await apiFetch(API_ENDPOINTS.auth.login, {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  const register = async (email: string, username: string, password: string) => {
    await apiFetch(API_ENDPOINTS.auth.register, {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  const logout = async () => {
    await apiFetch(API_ENDPOINTS.auth.logout, { method: "POST" });
    queryClient.setQueryData(["auth", "me"], null);
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
