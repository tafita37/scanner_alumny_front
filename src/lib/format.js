/* ============================================================
   Alumny — Formatage
   Le groupage des milliers est fait à la main (et non via
   toLocaleString) pour garantir un rendu identique côté serveur
   et côté navigateur : pas de décalage d'hydratation.
   ============================================================ */

const ESPACE = " "; // espace insécable

export function groupe(n) {
  const neg = n < 0;
  const entier = Math.abs(Math.round(n)).toString();
  const out = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE);
  return (neg ? "−" + ESPACE : "") + out;
}

export const fmtEur = n => (n === null || n === undefined) ? "—" : groupe(n) + ESPACE + "€";

/* Initiales d'une raison sociale : « Bâti Duran SARL » → « BD » */
export const initiales = nom =>
  nom.split(/[\s&]+/).filter(Boolean).slice(0, 2).map(m => m[0]).join("").toUpperCase();

/* Heure courante au format fr-FR, appelée uniquement dans des gestionnaires
   d'événements (jamais pendant le rendu) — donc sans risque d'hydratation. */
export function heureCourante(avecSecondes = true) {
  const d = new Date();
  const p = v => String(v).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}` + (avecSecondes ? `:${p(d.getSeconds())}` : "");
}

/* Dirigeant renvoyé par l'annuaire des entreprises : « PAUL VERDIN », ou null */
export const nomDirigeant = entreprise =>
  [entreprise?.ceo_first_name, entreprise?.ceo_name].filter(Boolean).join(" ") || null;

/* « 1 234 € », « − 5 000 » → nombre ; null si vide, NaN si illisible */
export function enNombre(valeur) {
  const s = String(valeur ?? "").replace(/[\s €]/g, "").replace(/−/g, "-").replace(",", ".");
  return s === "" ? null : Number(s);
}
