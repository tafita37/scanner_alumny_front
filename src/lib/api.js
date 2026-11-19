/* ------------------------------------------------------------
   Accès à l'API backend.
   L'URL de base vient de NEXT_PUBLIC_API_URL (.env.local) ; à défaut
   on vise le serveur Django local. Il suffira de changer la variable
   au moment de l'hébergement.
   ------------------------------------------------------------ */
import {
  enregistrerSession, estExpiree, getSession, sessionDepuisApi, synchroniserDepuisStockage, viderSession
} from "@/lib/session";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

/* Erreur portant un message déjà lisible par l'utilisateur */
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/* Extrait un message d'erreur des formats usuels de Django REST Framework :
   { detail }, { non_field_errors: [...] }, { email: [...] }, { error }… */
const MESSAGE_INATTENDU = "Une erreur inattendue est survenue.";

function messageErreur(data, status) {
  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
    for (const v of Object.values(data)) {
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
      if (typeof v === "string") return v;
    }
    /* Erreurs imbriquées d'un serializer composé : { company: { city: [...] } } */
    for (const v of Object.values(data)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const m = messageErreur(v, 0);
        if (m !== MESSAGE_INATTENDU) return m;
      }
    }
  }
  if (status === 400 || status === 401) return "E-mail ou mot de passe incorrect.";
  if (status === 403) return "Accès refusé.";
  if (status >= 500) return "Le serveur a rencontré une erreur. Réessayez dans un instant.";
  return MESSAGE_INATTENDU;
}

/* Requête HTTP brute, sans aucune gestion de session.
   format : "json" (défaut) ou "blob" (fichier : le corps d'une réponse réussie est renvoyé en Blob,
   une erreur reste lue en JSON). */
async function requete(chemin, { method = "GET", body, token, headers = {}, signal, format = "json" } = {}) {
  /* FormData (upload de fichiers) : envoyé tel quel, le navigateur pose lui-même
     le Content-Type multipart avec sa frontière. */
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;
  let reponse;
  try {
    reponse = await fetch(API_URL + chemin, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !multipart ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body)
    });
  } catch(error) {
    if (error.name === "AbortError") throw error;
    console.log("Erreur de connexion à l'API :", error);
    throw new ApiError("Impossible de joindre le serveur. Vérifiez votre connexion.");
  }

  if (format === "blob" && reponse.ok) return reponse.blob();
  const data = await reponse.json().catch(() => null);
  if (!reponse.ok) throw new ApiError(messageErreur(data, reponse.status), reponse.status, data);
  return data;
}

/* ------------------------------------------------------------
   Gestion automatique du token
   ------------------------------------------------------------ */

/* En dessous de ce délai avant expiration, le token est rafraîchi avant l'appel */
const SEUIL_REFRESH_MS = 60 * 60 * 1000;

/* Refresh en cours dans cet onglet : les appels simultanés l'attendent
   au lieu d'en lancer chacun un (le backend invalide l'ancien token). */
let refreshEnCours = null;

const attendre = ms => new Promise(r => setTimeout(r, ms));

/* Verrou partagé par tous les onglets du navigateur (Web Locks API) :
   un seul onglet rafraîchit à la fois. */
function sousVerrou(fn) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("alumny-token-refresh", fn);
  }
  return fn();
}

/* POST /api/auth/token/refresh/ → même format que le login ; l'ancien token est supprimé */
function rafraichirToken(tokenActuel) {
  if (!refreshEnCours) {
    refreshEnCours = sousVerrou(async () => {
      /* Pendant l'attente du verrou, un autre onglet a pu rafraîchir : on laisse
         arriver son message (BroadcastChannel) et on relit le stockage. */
      await attendre(50);
      synchroniserDepuisStockage();
      const session = getSession();
      if (!session) return null;
      if (session.token !== tokenActuel) return session.token;

      try {
        const reponse = await requete("/api/auth/token/refresh/", { method: "POST", token: tokenActuel });
        enregistrerSession(sessionDepuisApi(reponse, session.persistante));
        return reponse.token;
      } catch (err) {
        if (err.status !== 401) throw err;
        /* Le token a pu être remplacé par un autre onglet dont le message
           n'est pas encore arrivé : on lui laisse un court instant. */
        await attendre(300);
        const apres = getSession();
        if (apres && apres.token !== tokenActuel) return apres.token;
        viderSession("expiree");
        return null;
      }
    }).finally(() => { refreshEnCours = null; });
  }
  return refreshEnCours;
}

/* Token à utiliser pour un appel, rafraîchi s'il expire dans moins d'1 h */
async function tokenPourAppel(rafraichir) {
  const session = getSession();
  if (!session) return null;
  if (estExpiree(session)) {
    viderSession("expiree");
    return null;
  }

  const reste = new Date(session.expiresAt).getTime() - Date.now();
  if (!rafraichir || !session.expiresAt || reste >= SEUIL_REFRESH_MS) return session.token;

  try {
    return await rafraichirToken(session.token);
  } catch {
    /* Serveur injoignable : le token actuel est encore valide, on le garde */
    return session.token;
  }
}

/* Appel d'API.
   Options en plus de { method, body, headers } :
   - auth       : false pour un appel public (login) — défaut true
   - rafraichir : false pour ne pas rafraîchir avant l'appel (logout) — défaut true
   - sur401     : "expirer" ferme la session sur un 401, "ignorer" non — défaut "expirer" */
export async function apiFetch(chemin, { auth = true, rafraichir = true, sur401 = "expirer", ...options } = {}, rejoue = false) {
  if (!auth) return requete(chemin, options);

  const token = await tokenPourAppel(rafraichir);
  if (!token) throw new ApiError("Votre session a expiré. Merci de vous reconnecter.", 401);

  try {
    return await requete(chemin, { ...options, token });
  } catch (err) {
    if (err.status !== 401) throw err;
    /* Token remplacé entre-temps (refresh d'un autre onglet) → un seul nouvel essai */
    const session = getSession();
    if (!rejoue && session && session.token !== token) {
      return apiFetch(chemin, { auth, rafraichir, sur401, ...options }, true);
    }
    if (sur401 === "expirer") viderSession("expiree");
    throw err;
  }
}

/* POST /api/auth/login/ → { token, expires_at, user: { id, email, first_name, last_name, is_staff } } */
export function login(email, password) {
  return apiFetch("/api/auth/login/", { method: "POST", body: { email, password }, auth: false });
}

/* POST /api/auth/logout/ → supprime le token côté serveur */
export function logout() {
  return apiFetch("/api/auth/logout/", { method: "POST", rafraichir: false, sur401: "ignorer" });
}

/* GET /api/auth/me/ → profil de l'utilisateur connecté (sert aussi à vérifier le token) */
export function getProfile() {
  return apiFetch("/api/auth/me/");
}

/* GET /api/companies/search/?siret=… → jusqu'à 5 entreprises dont le SIREN commence par la saisie :
   [{ id, siren_number, company_name, naf_code, creation_date, city_name, city_code_insee,
      department_code, company_type_label, ceo_name, ceo_first_name, ceo_job_title }] */
export function rechercherEntreprises(siret) {
  return apiFetch("/api/companies/search/?siret=" + encodeURIComponent(siret));
}

/* GET /api/companies/audits_informations/<siret>/ → derniers comptes publiés, ou null :
   { id, siret_number, head_count, profit, revenue, publication_year } */
export function getInfosAudit(siret) {
  return apiFetch("/api/companies/audits_informations/" + encodeURIComponent(siret) + "/");
}

/* GET /api/companies/industries/ → [{ id, name, description }] */
export function getSecteurs() {
  return apiFetch("/api/companies/industries/");
}

/* GET /api/companies/audits/ → tous les audits, du plus récent au plus ancien :
   [{ id, siret_number, head_count, revenue, profit, publication_year, audit_date, remaining_step,
      company: { id, siren_number, company_name, naf_code, creation_date,
                 industry: { id, name }, city: { id, name, code_insee, department_code },
                 company_type: { id, label, code },
                 ceo_info: { id, email, phone_number, job_title, individual: { id, name, first_name } } } }] */
export function listerAudits() {
  return apiFetch("/api/companies/audits/");
}

/* POST /api/companies/audits/create/ → crée l'audit (et l'entreprise / le dirigeant au besoin).
   body : { company: { siren_number, company_name, naf_code, creation_date, industry, city, company_type },
            ceo: { name, first_name, email, phone_number, job_title },
            audit: { siret_number, head_count, revenue, profit, publication_year } }
   → { id, siret_number, head_count, revenue, profit, publication_year, company_id, siren_number, company_name, … } */
export function creerAudit(body) {
  return apiFetch("/api/companies/audits/create/", { method: "POST", body });
}

/* GET /api/companies/audits/<audit_id>/documents/ → documents de l'audit, du plus ancien au plus récent :
   [{ id, original_name, stored_name, size, mime_type, created_at, audit_id }] */
export function listerDocuments(auditId, { signal } = {}) {
  return apiFetch(`/api/companies/audits/${encodeURIComponent(auditId)}/documents/`, { signal });
}

/* DELETE /api/companies/documents/<document_id>/delete/ → 204 ; supprime la ligne et le fichier stocké.
   404 { detail: "Document introuvable." } s'il n'existe plus. */
export function supprimerDocument(documentId) {
  return apiFetch(`/api/companies/documents/${encodeURIComponent(documentId)}/delete/`, { method: "DELETE" });
}

/* POST /api/companies/documents/<document_id>/extract/[?force=true] → lecture du PDF, anonymisation,
   structuration par le LLM et contrôles. Si la dernière extraction est « ok », elle est renvoyée
   telle quelle ; force la relance quand même.
   → { id, document_id, extraction_date, status: "ok" | "a_verifier", attempts, input_tokens, output_tokens,
       errors: [str], extraction: {…} | null, variables: {…} | null,
       indicateurs: { documents_pris_en_compte, documents_a_verifier, chiffre_affaires, resultat_net, effectif,
                      documents_commerciaux, comptes_annuels } }
   415 si ce n'est pas un PDF, 422 si le PDF est illisible ou le secteur non pris en charge, 500 si la conversion échoue. */
export function extraireDocument(documentId, { force = false, signal } = {}) {
  const query = force ? "?force=true" : "";
  return apiFetch(`/api/companies/documents/${encodeURIComponent(documentId)}/extract/${query}`, { method: "POST", signal });
}

/* POST /api/companies/audits/<audit_id>/documents/upload/ (multipart : `files` répété une fois par fichier)
   → [{ id, original_name, stored_name, size, mime_type, created_at, audit_id }] */
export function uploaderDocuments(auditId, files, { signal } = {}) {
  const body = new FormData();
  Array.from(files).forEach(f => body.append("files", f));
  return apiFetch(`/api/companies/audits/${encodeURIComponent(auditId)}/documents/upload/`, { method: "POST", body, signal });
}

/* ------------------------------------------------------------
   Questionnaire adaptatif : tours de questions générés par l'agent IA
   Question : { id, display_order, label, rationale,
                answer_type: "montant" | "pourcentage" | "nombre" | "date" | "oui_non" | "choix" | "texte",
                choices: [str] | null, unit: str | null, document_ids: [int],
                suggested_answer, suggested_answer_source: str | null,
                status: "en_attente" | "repondue" | "ignoree", answer }
   Tour : { id, round_number, status: "en_cours" | "ok" | "erreur", analysis, input_tokens, output_tokens, questions }
   ------------------------------------------------------------ */

/* GET /api/companies/audits/<audit_id>/questionnaires/ → { finished, questionnaires: [tour] },
   tous les tours (y compris en erreur, sans question), du premier au dernier. 404 si l'audit n'existe pas. */
export function listerQuestionnaires(auditId, { signal } = {}) {
  return apiFetch(`/api/companies/audits/${encodeURIComponent(auditId)}/questionnaires/`, { signal });
}

/* POST /api/companies/audits/<audit_id>/questionnaires/generate/ → génère le tour suivant (jusqu'à ~2 min).
   → { ...tour, finished, errors: [str], tool_calls: [{ tool, arguments }] }
   status « erreur » : relancer la même route reprend ce tour.
   409 : aucun document extrait, tour déjà en cours, questions du dernier tour en attente, questionnaire terminé. */
export function genererQuestionnaire(auditId, { signal } = {}) {
  return apiFetch(`/api/companies/audits/${encodeURIComponent(auditId)}/questionnaires/generate/`, { method: "POST", signal });
}

/* PATCH /api/companies/questions/<id>/answer/ → la question mise à jour.
   body : { status: "repondue", answer } | { status: "ignoree" } | { status: "en_attente" }
   400 si la réponse ne correspond pas au type ; 409 si le tour suivant a déjà été généré. */
export function repondreQuestion(questionId, body) {
  return apiFetch(`/api/companies/questions/${encodeURIComponent(questionId)}/answer/`, { method: "PATCH", body });
}

/* ------------------------------------------------------------
   Cockpit : moteur de calcul sectoriel (Module 3), calculé à chaque appel, sans LLM
   ------------------------------------------------------------ */

/* GET /api/companies/audits/<audit_id>/cockpit/ →
   { secteur: "BTP" | "SERVICES" | "INDUSTRIE",
     entrees: [{ cle, label, valeur: number | null, unite: str | null,
                 source: "comptes_annuels" | "api" | "documents" | "questionnaire" | "parametre" | null,
                 detail: str | null, statut: "ok" | "manquant" | "non_defini" }],
     indicateurs: [{ cle, nom, valeur: number | null, unite, formule, pivot: bool, comparaison: str | null,
                     manquants: [cle d'entrée], statut: "ok" | "manquant" | "non_defini" }],
     etapes_calcul: [{ libelle, equation, resultat: number | null, unite }],
     perte_annuelle: { valeur: number | null, partielle: bool,
                       composantes: [{ cle, label, valeur: number | null, manquants: [cle], statut }] },
     score_sante: number | null,
     controles: [{ ok: bool, texte }] }
   statut : « manquant » = donnée absente (à obtenir par le questionnaire ou un document) ;
            « non_defini » = méthode de calcul pas encore définie.
   Unités : pourcentages en points (20 = 20 %). 404 { detail } si l'audit n'existe pas. */
export function getCockpit(auditId, { signal } = {}) {
  return apiFetch(`/api/companies/audits/${encodeURIComponent(auditId)}/cockpit/`, { signal });
}

/* ------------------------------------------------------------
   Rapport PDF remis au client (Module 4) : une seule version par audit,
   chaque génération remplace la précédente.
   ------------------------------------------------------------ */

/* Rapport renvoyé par les routes ci-dessous (tous les champs à null / 0 / false si jamais généré) :
   { status: "en_cours" | "ok" | "erreur" | null,   ← état de la dernière génération
     content: { synthese_executive: [str], points_cles: [str], commentaire_perte: str,
                commentaires_indicateurs: [{ cle, commentaire }],
                leviers: [{ titre, constat, actions: [str], gain_attendu, indicateur_suivi }],
                message_conclusion: str } | null,    ← textes de la dernière génération réussie
     page_count: number | null, errors: [str] | null, input_tokens, output_tokens,
     generated_at: ISO | null, pdf_available: bool }
   Une génération en erreur laisse en place la version précédente (content, PDF). */

/* GET /api/companies/audits/<audit_id>/report/ → rapport. 404 si l'audit n'existe pas. */
export function getRapport(auditId, { signal } = {}) {
  return apiFetch(`/api/companies/audits/${encodeURIComponent(auditId)}/report/`, { signal });
}

/* POST /api/companies/audits/<audit_id>/report/generate/ → rapport (status « ok » ou « erreur »).
   Synchrone : rédaction LLM puis mise en page, une à deux minutes.
   409 : questionnaire non terminé, génération déjà en cours, lien Calendly non configuré ;
   422 : secteur sans moteur de calcul. */
export function genererRapport(auditId, { signal } = {}) {
  return apiFetch(`/api/companies/audits/${encodeURIComponent(auditId)}/report/generate/`, { method: "POST", signal });
}

/* GET /api/companies/audits/<audit_id>/report/pdf/ → Blob du PDF (dernière version).
   Le nom de fichier du back (Content-Disposition) n'est pas lisible en CORS : le front le recompose.
   404 si aucun PDF. */
export function getRapportPdf(auditId, { signal } = {}) {
  return apiFetch(`/api/companies/audits/${encodeURIComponent(auditId)}/report/pdf/?disposition=inline`, {
    signal,
    format: "blob",
    headers: { Accept: "application/pdf, application/json" }
  });
}
