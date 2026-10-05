"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DOSSIERS } from "@/data/al";
import { dateDuJour } from "@/lib/dossiers";

const DossiersContext = createContext(null);

/* Le backend ne liste pas encore les audits : la liste part des dossiers de démonstration (al.js),
   complétée par les dossiers créés dans l'onboarding et l'avancement fait dans l'outil.
   Seuls ces ajouts et modifications sont conservés dans le navigateur. */
const CLE_STOCKAGE = "alumny.dossiers";
const ETAT_VIDE = { crees: [], patchs: {} };

function lireStockage() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_STOCKAGE));
    if (brut && Array.isArray(brut.crees) && brut.patchs && typeof brut.patchs === "object") return brut;
  } catch { /* stockage indisponible ou illisible */ }
  return ETAT_VIDE;
}

export function DossiersProvider({ children }) {
  const [etat, setEtat] = useState(ETAT_VIDE);
  /* Lecture du stockage après le premier rendu : pas de décalage d'hydratation. */
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    setEtat(lireStockage());
    setCharge(true);
  }, []);

  useEffect(() => {
    if (!charge) return;
    try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat)); } catch { /* stockage indisponible */ }
  }, [etat, charge]);

  const dossiers = useMemo(
    () => [...etat.crees, ...DOSSIERS].map(d => ({ ...d, ...etat.patchs[d.ref] })),
    [etat]
  );

  const ajouterDossier = useCallback(dossier => {
    setEtat(e => ({ ...e, crees: [dossier, ...e.crees.filter(d => d.ref !== dossier.ref)] }));
  }, []);

  /* Modifie un dossier (étape atteinte, statut…) et date sa mise à jour. */
  const majDossier = useCallback((ref, patch) => {
    setEtat(e => ({
      ...e,
      patchs: { ...e.patchs, [ref]: { ...e.patchs[ref], ...patch, maj: dateDuJour() } }
    }));
  }, []);

  const valeur = useMemo(
    () => ({ dossiers, charge, ajouterDossier, majDossier }),
    [dossiers, charge, ajouterDossier, majDossier]
  );

  return <DossiersContext.Provider value={valeur}>{children}</DossiersContext.Provider>;
}

export function useDossiers() {
  const ctx = useContext(DossiersContext);
  if (!ctx) throw new Error("useDossiers doit être utilisé dans <DossiersProvider>");
  return ctx;
}
