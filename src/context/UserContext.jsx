"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UTILISATEUR_DEFAUT } from "@/data/al";

const UserContext = createContext(null);

const CLE = "alumny_user";

export function UserProvider({ children }) {
  /* On part toujours du profil par défaut pour que le HTML serveur et le
     premier rendu client soient identiques ; le profil mémorisé est relu
     juste après le montage. */
  const [user, setUserState] = useState(UTILISATEUR_DEFAUT);

  useEffect(() => {
    try {
      const sauve = JSON.parse(window.localStorage.getItem(CLE) || "null");
      if (sauve && sauve.nom) setUserState(sauve);
    } catch {
      /* profil par défaut */
    }
  }, []);

  const setUser = useCallback(u => {
    setUserState(u);
    try { window.localStorage.setItem(CLE, JSON.stringify(u)); } catch { /* stockage indisponible */ }
  }, []);

  const valeur = useMemo(() => ({
    user,
    setUser,
    estAdmin: user.role === "Admin"
  }), [user, setUser]);

  return <UserContext.Provider value={valeur}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser doit être utilisé dans <UserProvider>");
  return ctx;
}
