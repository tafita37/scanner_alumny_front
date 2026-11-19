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

/* Entrée manquante que seul un document peut fournir (l'agent ne peut pas la demander au dirigeant) */
export const aFournirParDocument = e => e.statut === "manquant" && e.demandable === false;

/* Statut affiché d'une entrée, null si elle est renseignée */
export const statutEntree = e => (aFournirParDocument(e) ? { label: "document à fournir", tone: "warn" } : STATUTS[e.statut] ?? null);

/* Colonnes connues du détail `lignes` d'une entrée (marges par produit) ; les autres clés sont affichées telles quelles */
export const COLONNES_LIGNES = {
  produit: { label: "Produit" },
  reference: { label: "Réf." },
  prix_unitaire_ht: { label: "Prix unitaire HT", unite: "€", num: true },
  couts_variables_unitaires: { label: "Coûts variables unitaires", unite: "€", num: true },
  marge_unitaire: { label: "Marge unitaire", unite: "€", num: true },
  taux_marge: { label: "Taux de marge", unite: "%", num: true },
  quantite: { label: "Quantité", num: true },
  marge_totale: { label: "Marge totale", unite: "€", num: true }
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
