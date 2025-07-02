import { createContext, useState, useContext } from "react";



interface AuthContextType {
  accessToken: string | null;
  login: (token: string) => void;
  logout: () => void;
}

// Provide a default value matching the interface
const defaultAuthContext: AuthContextType = {
  accessToken: null,
  login: () => {},
  logout: () => {},
};


export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }:any) {
  const [accessToken, setAccessToken] = useState(null);

  function login(token:any) {
    setAccessToken(token);
  }

  function logout() {
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
