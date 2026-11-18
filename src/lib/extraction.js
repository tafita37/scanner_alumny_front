/* ============================================================
   Alumny — Extraction documentaire
   Fichiers acceptés, étapes du pipeline exécuté par le back
   (POST /api/companies/documents/<id>/extract/) et mise en forme
   de son résultat pour l'affichage.
   ============================================================ */

import { decimal } from "@/lib/format";

export const TAILLE_MAX = 20 * 1024 * 1024;

/* Extension → libellé affiché. Tous ces formats sont déposés dans le dossier ;
   seuls les PDF passent par l'extraction automatique.
   csv / xml / txt couvrent exports comptables, factures UBL/CII et FEC. */
const EXTENSIONS = {
  pdf: "PDF",
  jpg: "JPG", jpeg: "JPG", png: "PNG", webp: "WEBP", tif: "TIFF", tiff: "TIFF", heic: "HEIC",
  xlsx: "XLSX", xlsm: "XLSM", xls: "XLS", ods: "ODS",
  docx: "DOCX", doc: "DOC", odt: "ODT",
  csv: "CSV", xml: "XML", txt: "TXT"
};

export const ACCEPT = Object.keys(EXTENSIONS).map(ext => `.${ext}`).join(",");
export const FORMATS_ACCEPTES = "PDF, images, Excel, Word, CSV, XML";

/* Renvoie un message d'erreur, ou null si le fichier est acceptable. */
export function validerFichier(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (!EXTENSIONS[ext]) return `« ${file.name} » : format non pris en charge (${FORMATS_ACCEPTES}).`;
  if (file.size > TAILLE_MAX) return `« ${file.name} » dépasse 20 Mo.`;
  return null;
}

export const typeFichier = file => EXTENSIONS[file.name.split(".").pop().toLowerCase()] || "?";
/* Seuls les PDF sont extraits par le back (415 sinon). */
export const estPdf = (type, mime) => type === "PDF" || mime === "application/pdf";
/* Formats que le navigateur sait afficher tels quels dans l'aperçu (TIFF et HEIC non). */
export const apercuIframe = type => type === "PDF";
export const apercuImage = type => ["JPG", "PNG", "WEBP"].includes(type);

export function formatTaille(octets) {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

/* ---------- Pipeline ---------- */

export const ETAPES_PIPELINE = [
  { k: "lecture", n: 1, titre: "Lecture du document", desc: "Docling — texte, colonnes et tableaux ; OCR local (RapidOCR) des seules zones scannées" },
  { k: "anon", n: 2, titre: "Anonymisation locale", desc: "regex (e-mail, téléphone, IBAN) + NER Presidio/spaCy (nom, adresse)" },
  { k: "llm", n: 3, titre: "Extraction structurée JSON strict", desc: null },
  { k: "check", n: 4, titre: "Contrôles de cohérence", desc: "totaux, TVA, dates, équilibre du bilan — jusqu'à 3 essais, sinon « à vérifier »" }
];

export const etapesVierges = (statut = "attente") => ETAPES_PIPELINE.map(e => ({ k: e.k, statut, msg: "" }));

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/* L'appel est synchrone : les étapes ne sont connues qu'à la réponse, on en fait le bilan. */
export function etapesTerminees({ status, attempts, errors, extraction }) {
  const reconnu = extraction && extraction.type_document !== "hors_sujet";
  let check = { k: "check", statut: "ok", msg: attempts > 1 ? `conforme au ${attempts}e essai` : "conforme" };
  if (status !== "ok") {
    check = { k: "check", statut: "warn", msg: errors.length ? `${pluriel(errors.length, "point")} à vérifier` : "à vérifier" };
  }
  return [
    { k: "lecture", statut: "ok", msg: "texte extrait" },
    { k: "anon", statut: "ok", msg: "avant l'envoi au LLM" },
    reconnu
      ? { k: "llm", statut: "ok", msg: libelleType(extraction.type_document).toLowerCase() }
      : { k: "llm", statut: "warn", msg: extraction ? "hors sujet" : "document non reconnu" },
    check
  ];
}

/* ---------- Types de document ---------- */

const TYPES = {
  devis: "Devis",
  facture: "Facture",
  situation_travaux: "Situation de travaux",
  proposition_commerciale: "Proposition commerciale",
  bon_de_commande: "Bon de commande",
  fiche_prix_revient: "Fiche de prix de revient",
  comptes_annuels: "Comptes annuels",
  liasse_fiscale: "Liasse fiscale",
  hors_sujet: "Hors sujet"
};

export const libelleType = type => TYPES[type] || "Document";
export const estComptesAnnuels = extraction => Boolean(extraction?.identification);

export const dateFr = iso => iso.split("-").reverse().join("/");

/* « Facture n°2026-230 », « Comptes annuels — exercice clos le 31/12/2025 » */
export function titreDocument(resultat) {
  const e = resultat?.extraction;
  if (!e) return "Document non reconnu";
  if (estComptesAnnuels(e)) {
    const cloture = e.identification.date_cloture;
    return libelleType(e.type_document) + (cloture ? ` — exercice clos le ${dateFr(cloture)}` : "");
  }
  const numero = e.en_tete?.numero;
  return libelleType(e.type_document) + (numero ? ` n°${numero}` : "");
}

/* Catégorie affichée dans la liste des pièces et le pipeline. */
export function categorieDoc(d) {
  if (d.resultat?.extraction) return libelleType(d.resultat.extraction.type_document);
  if (d.statut === "non_extractible") return "non extractible (PDF uniquement)";
  return "catégorie à déterminer";
}

/* ---------- Libellés et formats des champs ---------- */

/* Les clés absentes d'ici gardent un libellé déduit de leur nom : le back peut ajouter
   des champs sans que le front ait à les déclarer. */
const LIBELLES = {
  nom: "Nom", adresse: "Adresse", telephone: "Téléphone", email: "E-mail", siret: "SIRET",
  tva_intracom: "TVA intracommunautaire",
  numero: "Numéro", reference: "Référence", date_document: "Date du document", date_echeance: "Échéance",
  date_validite: "Valable jusqu'au", duree_validite_jours: "Durée de validité",
  date_debut_execution: "Début d'exécution", date_fin_execution: "Fin d'exécution", devise: "Devise",
  total_ht: "Total HT", remise_globale_ht: "Remise globale HT", total_tva: "Total TVA", total_ttc: "Total TTC",
  net_a_payer: "Net à payer", base_ht: "Base HT", montant_tva: "Montant TVA", taux: "Taux",
  acompte_pourcentage: "Acompte", acompte_montant: "Montant de l'acompte", delai_reglement_jours: "Délai de règlement",
  mode_paiement: "Mode de paiement", penalites_retard: "Pénalités de retard",
  indemnite_forfaitaire_recouvrement: "Indemnité forfaitaire de recouvrement", escompte_pourcentage: "Escompte",
  conditions_generales_presentes: "Conditions générales présentes",
  libelle: "Libellé", section: "Section", quantite: "Qté", unite: "Unité", prix_unitaire_ht: "PU HT",
  remise_pourcentage: "Remise", taux_tva: "TVA", nature: "Nature", mode_facturation: "Facturation", profil: "Profil",
  jours_estimes: "Jours estimés", au_reel: "Au réel", conditionnement: "Conditionnement",
  // BTP
  duree_travaux: "Durée des travaux", retenue_garantie_pourcentage: "Retenue de garantie",
  retenue_garantie_montant: "Montant de la retenue de garantie", autoliquidation_tva: "Autoliquidation de la TVA",
  signature_client: "Signé par le client", assureur: "Assureur", numero_police: "N° de police",
  avancement_pourcentage: "Avancement", montant_cumule_ht: "Cumul HT", montant_deja_facture_ht: "Déjà facturé HT",
  taux_horaire_main_oeuvre: "Taux horaire main-d'œuvre", heures_main_oeuvre: "Heures de main-d'œuvre",
  montant_total_main_oeuvre: "Total main-d'œuvre", montant_total_fournitures: "Total fournitures",
  marge_brute_apparente: "Marge brute apparente", montant_situation_ht: "Montant de la situation HT",
  // Services
  nb_participants: "Participants", lieu: "Lieu", reconduction: "Reconduction",
  tjm_vendu_regie: "TJM vendu (régie)", tjm_par_profil: "TJM par profil", taux_horaire_vendu_regie: "Taux horaire vendu (régie)",
  tjm_implicite_forfaits: "TJM implicite des forfaits", jours_vendus: "Jours vendus",
  montant_total_forfaits: "Total forfaits", montant_total_frais: "Total frais", montant_frais_au_reel: "Frais au réel",
  nb_echeances: "Échéances", prix_par_participant: "Prix par participant", pourcentage: "Part", montant: "Montant",
  // Industrie
  date_livraison: "Date de livraison", adresse_livraison: "Adresse de livraison", incoterm: "Incoterm",
  frais_port_ht: "Frais de port HT", produit: "Produit", quantite_reference: "Qté de référence",
  couts_variables: "Coûts variables", prix_vente: "Prix de vente", marge_sur_couts_variables: "Marge sur coûts variables",
  taux_marge_sur_couts_variables: "Taux de marge", cout_revient_unitaire: "Coût de revient unitaire",
  marge_sur_cout_revient: "Marge sur coût de revient", coefficient_applique: "Coefficient appliqué",
  cout_matiere: "Coût matière", cout_main_oeuvre: "Coût main-d'œuvre", cout_machine: "Coût machine",
  cout_revient_total: "Coût de revient total",
  // Comptes annuels
  raison_sociale: "Raison sociale", siren: "SIREN", date_ouverture: "Ouverture de l'exercice",
  date_cloture: "Clôture de l'exercice", duree_exercice_mois: "Durée de l'exercice",
  compte_resultat_present: "Compte de résultat présent", chiffre_affaires: "Chiffre d'affaires",
  resultat_exploitation: "Résultat d'exploitation", resultat_financier: "Résultat financier",
  resultat_exceptionnel: "Résultat exceptionnel", resultat_net: "Résultat net",
  creances_clients: "Créances clients", dettes_fournisseurs: "Dettes fournisseurs", disponibilites: "Disponibilités",
  total_capitaux_propres: "Capitaux propres", emprunts_dettes_financieres: "Emprunts et dettes financières",
  interets_charges_assimilees: "Intérêts et charges assimilées", effectif_moyen: "Effectif moyen",
  masse_salariale_annuelle: "Masse salariale annuelle", masse_salariale_mensuelle: "Masse salariale mensuelle",
  charges_fixes_structure: "Charges fixes de structure", autres_achats_charges_externes: "Autres achats et charges externes",
  impots_taxes: "Impôts et taxes", achats_marchandises: "Achats de marchandises",
  achats_matieres_premieres: "Achats de matières premières", stocks: "Stocks",
  dotations_amortissements: "Dotations aux amortissements", categorie: "Catégorie", effectif: "Effectif"
};

const humaniser = cle => {
  const texte = cle.replace(/_/g, " ");
  return texte.charAt(0).toUpperCase() + texte.slice(1);
};

export const libelle = cle => LIBELLES[cle] || humaniser(cle);

/* Valeurs énumérées renvoyées par le back */
const VALEURS = {
  main_oeuvre: "main-d'œuvre", regie_jour: "régie au jour", regie_heure: "régie à l'heure",
  cheque: "chèque", prelevement: "prélèvement", especes: "espèces", milliers_euros: "milliers d'euros"
};

/* Unité d'un champ numérique, déduite de son nom (premier motif qui correspond) ; « € » par défaut. */
const UNITES = [
  [/taux_horaire/, "€/h"],
  [/tjm/, "€/j"],
  [/coefficient|quantite|^nb_|effectif|taille_lot|^numero$/, ""],
  [/pourcentage|(^|_)taux(_|$)/, "%"],
  [/jours/, "j"],
  [/(^|_)heures(_|$)/, "h"],
  [/_mois$/, "mois"]
];
const uniteDe = cle => (UNITES.find(([motif]) => motif.test(cle)) || [null, "€"])[1];

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function formatValeur(cle, v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "string") return DATE_ISO.test(v) ? dateFr(v) : VALEURS[v] || v;
  if (typeof v !== "number") return String(v);
  const unite = uniteDe(cle);
  const nombre = decimal(v, Number.isInteger(v) ? 0 : 2);
  return unite ? `${nombre} ${unite}` : nombre;
}

/* ---------- Sections et tableaux affichés ---------- */

const TITRES_BLOCS = {
  en_tete: "Document", emetteur: "Émetteur", destinataire: "Destinataire", pied: "Totaux",
  conditions: "Conditions de paiement", chantier: "Chantier", situation: "Situation de travaux",
  assurance_decennale: "Assurance décennale", livraison: "Livraison"
};
const ORDRE_BLOCS = Object.keys(TITRES_BLOCS);

const TITRES_TABLEAUX = {
  lignes: "Lignes", lignes_commande: "Lignes de commande", fiches_prix_revient: "Fiches de prix de revient",
  echeancier: "Échéancier", ventilation_tva: "Ventilation de la TVA", marges_par_produit: "Marges par produit",
  repartition_effectif: "Répartition de l'effectif", engagements_hors_bilan: "Engagements hors bilan"
};

/* Champs des comptes annuels qui identifient l'exercice ; les autres variables sont des montants. */
const EXERCICE = ["raison_sociale", "siren", "date_cloture", "duree_exercice_mois", "compte_resultat_present"];

const estObjet = v => v !== null && typeof v === "object" && !Array.isArray(v);
const renseigne = v => v !== null && v !== undefined && v !== "" && typeof v !== "object";

/* Champs simples et renseignés d'un objet : { chemin, cle, label, valeur }.
   chemin identifie le champ pour les corrections ; cleFormat impose l'unité (TJM par profil). */
function champsDe(objet, prefixe, cleFormat) {
  return Object.entries(objet || {})
    .filter(([, v]) => renseigne(v))
    .map(([cle, valeur]) => ({
      chemin: prefixe ? `${prefixe}.${cle}` : cle,
      cle: cleFormat || cle,
      label: libelle(cle),
      valeur
    }));
}

/* Sections « libellé → valeur » d'une extraction : [{ titre, champs }] */
export function sectionsDocument({ extraction, variables }) {
  if (!extraction) return [];
  const sections = [];
  const ajouter = (titre, champs) => { if (champs.length) sections.push({ titre, champs }); };

  if (estComptesAnnuels(extraction)) {
    // Montants lus dans les variables : le back les a déjà convertis en euros (l'extraction peut être en k€).
    const montants = Object.fromEntries(Object.entries(variables || {}).filter(([cle]) => !EXERCICE.includes(cle)));
    ajouter("Exercice", champsDe(Object.fromEntries(EXERCICE.map(cle => [cle, variables?.[cle]])), "variables"));
    ajouter("Chiffres clés (en euros)", champsDe(montants, "variables"));
    return sections;
  }

  const { delai_reglement_jours: delai, ...autresVariables } = variables || {};
  const blocs = Object.keys(extraction)
    .filter(cle => estObjet(extraction[cle]))
    .sort((a, b) => (ORDRE_BLOCS.indexOf(a) + 1 || 99) - (ORDRE_BLOCS.indexOf(b) + 1 || 99));

  blocs.forEach(cle => {
    let champs = champsDe(extraction[cle], cle);
    // Délai absent du document mais déduit de l'échéance par le back
    if (cle === "conditions" && extraction.conditions.delai_reglement_jours == null && delai != null) {
      champs = [{ chemin: "variables.delai_reglement_jours", cle: "delai_reglement_jours", label: libelle("delai_reglement_jours"), valeur: delai, calcule: true }, ...champs];
    }
    ajouter(TITRES_BLOCS[cle] || libelle(cle), champs);
  });

  const racine = Object.fromEntries(Object.entries(extraction).filter(([cle]) => cle !== "type_document"));
  ajouter("Autres informations", champsDe(racine, ""));

  ajouter("Valeurs calculées", champsDe(autresVariables, "variables").map(c => ({ ...c, calcule: true })));
  Object.entries(autresVariables)
    .filter(([, v]) => estObjet(v))
    .forEach(([cle, v]) => ajouter(libelle(cle), champsDe(v, `variables.${cle}`, cle).map(c => ({ ...c, calcule: true }))));

  return sections;
}

const colonnesDe = lignes =>
  [...new Set(lignes.flatMap(Object.keys))].filter(cle => lignes.some(l => renseigne(l[cle])));

/* Listes d'objets de l'extraction et des variables : [{ cle, titre, colonnes, lignes }] */
export function tableauxDocument({ extraction, variables }) {
  if (!extraction) return [];
  const tableaux = [];
  [extraction, extraction.pied, extraction.annexe, variables].forEach(source => {
    Object.entries(source || {}).forEach(([cle, v]) => {
      if (!Array.isArray(v) || !v.length || !estObjet(v[0]) || tableaux.some(t => t.cle === cle)) return;
      tableaux.push({ cle, titre: TITRES_TABLEAUX[cle] || libelle(cle), colonnes: colonnesDe(v), lignes: v });
    });
  });
  return tableaux;
}

/* ---------- Anomalies du dossier ---------- */

const DELAI_LME = 60;

/* Écarts de prix comparés entre documents d'un même dossier */
const COMPARAISONS = [
  ["taux_horaire_main_oeuvre", "Taux horaire hétérogène", "€/h"],
  ["tjm_vendu_regie", "TJM hétérogène", "€/j"]
];

/* Signaux calculés à partir des variables des documents extraits. */
export function detecterAnomalies(docs) {
  const anomalies = [];
  const commerciaux = docs.filter(d => d.statut === "extrait" && d.resultat?.extraction?.en_tete);
  const prix = n => decimal(n, Number.isInteger(n) ? 0 : 2);

  commerciaux.forEach(d => {
    const delai = d.resultat.variables?.delai_reglement_jours;
    if (delai > DELAI_LME) {
      anomalies.push({
        id: `delai-${d.id}`,
        score: `+${delai - DELAI_LME} j`,
        titre: "Délai de paiement atypique",
        detail: `${delai} jours sur « ${titreDocument(d.resultat)} » — au-delà du plafond LME de ${DELAI_LME} jours.`,
        source: "délai écrit sur le document ou déduit de l'échéance"
      });
    }
  });

  COMPARAISONS.forEach(([cle, titre, unite]) => {
    const valeurs = commerciaux
      .map(d => ({ d, v: d.resultat.variables?.[cle] }))
      .filter(x => typeof x.v === "number" && x.v > 0);
    if (valeurs.length < 2) return;
    const min = valeurs.reduce((a, b) => (b.v < a.v ? b : a));
    const max = valeurs.reduce((a, b) => (b.v > a.v ? b : a));
    const ecart = (max.v - min.v) / min.v;
    if (ecart > 0.08) {
      anomalies.push({
        id: `${cle}-${min.d.id}-${max.d.id}`,
        score: `+${Math.round(ecart * 100)} %`,
        titre,
        detail: `${prix(min.v)} ${unite} sur « ${titreDocument(min.d.resultat)} » contre ${prix(max.v)} ${unite} sur « ${titreDocument(max.d.resultat)} ».`,
        source: "comparaison multi-documents"
      });
    }
  });

  return anomalies;
}
