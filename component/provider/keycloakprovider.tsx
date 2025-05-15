"use client";

import { createContext, useContext, useEffect, useState } from "react";
import keycloak from "../../keycloak/client/client";

interface AuthContextType {
  token: string | null;
  authenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  authenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    keycloak.init({ onLoad: "login-required" }).then((auth) => {
      if (auth) {
        setToken(keycloak.token!);
        setAuthenticated(true);
        localStorage.setItem("kc-token", keycloak.token!);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ token, authenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
