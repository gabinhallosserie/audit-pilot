import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "audite" | "auditeur";

export interface User {
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  avatar: string;
}

const USERS: Record<string, User> = {
  "marie.dupont@audit.io": {
    email: "marie.dupont@audit.io",
    name: "Marie Dupont",
    role: "audite",
    company: "Écovert Industries",
    avatar: "MD",
  },
  "jean.martin@audit.io": {
    email: "jean.martin@audit.io",
    name: "Jean Martin",
    role: "auditeur",
    company: "Consultant ISO indépendant",
    avatar: "JM",
  },
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, _password: string) => {
    const found = USERS[email.toLowerCase()];
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
