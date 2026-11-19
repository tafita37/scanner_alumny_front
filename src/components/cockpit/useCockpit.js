"use client";

import { useCallback, useEffect, useState } from "react";
import { getCockpit } from "@/lib/api";

/* Listes absentes de la réponse → vides, pour que l'affichage ne casse pas sur une réponse partielle. */
const normaliser = c => ({
  ...c,
  entrees: c?.entrees ?? [],
  indicateurs: c?.indicateurs ?? [],
  etapes_calcul: c?.etapes_calcul ?? [],
  perte_annuelle: c?.perte_annuelle ?? null,
  score_sante: c?.score_sante ?? null,
  controles: c?.controles ?? []
});

/* Résultats du moteur de calcul d'un audit (GET …/cockpit/), relus à la demande. */
export function useCockpit(auditId) {
  const [etat, setEtat] = useState({ encours: true, erreur: null, cockpit: null });
  const [tentative, setTentative] = useState(0);

  useEffect(() => {
    if (!auditId) return;
    const ctrl = new AbortController();
    setEtat(e => ({ ...e, encours: true, erreur: null }));
    getCockpit(auditId, { signal: ctrl.signal })
      .then(cockpit => setEtat({ encours: false, erreur: null, cockpit: normaliser(cockpit) }))
      .catch(e => {
        if (e.name === "AbortError") return;
        setEtat({ encours: false, erreur: e.message, cockpit: null });
      });
    return () => ctrl.abort();
  }, [auditId, tentative]);

  const recharger = useCallback(() => setTentative(t => t + 1), []);

  return { ...etat, recharger };
}
