"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UTILISATEUR_DEFAUT } from "@/data/al";
import {
  abonner, enregistrerSession, getSession, initSession,
  profilDepuisApi, sessionDepuisApi, viderSession
} from "@/lib/session";

const UserContext = createContext(null);

/* La session elle-même vit dans lib/session.js (partagée avec lib/api.js,
   qui la rafraîchit automatiquement) ; ce contexte n'en est que le reflet
   React pour que l'interface se mette à jour. */
export function UserProvider({ children }) {
  /* On part toujours d'une session vide pour que le HTML serveur et le
     premier rendu client soient identiques ; la session mémorisée est relue
     juste après le montage. */
  const [session, setSession] = useState(null);
  /* `pret` passe à true une fois le stockage relu : avant, on ne sait pas
     encore si l'utilisateur est connecté (les gardes doivent attendre). */
  const [pret, setPret] = useState(false);
  /* Motif de la dernière fin de session : "volontaire" | "expiree" | null */
  const [finSession, setFinSession] = useState(null);

  useEffect(() => {
    initSession();
    setSession(getSession());
    setPret(true);
    return abonner((s, motif) => {
      setSession(s);
      if (motif) setFinSession(motif);
      else if (s) setFinSession(null);
    });
  }, []);

  /* Enregistre la réponse de /api/auth/login/.
     « Rester connecté » → localStorage (survit à la fermeture du navigateur),
     sinon sessionStorage (effacé à la fermeture de l'onglet). */
  const ouvrirSession = useCallback((reponse, resterConnecte = true) => {
    enregistrerSession(sessionDepuisApi(reponse, resterConnecte));
  }, []);

  const fermerSession = useCallback((motif = "volontaire") => {
    viderSession(motif);
  }, []);

  /* Met à jour le profil (ex. après GET /api/auth/me/) sans toucher au token */
  const majProfil = useCallback(u => {
    const s = getSession();
    if (s) enregistrerSession({ ...s, user: profilDepuisApi(u) });
  }, []);

  /* Déconnexion automatique à l'échéance du token (un refresh repousse l'échéance) */
  useEffect(() => {
    if (!session?.expiresAt) return;
    const reste = new Date(session.expiresAt).getTime() - Date.now();
    if (reste <= 0) { fermerSession("expiree"); return; }
    /* setTimeout est plafonné à ~24,8 jours */
    const id = setTimeout(() => fermerSession("expiree"), Math.min(reste, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [session?.expiresAt, fermerSession]);

  const valeur = useMemo(() => {
    const user = session?.user ?? UTILISATEUR_DEFAUT;
    return {
      user,
      estAdmin: user.role === "Admin",
      token: session?.token ?? null,
      expiresAt: session?.expiresAt ?? null,
      estConnecte: Boolean(session?.token),
      pret,
      finSession,
      ouvrirSession,
      fermerSession,
      majProfil
    };
  }, [session, pret, finSession, ouvrirSession, fermerSession, majProfil]);

  return <UserContext.Provider value={valeur}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser doit être utilisé dans <UserProvider>");
  return ctx;
}
