/* ------------------------------------------------------------
   Parcours d'un dossier d'audit : les 4 étapes enchaînées
   depuis la page du dossier (/audits/<ref>).
   ------------------------------------------------------------ */

export const ETAPES_AUDIT = [
  { n: 1, label: "Onboarding" },
  { n: 2, label: "Analyse documentaire" },
  { n: 3, label: "Cockpit & résultats" },
  { n: 4, label: "Rapport" }
];

/* Statuts d'un dossier dont l'audit est terminé : il sort du filtre « En cours » de la liste des audits. */
const STATUTS_TERMINES = ["rapport généré", "archivé"];

export const estEnCours = dossier => !STATUTS_TERMINES.includes(dossier.statut);

export const libelleEtape = n => ETAPES_AUDIT.find(e => e.n === n)?.label ?? "";

/* Lien vers un dossier, ouvert sur une étape donnée (par défaut : la plus avancée atteinte). */
export const lienDossier = (ref, etape) =>
  `/audits/${encodeURIComponent(ref)}` + (etape ? `?etape=${etape}` : "");

/* Date du jour au format jj/mm/aaaa — à n'appeler que dans un gestionnaire d'événement. */
export function dateDuJour() {
  const d = new Date();
  const p = v => String(v).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
