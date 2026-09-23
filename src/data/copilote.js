/* ============================================================
   Alumny — Contenus du Copilote (questions sourcées + actions)
   ============================================================ */

export const COPI_QA = [
  {
    q: "D'où vient le montant de 47 800 € ?",
    r: "Il agrège trois indicateurs BTP pondérés (écart main-d'œuvre 45 %, risque BFR 35 %, marge 20 %), calculés sur 3 devis puis extrapolés à l'année via le facteur sectoriel × 14,2.",
    s: "sources : résultat de calcul D-2026-041 · paramètres sectoriels"
  },
  {
    q: "Quel levier proposer en premier au dirigeant ?",
    r: "La renégociation des délais de paiement : 75 jours constatés contre 60 jours maximum autorisés par la Loi LME. Gain de BFR estimé à 18 k€, sans toucher au prix de vente.",
    s: "sources : playbook « trésorerie BTP » · veille réglementaire LME"
  },
  {
    q: "Ce client est-il comparable au marché local ?",
    r: "Son coût horaire chargé réel (29,05 €/h) est inférieur de 15 % à la médiane de son cluster (34,10 €/h) : il sous-facture sa main-d'œuvre plutôt qu'il ne surpaie ses charges.",
    s: "sources : clustering d'entreprises comparables (SIRENE/Pappers)"
  },
  {
    q: "Que dit la loi sur les délais de paiement ?",
    r: "La Loi LME plafonne le délai convenu à 60 jours à compter de la date d'émission de la facture, ou 45 jours fin de mois si la clause est expresse et non abusive.",
    s: "sources : agent de veille réglementaire · textes légaux indexés"
  }
];

/* Actions que le Copilote peut exécuter à la place du consultant */
export const COPI_ACTIONS = [
  {
    id: "rapport", ico: "▥", nom: "Générer le rapport du dossier",
    quoi: "D-2026-041 · Bâti Duran SARL",
    etapes: ["Collecte des résultats validés", "Rédaction de la synthèse dirigeant", "Sélection des 3 leviers à 30 jours", "Mise en page à la charte", "Export PDF versionné"],
    fait: "Rapport <b>v4</b> généré — 11 pages, non remis au client tant que tu ne l'as pas relu.",
    lien: ["Ouvrir le rapport", "/rapports"],
    motifs: /rapport|pdf|génère|genere|générer/
  },
  {
    id: "relance", ico: "✉", nom: "Relancer un client sur ses pièces manquantes",
    quoi: "Métal Ouest · bilan comptable absent",
    etapes: ["Identification des pièces manquantes", "Rédaction du message au dirigeant", "Préparation de l'envoi"],
    fait: "Message prêt à envoyer — il part uniquement après ta relecture.",
    lien: ["Voir le dossier", "/documents"],
    motifs: /relanc|mail|e-mail|pièce|piece|manquant/
  },
  {
    id: "dossier", ico: "✦", nom: "Créer un dossier pour un SIRET",
    quoi: "Enrichissement API + secteur suggéré + opt-in à recueillir",
    etapes: ["Recherche de l'établissement", "Enrichissement des données publiques", "Suggestion du secteur", "Création du dossier en brouillon"],
    fait: "Dossier créé en <b>brouillon</b> — le consentement RGPD reste à recueillir auprès du dirigeant.",
    lien: ["Compléter l'onboarding", "/nouveau-dossier"],
    motifs: /crée|cree|créer|nouveau dossier|nouvel audit|siret/
  },
  {
    id: "recalc", ico: "↻", nom: "Recalculer l'audit après correction",
    quoi: "Reprend les champs corrigés et propage en cascade",
    etapes: ["Relecture des champs extraits", "Exécution du moteur BTP", "Mise à jour du score et des leviers"],
    fait: "Score recalculé : <b>68 → 71</b> · perte sèche estimée 47 800 € → 44 200 €.",
    lien: ["Voir le cockpit", "/cockpit"],
    motifs: /recalcul|calcul|score|corrig/
  },
  {
    id: "synthese", ico: "✎", nom: "Résumer le dossier avant un rendez-vous",
    quoi: "Note interne de 10 lignes, non destinée au client",
    etapes: ["Lecture des résultats et des anomalies", "Rédaction de la note d'entretien"],
    fait: "Note d'entretien prête : sous-facturation main-d'œuvre, délais de paiement hors LME, 3 leviers chiffrés.",
    lien: null,
    motifs: /résum|resum|synth|note/
  }
];
