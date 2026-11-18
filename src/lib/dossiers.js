/* ------------------------------------------------------------
   Parcours d'un dossier d'audit : les 5 étapes enchaînées
   depuis la page du dossier (/audits/<ref>).
   ------------------------------------------------------------ */

export const ETAPES_AUDIT = [
  { n: 1, label: "Onboarding" },
  { n: 2, label: "Analyse documentaire" },
  { n: 3, label: "Questions de l'agent" },
  { n: 4, label: "Cockpit & résultats" },
  { n: 5, label: "Rapport" }
];

/* Statuts d'un dossier dont l'audit est terminé : il sort du filtre « En cours » de la liste des audits. */
const STATUTS_TERMINES = ["rapport généré", "archivé"];

export const estEnCours = dossier => !STATUTS_TERMINES.includes(dossier.statut);

export const libelleEtape = n => ETAPES_AUDIT.find(e => e.n === n)?.label ?? "";

/* Lien vers un dossier, ouvert sur une étape donnée (par défaut : la plus avancée atteinte). */
export const lienDossier = (ref, etape) =>
  `/audits/${encodeURIComponent(ref)}` + (etape ? `?etape=${etape}` : "");

/* Référence affichée d'un audit (et clé de son URL) */
export const refAudit = id => `A-${id}`;

/* « 2026-10-05 » → « 05/10/2026 » */
const dateFr = iso => (iso ? iso.split("-").reverse().join("/") : null);

/* Statut affiché, déduit de l'étape atteinte */
const STATUT_PAR_ETAPE = {
  1: "brouillon", 2: "documents en attente", 3: "en cours d'analyse", 4: "analysé", 5: "analysé"
};

/* Audit renvoyé par GET /api/companies/audits/ → dossier affiché par l'interface.
   remaining_step : étapes restant à faire (4 à la création, l'onboarding étant fait ; 0 = audit terminé),
   d'où l'étape en cours = 6 − remaining_step. */
export function dossierDepuisApi(a) {
  const c = a.company ?? {};
  const ceo = c.ceo_info;
  const termine = a.remaining_step <= 0;
  const etape = termine ? ETAPES_AUDIT.length : Math.max(1, ETAPES_AUDIT.length + 1 - a.remaining_step);
  return {
    id: a.id,
    ref: refAudit(a.id),
    etape,
    statut: termine ? "rapport généré" : STATUT_PAR_ETAPE[etape],
    client: c.company_name,
    siren: c.siren_number,
    siret: a.siret_number,
    secteur: c.industry?.name ?? null,
    naf: c.naf_code,
    ville: c.city ? `${c.city.name} (${c.city.department_code})` : null,
    formeJuridique: c.company_type?.label ?? null,
    contact: ceo
      ? [[ceo.individual?.first_name, ceo.individual?.name].filter(Boolean).join(" "), ceo.job_title]
        .filter(Boolean).join(" · ") || null
      : null,
    contactMail: ceo?.email ?? null,
    contactTel: ceo?.phone_number ?? null,
    effectif: a.head_count,
    ca: a.revenue,
    benefices: a.profit,
    annee: a.publication_year,
    maj: dateFr(a.audit_date),
    consultant: null,
    score: null,
    fuite: null
  };
}

/* Date du jour au format jj/mm/aaaa — à n'appeler que dans un gestionnaire d'événement. */
export function dateDuJour() {
  const d = new Date();
  const p = v => String(v).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
