/* ------------------------------------------------------------
   Cockpit : affichage de la réponse de GET …/audits/<id>/cockpit/
   ------------------------------------------------------------ */
import { nombre } from "@/lib/format";

/* Secteur de l'API → clé des contenus illustratifs (data/moteurs.js) */
export const SECTEUR_MOTEUR = { BTP: "BTP", SERVICES: "Services", INDUSTRIE: "Industrie" };

export const SOURCES = {
  comptes_annuels: { label: "comptes annuels", tone: "sky" },
  api: { label: "données publiées", tone: "ink" },
  documents: { label: "documents", tone: null },
  questionnaire: { label: "questionnaire", tone: "gold" },
  parametre: { label: "paramètre sectoriel", tone: "ink" }
};

export const STATUTS = {
  manquant: { label: "à compléter", tone: "warn" },
  non_defini: { label: "méthode à définir", tone: "ink" }
};

/* 892500, "€" → « 892 500 € » ; 20, "%" → « 20 % » ; null → « — » */
export function valeurAvecUnite(valeur, unite) {
  if (valeur === null || valeur === undefined) return "—";
  if (typeof valeur !== "number") return String(valeur);
  return nombre(valeur) + (unite ? ` ${unite}` : "");
}

/* Libellés des entrées manquantes d'un indicateur ou d'une composante */
export function libellesManquants(cles, entrees) {
  const parCle = Object.fromEntries((entrees ?? []).map(e => [e.cle, e.label]));
  return (cles ?? []).map(c => parCle[c] ?? c);
}
