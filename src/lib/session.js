/* ------------------------------------------------------------
   Session d'authentification (token + profil), hors de React.
   Source de vérité unique partagée par :
   - lib/api.js          → lit le token, le remplace après un refresh
   - context/UserContext → s'abonne pour re-rendre l'interface
   Les autres onglets sont tenus à jour via BroadcastChannel, ce qui
   couvre aussi les sessions en sessionStorage (propres à chaque onglet).
   ------------------------------------------------------------ */
const CLE_SESSION = "alumny_session";
const CANAL = "alumny_session";

/* { token, expiresAt, user, persistante } | null
   `persistante` : true → localStorage (« Rester connecté »), false → sessionStorage */
let courante = null;
let initialisee = false;
let canal = null;
const abonnes = new Set();

/* Convertit l'utilisateur renvoyé par l'API au format attendu par l'interface
   ({ nom, initiales, role }) en conservant les champs d'origine. */
export function profilDepuisApi(u) {
  const prenom = (u.first_name || "").trim();
  const nomFamille = (u.last_name || "").trim();
  const nom = [prenom, nomFamille ? nomFamille[0].toUpperCase() + "." : ""].filter(Boolean).join(" ") || u.email;
  const initiales = ((prenom[0] || "") + (nomFamille[0] || "")).toUpperCase() || (u.email || "?")[0].toUpperCase();
  return {
    id: u.id,
    email: u.email,
    prenom,
    nomFamille,
    nom,
    initiales,
    role: u.is_staff ? "Admin" : "Consultant"
  };
}

/* Réponse de /login/ ou /token/refresh/ → session */
export function sessionDepuisApi(reponse, persistante) {
  return {
    token: reponse.token,
    expiresAt: reponse.expires_at,
    user: profilDepuisApi(reponse.user),
    persistante
  };
}

export const estExpiree = s => Boolean(s?.expiresAt) && new Date(s.expiresAt) <= new Date();

function stockages() {
  return [window.localStorage, window.sessionStorage];
}

function ecrireStockage(s) {
  for (const stockage of stockages()) {
    try { stockage.removeItem(CLE_SESSION); } catch { /* stockage indisponible */ }
  }
  if (!s) return;
  const { persistante, ...donnees } = s;
  try {
    (persistante ? window.localStorage : window.sessionStorage).setItem(CLE_SESSION, JSON.stringify(donnees));
  } catch { /* stockage indisponible : session en mémoire uniquement */ }
}

function lireStockage() {
  const sources = [[window.localStorage, true], [window.sessionStorage, false]];
  for (const [stockage, persistante] of sources) {
    try {
      const s = JSON.parse(stockage.getItem(CLE_SESSION) || "null");
      if (!s || !s.token) continue;
      if (estExpiree(s)) { stockage.removeItem(CLE_SESSION); continue; }
      return { ...s, persistante };
    } catch { /* stockage indisponible */ }
  }
  return null;
}

function notifier(motif) {
  for (const fn of abonnes) fn(courante, motif);
}

/* À appeler côté client uniquement (après le montage). Idempotent. */
export function initSession() {
  if (initialisee || typeof window === "undefined") return;
  initialisee = true;
  courante = lireStockage();

  if (typeof BroadcastChannel !== "undefined") {
    canal = new BroadcastChannel(CANAL);
    canal.onmessage = ({ data }) => {
      if (data?.type === "maj") {
        /* Un autre onglet s'est connecté ou a rafraîchi le token. Un onglet
           déjà connecté garde son propre mode de stockage. */
        courante = { ...data.session, persistante: courante ? courante.persistante : data.session.persistante };
        ecrireStockage(courante);
        notifier(null);
      } else if (data?.type === "fin") {
        courante = null;
        ecrireStockage(null);
        notifier(data.motif);
      }
    };
  }
}

/* Relit la session persistante (localStorage), au cas où un autre onglet l'aurait
   remplacée sans que son message soit encore arrivé. Sans effet en sessionStorage. */
export function synchroniserDepuisStockage() {
  if (!courante?.persistante) return;
  try {
    const s = JSON.parse(window.localStorage.getItem(CLE_SESSION) || "null");
    if (s?.token && s.token !== courante.token && !estExpiree(s)) {
      courante = { ...s, persistante: true };
      notifier(null);
    }
  } catch { /* stockage indisponible */ }
}

export function getSession() {
  return courante;
}

/* Enregistre une session (login, refresh, mise à jour du profil) et la diffuse. */
export function enregistrerSession(s) {
  courante = s;
  ecrireStockage(s);
  canal?.postMessage({ type: "maj", session: s });
  notifier(null);
}

/* Termine la session : motif "volontaire" (déconnexion) ou "expiree". */
export function viderSession(motif = "volontaire") {
  if (!courante) return;
  courante = null;
  ecrireStockage(null);
  canal?.postMessage({ type: "fin", motif });
  notifier(motif);
}

/* fn(session, motif) est appelée à chaque changement. Renvoie la désinscription. */
export function abonner(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}
