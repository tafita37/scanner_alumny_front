/* ============================================================
   Alumny — Jeu de données de démonstration partagé
   (équivalent de l'objet AL de js/common.js dans la maquette)
   ============================================================ */

export const UTILISATEUR_DEFAUT = { nom: "Ny Aina R.", initiales: "NR", role: "Admin" };

export const SECTEURS = ["BTP", "Services", "Industrie"];

/* Navigation de la barre latérale : les `href` sont désormais des routes Next. */
export const NAV = [
  { g: "Audit" },
  { id: "nouveau", href: "/nouveau-dossier", ico: "✦", label: "Nouvel audit" },
  { id: "audits", href: "/audits", ico: "▤", label: "Audits" },
  { g: "Pilotage" },
  { id: "dashboard", href: "/dashboard", ico: "◧", label: "Tableau de bord" },
  { id: "clients", href: "/clients", ico: "◍", label: "Clients" },
  { g: "Configuration" },
  { id: "intel", href: "/intelligence", ico: "◈", label: "Benchmark & veille" },
  { g: "Configuration" },
  { id: "parametres", href: "/parametres", ico: "⚙", label: "Paramètres & admin" }
];

/* Où l'IA agit dans l'outil — le niveau (P0/P1/P2) est la faisabilité, pas une étape produit */
export const IA_MAP = [
  {
    g: "Module 1 — Onboarding", href: "/nouveau-dossier", items: [
      ["Classification automatique du secteur réel", "ML · zero-shot LLM puis fine-tuning", 1],
      ["Questionnaire adaptatif", "Agent · questions selon les données déjà extraites", 0],
      ["Qualification & scoring du lead", "Agent · heuristique puis historique de conversion", 2]
    ]
  },
  {
    g: "Module 2 — Analyse documentaire", href: "/audits", items: [
      ["Extraction documentaire", "Agent · RAG sur devis déjà traités", 0],
      ["Anonymisation RGPD", "Agent · regex + NER local (Presidio/spaCy)", 0],
      ["Auto-évaluation de la qualité d'extraction", "Agent · bornes min/max par secteur", 0],
      ["Orchestrateur multi-secteurs", "Agent · secteur déclaré vs contenu réel", 0],
      ["Comparaison multi-devis", "Agent · cohérence interne du dossier", 0],
      ["Détection d'anomalies et d'incohérences", "ML · Isolation Forest / autoencodeur", 1]
    ]
  },
  {
    g: "Modules 3 & 4 — Cockpit", href: "/audits", items: [
      ["Recommandation d'actions à 30 jours", "Agent · RAG sur playbooks consultants", 0],
      ["Score de risque de défaillance", "ML · Altman Z-score sur données publiques", 0],
      ["Score de santé organisationnelle appris", "ML · remplace la pondération manuelle", 2],
      ["Coefficient d'improductivité réel", "ML · remplace le 20 % par défaut", 2],
      ["Marge brute par type de prestation", "ML · régression sur historique", 2]
    ]
  },
  {
    g: "Rapport", href: "/audits", items: [
      ["Copilote de rédaction du rapport", "Agent · RAG sur la base métier Alumny", 0],
      ["Mise en page dynamique", "Agent · règles puis retour consultants", 2],
      ["Suivi post-audit & relance", "Agent · intégration CRM / Calendly", 2]
    ]
  },
  {
    g: "Benchmark & veille", href: "/intelligence", items: [
      ["Clustering d'entreprises comparables", "ML · K-means / DBSCAN sur SIRENE-Pappers", 0],
      ["Benchmarking sectoriel", "Agent · RAG CAPEB/FFB/INSEE puis devis anonymisés", 1],
      ["Veille réglementaire & fiscale BTP", "Agent · RAG textes légaux, Loi LME", 0],
      ["Prix des matières premières", "ML · série temporelle indices INSEE/BTP", 0],
      ["BFR de référence sectoriel", "ML · série temporelle macro-sectorielle", 0],
      ["Synthèse comparative sectorielle", "Agent · RAG documentation interne", 1]
    ]
  },
  {
    g: "Clients", href: "/clients", items: [
      ["Prédiction de churn / conversion", "ML · historique commercial Alumny", 2],
      ["Scoring de probabilité d'impayé", "ML · clientèle Alumny", 2],
      ["Copilote post-audit", "Agent · RAG sur le rapport et les documents du client", 2]
    ]
  }
];

/* etape : étape d'audit la plus avancée atteinte (1 onboarding → 4 rapport, cf. ETAPES_AUDIT) */
export const DOSSIERS = [
  { ref: "D-2026-041", etape: 4, client: "Bâti Duran SARL", siret: "812 456 789 00023", secteur: "BTP", statut: "analysé", maj: "12/08/2026", consultant: "Tafita A.", score: 68, fuite: 47800 },
  { ref: "D-2026-040", etape: 2, client: "Néo Conseil", siret: "903 118 220 00017", secteur: "Services", statut: "en cours d'analyse", maj: "12/08/2026", consultant: "Ny Aina R.", score: null, fuite: null },
  { ref: "D-2026-039", etape: 2, client: "Métal Ouest", siret: "441 903 552 00038", secteur: "Industrie", statut: "documents en attente", maj: "11/08/2026", consultant: "Tafita A.", score: null, fuite: null },
  { ref: "D-2026-038", etape: 4, client: "Toiture & Fils", siret: "789 220 114 00011", secteur: "BTP", statut: "rapport généré", maj: "09/08/2026", consultant: "Tafita A.", score: 54, fuite: 71200 },
  { ref: "D-2026-037", etape: 4, client: "Studio Lompré", siret: "552 771 003 00029", secteur: "Services", statut: "rapport généré", maj: "05/08/2026", consultant: "Ny Aina R.", score: 81, fuite: 18400 },
  { ref: "D-2026-036", etape: 1, client: "Charpente Vallée", siret: "331 887 664 00042", secteur: "BTP", statut: "brouillon", maj: "04/08/2026", consultant: "Ny Aina R.", score: null, fuite: null },
  { ref: "D-2026-035", etape: 4, client: "Plasturgie Rhône", siret: "220 449 118 00050", secteur: "Industrie", statut: "archivé", maj: "22/07/2026", consultant: "Tafita A.", score: 62, fuite: 96500 },
  { ref: "D-2026-034", etape: 4, client: "Bâti Duran SARL", siret: "812 456 789 00023", secteur: "BTP", statut: "archivé", maj: "14/02/2026", consultant: "Ny Aina R.", score: 51, fuite: 63900 }
];

export const CLIENTS = [
  { siret: "812 456 789 00023", nom: "Bâti Duran SARL", secteur: "BTP", dirigeant: "Marc Duran", email: "m.duran@batiduran.fr", tel: "06 12 44 87 20", statut: "accompagné", effectif: 24, ca: "3,1 M€", naf: "43.99C", dossiers: 2, dernier: "12/08/2026" },
  { siret: "903 118 220 00017", nom: "Néo Conseil", secteur: "Services", dirigeant: "Salomé Vidal", email: "s.vidal@neoconseil.fr", tel: "07 88 12 03 55", statut: "audité", effectif: 9, ca: "1,4 M€", naf: "70.22Z", dossiers: 1, dernier: "12/08/2026" },
  { siret: "441 903 552 00038", nom: "Métal Ouest", secteur: "Industrie", dirigeant: "Hervé Le Goff", email: "direction@metalouest.fr", tel: "02 40 55 18 90", statut: "prospect", effectif: 47, ca: "8,7 M€", naf: "25.11Z", dossiers: 1, dernier: "11/08/2026" },
  { siret: "789 220 114 00011", nom: "Toiture & Fils", secteur: "BTP", dirigeant: "Jean Perrot", email: "contact@toitureetfils.fr", tel: "04 78 21 09 44", statut: "audité", effectif: 12, ca: "1,9 M€", naf: "43.91A", dossiers: 1, dernier: "09/08/2026" },
  { siret: "552 771 003 00029", nom: "Studio Lompré", secteur: "Services", dirigeant: "Alice Lompré", email: "alice@studiolompre.com", tel: "06 45 78 12 33", statut: "accompagné", effectif: 6, ca: "780 k€", naf: "73.11Z", dossiers: 1, dernier: "05/08/2026" },
  { siret: "331 887 664 00042", nom: "Charpente Vallée", secteur: "BTP", dirigeant: "Léa Vallée", email: "lea@charpente-vallee.fr", tel: "05 61 22 47 18", statut: "prospect", effectif: 18, ca: "2,6 M€", naf: "43.91B", dossiers: 1, dernier: "04/08/2026" },
  { siret: "220 449 118 00050", nom: "Plasturgie Rhône", secteur: "Industrie", dirigeant: "Karim Bensalah", email: "k.bensalah@plastrhone.fr", tel: "04 72 90 11 07", statut: "perdu", effectif: 63, ca: "12,3 M€", naf: "22.29A", dossiers: 1, dernier: "22/07/2026" }
];

export const STATUT_TON = {
  "brouillon": "ink",
  "documents en attente": "warn",
  "en cours d'analyse": "sky",
  "analysé": "gold",
  "rapport généré": "ok",
  "archivé": "ink",
  "prospect": "sky",
  "audité": "gold",
  "accompagné": "ok",
  "perdu": "bad"
};
