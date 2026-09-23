/* ============================================================
   Alumny — Données de la page Paramètres & administration
   ============================================================ */

export const PARAMS = [
  { fam: "Communs", nom: "Poids d'agrégation du Score de Fuite Global", cle: "score.poids", val: "45 / 35 / 20", unite: "%", maj: "02/08/2026", actif: true },
  { fam: "Communs", nom: "Seuil jauge rouge", cle: "jauge.seuil_rouge", val: "50", unite: "/100", maj: "02/08/2026", actif: true },
  { fam: "Communs", nom: "Seuil jauge verte", cle: "jauge.seuil_vert", val: "75", unite: "/100", maj: "02/08/2026", actif: true },
  { fam: "Communs", nom: "Facteur d'extrapolation annuelle", cle: "extrapolation.facteur", val: "14,2", unite: "×", maj: "11/08/2026", actif: true, fragile: true },
  { fam: "Communs", nom: "Valeur tendancielle de référence (Occitanie)", cle: "tendanciel.region", val: "54,00", unite: "€/h", maj: "28/07/2026", actif: true },
  { fam: "BTP", nom: "Coefficient d'improductivité", cle: "btp.improductivite", val: "20", unite: "%", maj: "11/08/2026", actif: true },
  { fam: "BTP", nom: "Délai de paiement légal (Loi LME)", cle: "btp.lme_jours", val: "60", unite: "jours", maj: "14/05/2026", actif: true },
  { fam: "BTP", nom: "Taux horaire de référence — maçonnerie / Occitanie", cle: "btp.taux_maconnerie", val: "38,50", unite: "€/h", maj: "28/07/2026", actif: true },
  { fam: "BTP", nom: "Coefficient d'improductivité (ancienne valeur)", cle: "btp.improductivite_v1", val: "18", unite: "%", maj: "02/02/2026", actif: false },
  { fam: "Services", nom: "Taux de facturabilité cible (Utilization Rate)", cle: "svc.utilization_ref", val: "72", unite: "%", maj: "20/07/2026", actif: true },
  { fam: "Services", nom: "TJM de référence — conseil / région", cle: "svc.tjm_ref", val: "640", unite: "€", maj: "20/07/2026", actif: true },
  { fam: "Industrie", nom: "TRS / OEE de référence", cle: "ind.trs_ref", val: "76", unite: "%", maj: "18/07/2026", actif: true },
  { fam: "Industrie", nom: "Taux de charge machine de référence", cle: "ind.charge_machine", val: "82", unite: "€/h", maj: "18/07/2026", actif: true }
];

export const UTILISATEURS = [
  { nom: "Ny Aina R.", mail: "ny-aina@alumny.fr", role: "Admin", actif: true, dossiers: 4, ini: "NR" },
  { nom: "Tafita A.", mail: "tafita@alumny.fr", role: "Consultant", actif: true, dossiers: 4, ini: "TA" },
  { nom: "Sarah M.", mail: "sarah@alumny.fr", role: "Consultant", actif: false, dossiers: 2, ini: "SM" }
];

export const PERMISSIONS = [
  ["Créer / traiter un dossier", true, true],
  ["Générer un rapport PDF", true, true],
  ["Consulter les documents sources", true, true],
  ["Modifier les paramètres sectoriels", true, false],
  ["Gérer les comptes et les rôles", true, false],
  ["Déclencher une purge RGPD manuelle", true, false],
  ["Voir les statistiques agrégées", true, true]
];

export const ROLES_FUTURS = [
  ["Consultant junior / stagiaire", "génération de rapport soumise à validation d'un senior"],
  ["Commercial", "accès à la fiche Client et au score, sans les documents sources"],
  ["Lecture seule / Direction", "statistiques agrégées uniquement"]
];

export const ARBITRAGES = [
  ["Budget serveur de production", "GPU si OCR local retenu, vs coût API externe récurrent"],
  ["Durée de conservation des données nominatives", "confirmer « 3 ans depuis le dernier dossier »"],
  ["Pipeline OCR définitif", "local vs externe, et garanties RGPD associées (DPA / ZDR)"]
];

export const PROMPT_SYSTEME = `Tu es un extracteur de données documentaires.
Renvoie UNIQUEMENT un objet JSON conforme au schéma fourni.
Si une valeur est absente ou illisible, renvoie null —
n'invente JAMAIS de valeur.
Aucun texte hors du JSON.`;
