"use client";

import { useCallback, useEffect, useState } from "react";
import { getCockpit } from "@/lib/api";
import { COCKPIT_EXEMPLE } from "@/data/cockpitExemple";

/* Route inconnue du back : Django répond 404 en HTML, donc sans corps JSON
   (un audit introuvable renvoie, lui, un JSON { detail }). */
const routeAbsente = e => e.status === 404 && e.data === null;

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

/* Résultats du moteur de calcul d'un audit (GET …/cockpit/), relus à la demande.
   exemple : la route n'existe pas encore côté back → réponse d'exemple, en développement seulement. */
export function useCockpit(auditId) {
  const [etat, setEtat] = useState({ encours: true, erreur: null, cockpit: null, exemple: false });
  const [tentative, setTentative] = useState(0);

  useEffect(() => {
    if (!auditId) return;
    const ctrl = new AbortController();
    setEtat(e => ({ ...e, encours: true, erreur: null }));
    getCockpit(auditId, { signal: ctrl.signal })
      .then(cockpit => setEtat({ encours: false, erreur: null, cockpit: normaliser(cockpit), exemple: false }))
      .catch(e => {
        if (e.name === "AbortError") return;
        if (routeAbsente(e) && process.env.NODE_ENV === "development") {
          setEtat({ encours: false, erreur: null, cockpit: COCKPIT_EXEMPLE, exemple: true });
          return;
        }
        setEtat({
          encours: false,
          erreur: routeAbsente(e) ? "Le moteur de calcul n'est pas encore disponible sur le serveur." : e.message,
          cockpit: null,
          exemple: false
        });
      });
    return () => ctrl.abort();
  }, [auditId, tentative]);

  const recharger = useCallback(() => setTentative(t => t + 1), []);

  return { ...etat, recharger };
}
