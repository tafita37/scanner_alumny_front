/* ------------------------------------------------------------
   Questionnaire adaptatif : conversion des réponses entre le
   formulaire (texte saisi) et l'API (valeur typée), et affichage.
   ------------------------------------------------------------ */
import { enNombre, nombre } from "@/lib/format";

export const STATUT_QUESTION = {
  en_attente: { label: "en attente", tone: "warn" },
  repondue: { label: "répondue", tone: "ok" },
  ignoree: { label: "ignorée", tone: "ink" }
};

export const TYPES_NUMERIQUES = ["montant", "pourcentage", "nombre"];

export const MAX_TEXTE = 5000;

/* Unité affichée à côté d'une valeur numérique : celle de la question, sinon celle du type. */
export function uniteQuestion(q) {
  if (q.unit) return q.unit;
  if (q.answer_type === "montant") return "€";
  if (q.answer_type === "pourcentage") return "%";
  return null;
}

/* Valeur de l'API → texte lisible (réponse ou proposition de l'agent). */
export function formaterReponse(q, valeur) {
  if (valeur === null || valeur === undefined) return "—";
  switch (q.answer_type) {
    case "oui_non":
      return valeur ? "Oui" : "Non";
    case "date":
      return typeof valeur === "string" ? valeur.split("-").reverse().join("/") : String(valeur);
    case "montant":
    case "pourcentage":
    case "nombre": {
      if (typeof valeur !== "number") return String(valeur);
      const unite = uniteQuestion(q);
      return nombre(valeur) + (unite ? ` ${unite}` : "");
    }
    default:
      return String(valeur);
  }
}

/* Valeur de l'API → contenu initial du champ de saisie. */
export function versSaisie(q, valeur) {
  if (valeur === null || valeur === undefined) return "";
  if (TYPES_NUMERIQUES.includes(q.answer_type) && typeof valeur === "number") {
    return String(valeur).replace(".", ",");
  }
  return valeur;
}

/* Contenu du champ de saisie → { valeur } à envoyer, ou { erreur } (même contrôles que le back). */
export function depuisSaisie(q, saisie) {
  switch (q.answer_type) {
    case "montant":
    case "pourcentage":
    case "nombre": {
      const n = enNombre(saisie);
      if (n === null) return { erreur: "Réponse obligatoire." };
      if (!Number.isFinite(n)) return { erreur: "Un nombre est attendu (ex. 340 000,50)." };
      return { valeur: n };
    }
    case "date":
      if (!saisie) return { erreur: "Réponse obligatoire." };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(saisie)) return { erreur: "Une date au format JJ/MM/AAAA est attendue." };
      return { valeur: saisie };
    case "oui_non":
      if (typeof saisie !== "boolean") return { erreur: "Choisissez oui ou non." };
      return { valeur: saisie };
    case "choix":
      if (!(q.choices ?? []).includes(saisie)) return { erreur: "Choisissez une des options." };
      return { valeur: saisie };
    default: {
      const texte = typeof saisie === "string" ? saisie.trim() : "";
      if (!texte) return { erreur: "Réponse obligatoire." };
      if (texte.length > MAX_TEXTE) return { erreur: `${MAX_TEXTE} caractères au maximum.` };
      return { valeur: texte };
    }
  }
}

/* La proposition de l'agent existe (false est une proposition valable pour oui_non). */
export const aProposition = q => q.suggested_answer !== null && q.suggested_answer !== undefined;

/* Décompte des questions d'un tour par statut. */
export function decompte(questions) {
  const c = { en_attente: 0, repondue: 0, ignoree: 0 };
  questions.forEach(q => { c[q.status] = (c[q.status] ?? 0) + 1; });
  return c;
}

/* Libellé lisible d'un appel de tool de l'agent. */
const TOOLS = {
  rechercher_dans_documents: "Recherche dans les documents",
  lire_pages_document: "Lecture de pages",
  calculer: "Calcul"
};

export function libelleTool(appel) {
  return TOOLS[appel.tool] ?? appel.tool;
}

/* Arguments d'un appel de tool résumés sur une ligne. */
export function resumeArguments(args) {
  if (!args || typeof args !== "object") return "";
  return Object.entries(args).map(([k, v]) => {
    if (Array.isArray(v) && v.every(x => typeof x !== "object")) return `${k} : ${v.join(", ")}`;
    return `${k} : ${typeof v === "object" ? JSON.stringify(v) : v}`;
  }).join(" · ");
}
