/* ------------------------------------------------------------
   Rapport PDF d'un audit (Module 4) : plan et petites mises en forme.
   ------------------------------------------------------------ */

/* Plan du PDF généré par le back (companies/services/report_pdf.py), une section par page. */
export const SECTIONS_RAPPORT = [
  ["Couverture", "perte annuelle estimée du moteur de calcul"],
  ["Synthèse exécutive & points clés", "rédaction par le LLM"],
  ["Contexte de l'entreprise", "fiche entreprise + données publiées"],
  ["Méthodologie et limites", "déduites du cockpit"],
  ["Perte annuelle estimée", "moteur de calcul + commentaire rédigé"],
  ["Indicateurs clés", "moteur de calcul + commentaires rédigés"],
  ["Données retenues et contrôles", "cockpit"],
  ["Réponses du dirigeant", "questionnaire adaptatif"],
  ["3 leviers à 30 jours (une page chacun)", "rédaction par le LLM"],
  ["Prochaine étape", "réservation du bilan (Calendly)"]
];

export const PAGES_PREVUES = 12;

export const STATUT_RAPPORT = {
  en_cours: { label: "génération en cours", tone: "warn" },
  ok: { label: "prêt à remettre", tone: "ok" },
  erreur: { label: "dernière génération échouée", tone: "bad" }
};

const deux = n => String(n).padStart(2, "0");

/* « 19/11/2026 à 14:32 » (heure locale) ; null si la date est absente ou illisible. */
export function dateHeure(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return `${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()} à ${deux(d.getHours())}:${deux(d.getMinutes())}`;
}

/* Même nom que celui proposé par le back : audit-alumny-<entreprise>-<AAAA-MM-JJ>.pdf */
export function nomFichierRapport(client, generatedAt) {
  const entreprise = (client || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "entreprise";
  const jour = generatedAt ? generatedAt.slice(0, 10) : "";
  return `audit-alumny-${entreprise}${jour ? "-" + jour : ""}.pdf`;
}
