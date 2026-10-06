/* ============================================================
   Alumny — Extraction documentaire simulée
   En attendant l'API, ce module produit des résultats plausibles
   et déterministes (graine = nom + taille du fichier) : un même
   fichier redonne toujours la même extraction.
   ============================================================ */

import { groupe } from "@/lib/format";

export const TAILLE_MAX = 20 * 1024 * 1024;
export const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
export const SEUIL_CONFIANCE = 0.75;

const EXTENSIONS = { pdf: "PDF", jpg: "JPG", jpeg: "JPG", png: "PNG" };

/* Renvoie un message d'erreur, ou null si le fichier est acceptable. */
export function validerFichier(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!EXTENSIONS[ext]) return `« ${file.name} » : format non pris en charge (PDF, JPG, PNG uniquement).`;
  if (file.size > TAILLE_MAX) return `« ${file.name} » dépasse 20 Mo.`;
  return null;
}

export const typeFichier = file => EXTENSIONS[file.name.split(".").pop().toLowerCase()] || "?";

export function formatTaille(octets) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

/* Catégorie devinée depuis le nom ; null → classée par l'orchestrateur pendant l'extraction. */
export function devinerCategorie(nom) {
  if (/devis/i.test(nom)) return "Devis";
  if (/fact/i.test(nom)) return "Facture";
  if (/bilan|liasse|compte/i.test(nom)) return "Bilan comptable";
  return null;
}

/* ---------- Aléatoire déterministe ---------- */

function hash(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateur(graine) {
  let a = hash(graine);
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    rnd,
    entre: (min, max) => min + rnd() * (max - min),
    entier: (min, max) => Math.floor(min + rnd() * (max - min + 1)),
    choix: liste => liste[Math.floor(rnd() * liste.length)]
  };
}

/* ---------- Pipeline ---------- */

export const ETAPES_PIPELINE = [
  { k: "natif", n: 1, titre: "Extraction native du texte", desc: "rapide, gratuite — si le PDF contient une vraie couche de texte" },
  { k: "ocr", n: 2, titre: "Bascule OCR / Vision LLM", desc: "Qwen 2.5 VL 7B en local via Ollama — image → JSON en un appel" },
  { k: "anon", n: 3, titre: "Anonymisation locale", desc: "regex (e-mail, téléphone) + NER Presidio/spaCy (nom, adresse)" },
  { k: "llm", n: 4, titre: "Extraction structurée JSON strict", desc: null },
  { k: "check", n: 5, titre: "Auto-évaluation qualité", desc: "bornes min/max par secteur — re-extraction ou alerte humaine" }
];

export const etapesVierges = () => ETAPES_PIPELINE.map(e => ({ k: e.k, statut: "attente", msg: "" }));

/* ---------- Résultat d'extraction ---------- */

const PRENOMS = ["Sophie", "Julien", "Claire", "Karim", "Nathalie", "Thomas", "Inès", "Marc"];
const NOMS = ["Arnaud", "Lefebvre", "Moreau", "Benali", "Garnier", "Rousseau", "Faure", "Perrin"];
const RUES = ["rue des Lilas", "avenue Jean Jaurès", "chemin du Moulin", "boulevard Carnot", "impasse des Tilleuls"];
const VILLES = ["31400 Toulouse", "69007 Lyon", "33000 Bordeaux", "44000 Nantes", "34000 Montpellier"];

const eur = n => `${groupe(n)},00 €`;
const virgule = (n, d = 2) => n.toFixed(d).replace(".", ",");

function champ(r, k, label, brut, val, { ocr, pii = false, fragile = false }) {
  // Les images (OCR) et les champs « fragiles » sortent avec une confiance plus basse.
  let conf = ocr ? r.entre(0.7, 0.96) : r.entre(0.86, 0.995);
  if (fragile && r.rnd() < 0.55) conf = r.entre(0.52, 0.74);
  if (pii) conf = r.entre(0.95, 0.995);
  return { k, label, brut, val, conf: Math.round(conf * 100) / 100, pii };
}

/* Produit la catégorie, les champs, les entités anonymisées et le texte source d'un document. */
export function extraireDocument({ nom, taille, type, cat }) {
  const r = generateur(`${nom}|${taille}`);
  const ocr = type !== "PDF";
  const categorie = cat || r.choix(["Devis", "Devis", "Facture"]);
  const numero = `${r.choix(["2024", "2025"])}-${r.entier(100, 399)}`;

  const personne = `${r.choix(PRENOMS)} ${r.choix(NOMS)}`;
  const entites = {
    PERSON: personne,
    ADDRESS: `${r.entier(2, 98)} ${r.choix(RUES)}, ${r.choix(VILLES)}`,
    EMAIL: `${personne[0].toLowerCase()}.${personne.split(" ")[1].toLowerCase()}@mail.fr`,
    PHONE: `06 ${r.entier(10, 99)} ${r.entier(10, 99)} ${r.entier(10, 99)} ${r.entier(10, 99)}`
  };
  const o = { ocr };
  let champs;
  let ligneMetier;

  if (categorie === "Bilan comptable") {
    const ca = r.entier(90, 320) * 10000;
    const masse = Math.round(ca * r.entre(0.32, 0.45) / 500) * 500;
    const charges = Math.round(ca * r.entre(0.08, 0.14) / 500) * 500;
    const resultat = Math.round(ca * r.entre(0.02, 0.09) / 100) * 100;
    champs = [
      champ(r, "chiffre_affaires", "Chiffre d'affaires", ca, `${groupe(ca)} €`, o),
      champ(r, "masse_salariale", "Masse salariale", masse, `${groupe(masse)} €`, o),
      champ(r, "charges_fixes_structure", "Charges fixes de structure", charges, `${groupe(charges)} €`, { ...o, fragile: true }),
      champ(r, "resultat_net", "Résultat net", resultat, `${groupe(resultat)} €`, o),
      champ(r, "effectif", "Effectif moyen", r.entier(4, 28), null, o)
    ];
    champs[4].val = `${champs[4].brut} salariés`;
    delete entites.EMAIL;
    delete entites.PHONE;
    ligneMetier = `Exercice clos le 31/12/2024 — CA : ${groupe(ca)} €`;
  } else {
    const taux = Math.round(r.entre(38, 52) * 2) / 2;
    const heures = r.entier(12, 80);
    const fournitures = r.entier(8, 140) * 60;
    const delai = r.choix([30, 30, 45, 45, 60, 75, 90]);
    const totalHt = taux * heures + fournitures;
    champs = [
      champ(r, "taux_horaire_mo", "Taux horaire main-d'œuvre", taux, `${virgule(taux)} €/h`, o),
      champ(r, "volume_heures", "Volume d'heures facturé", heures, `${heures} h`, o),
      champ(r, "montant_fournitures", "Montant fournitures", fournitures, eur(fournitures), o),
      champ(r, "total_ht", "Total HT", totalHt, `${groupe(Math.floor(totalHt))},${virgule(totalHt % 1).slice(2)} €`, o),
      champ(r, "marge_brute_apparente", "Marge brute apparente", Math.round(r.entre(0.12, 0.32) * 1000) / 1000, null, { ...o, fragile: true }),
      champ(r, "conditions_paiement_jours", "Conditions de paiement", delai, `${delai} jours fin de mois`, { ...o, fragile: true }),
      champ(r, "client_final", "Client final (nominatif)", personne, personne, { ...o, pii: true })
    ];
    champs[4].val = `${virgule(champs[4].brut * 100, 1)} %`;
    ligneMetier = `Main-d'œuvre : ${heures} h à ${virgule(taux)} € HT`;
  }

  const lignesTexte = [
    { t: `${categorie === "Bilan comptable" ? "Bilan" : categorie} n°${numero} — ${categorie === "Bilan comptable" ? "gérant" : "client"} : ` },
    { pii: "PERSON", t: `${categorie === "Bilan comptable" ? "M./Mme" : "Mme/M."} ${entites.PERSON}` },
    { t: "\n" }, { pii: "ADDRESS", t: entites.ADDRESS }, { t: "\n" }
  ];
  if (entites.EMAIL) {
    lignesTexte.push({ t: "Contact : " }, { pii: "EMAIL", t: entites.EMAIL }, { t: " — " }, { pii: "PHONE", t: entites.PHONE }, { t: "\n" });
  }
  lignesTexte.push({ t: ligneMetier });

  return {
    categorie,
    numero,
    champs,
    entites,
    texte: lignesTexte,
    pages: ocr ? 1 : r.entier(1, categorie === "Bilan comptable" ? 14 : 3),
    // Une facture sur trois présente un écart entre total affiché et somme des lignes.
    ecartTotal: categorie !== "Bilan comptable" && r.rnd() < 0.33 ? r.entier(12, 180) : 0
  };
}

/* ---------- Anomalies du dossier ---------- */

/* Calcule les signaux à partir des documents extraits (devis & factures). */
export function detecterAnomalies(docs) {
  const anomalies = [];
  const commerciaux = docs.filter(d => d.statut === "extrait" && d.categorie !== "Bilan comptable");
  const valeur = (d, k) => d.champs.find(c => c.k === k)?.brut;

  commerciaux.forEach(d => {
    const delai = Number(valeur(d, "conditions_paiement_jours"));
    if (delai > 60) {
      anomalies.push({
        id: `delai-${d.id}`,
        score: `${virgule(1.5 + (delai - 60) / 12, 1)} σ`,
        titre: "Délai de paiement atypique",
        detail: `${delai} jours sur le ${d.categorie.toLowerCase()} n°${d.numero} — au-delà du plafond LME de 60 jours.`,
        source: "anomalie numérique + veille réglementaire"
      });
    }
    if (d.ecartTotal) {
      anomalies.push({
        id: `total-${d.id}`,
        score: "—",
        titre: "Total non recalculable",
        detail: `Le total du ${d.categorie.toLowerCase()} n°${d.numero} diffère de ${d.ecartTotal} € de la somme de ses lignes : erreur de saisie probable côté client.`,
        source: "contrôle arithmétique déterministe"
      });
    }
  });

  const taux = commerciaux.map(d => ({ d, t: Number(valeur(d, "taux_horaire_mo")) })).filter(x => x.t);
  if (taux.length >= 2) {
    const min = taux.reduce((a, b) => (b.t < a.t ? b : a));
    const max = taux.reduce((a, b) => (b.t > a.t ? b : a));
    const ecart = (max.t - min.t) / min.t;
    if (ecart > 0.08) {
      anomalies.push({
        id: `taux-${min.d.id}-${max.d.id}`,
        score: `${virgule(1 + ecart * 6, 1)} σ`,
        titre: "Taux horaire hétérogène",
        detail: `${virgule(min.t)} €/h sur le n°${min.d.numero} contre ${virgule(max.t)} €/h sur le n°${max.d.numero} pour une prestation comparable.`,
        source: "comparaison multi-devis"
      });
    }
  }

  return anomalies;
}
