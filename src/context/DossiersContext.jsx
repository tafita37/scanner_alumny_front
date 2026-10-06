"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { listerAudits } from "@/lib/api";
import { dateDuJour, dossierDepuisApi } from "@/lib/dossiers";

const DossiersContext = createContext(null);

/* Les audits viennent de GET /api/companies/audits/.
   Le backend ne permet pas encore de faire avancer un audit (remaining_step) : l'avancement fait
   dans l'outil est gardé dans le navigateur et appliqué par-dessus la réponse de l'API. */
const CLE_STOCKAGE = "alumny.dossiers.avancement";

function lireAvancement() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_STOCKAGE));
    if (brut && typeof brut === "object" && !Array.isArray(brut)) return brut;
  } catch { /* stockage indisponible ou illisible */ }
  return {};
}

export function DossiersProvider({ children }) {
  const { token } = useUser();
  const [audits, setAudits] = useState([]);
  const [avancement, setAvancement] = useState({});
  /* charge : une première réponse (ou erreur) est arrivée pour la session courante */
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [avancementLu, setAvancementLu] = useState(false);
  /* Numéro du dernier chargement : une réponse dépassée est ignorée. */
  const dernier = useRef(0);

  /* Lecture du stockage après le premier rendu : pas de décalage d'hydratation. */
  useEffect(() => {
    setAvancement(lireAvancement());
    setAvancementLu(true);
  }, []);

  useEffect(() => {
    if (!avancementLu) return;
    try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(avancement)); } catch { /* stockage indisponible */ }
  }, [avancement, avancementLu]);

  const recharger = useCallback(async () => {
    const id = ++dernier.current;
    try {
      const liste = await listerAudits();
      if (id !== dernier.current) return;
      setAudits(Array.isArray(liste) ? liste : []);
      setErreur(null);
    } catch (err) {
      if (id !== dernier.current) return;
      setErreur(err.message);
    } finally {
      if (id === dernier.current) setCharge(true);
    }
  }, []);

  /* Chargement à l'ouverture de session ; tout est vidé à la déconnexion. */
  useEffect(() => {
    if (token) {
      recharger();
      return;
    }
    dernier.current++;
    setAudits([]);
    setErreur(null);
    setCharge(false);
  }, [token, recharger]);

  const dossiers = useMemo(() => audits.map(a => {
    const d = dossierDepuisApi(a);
    const local = avancement[d.ref];
    if (!local) return d;
    return { ...d, ...local, etape: Math.max(d.etape, local.etape ?? 0) };
  }), [audits, avancement]);

  /* Fait avancer un dossier (étape atteinte, statut…) et date sa mise à jour. */
  const majDossier = useCallback((ref, patch) => {
    setAvancement(a => ({ ...a, [ref]: { ...a[ref], ...patch, maj: dateDuJour() } }));
  }, []);

  const valeur = useMemo(
    () => ({ dossiers, charge, erreur, recharger, majDossier }),
    [dossiers, charge, erreur, recharger, majDossier]
  );

  return <DossiersContext.Provider value={valeur}>{children}</DossiersContext.Provider>;
}

export function useDossiers() {
  const ctx = useContext(DossiersContext);
  if (!ctx) throw new Error("useDossiers doit être utilisé dans <DossiersProvider>");
  return ctx;
}
