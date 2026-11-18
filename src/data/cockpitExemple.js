/* ============================================================
   Réponse d'exemple de GET …/audits/<id>/cockpit/ (BTP).
   Utilisée UNIQUEMENT en développement, tant que la route n'existe
   pas côté back, pour voir le rendu du format attendu.
   Seuls des calculs déjà faits par le back y figurent ; le reste est
   « manquant » ou « non_defini » (aucune formule inventée).
   ============================================================ */

export const COCKPIT_EXEMPLE = {
  secteur: "BTP",
  entrees: [
    { cle: "effectif", label: "Effectif", valeur: 12, unite: "salariés", source: "comptes_annuels", detail: "effectif moyen de l'exercice clos le 31/12/2025", statut: "ok" },
    { cle: "masse_salariale_mensuelle", label: "Masse salariale mensuelle", valeur: 58667, unite: "€", source: "comptes_annuels", detail: "(salaires + charges sociales) ÷ 12 mois", statut: "ok" },
    { cle: "charges_fixes_structure", label: "Charges fixes de structure", valeur: null, unite: "€", source: null, detail: "postes du bilan à retenir non définis", statut: "non_defini" },
    { cle: "coefficient_improductivite", label: "Coefficient d'improductivité", valeur: 20, unite: "%", source: "parametre", detail: "valeur par défaut du BTP", statut: "ok" },
    { cle: "taux_horaire_facture", label: "Taux horaire facturé", valeur: 42, unite: "€/h", source: "documents", detail: "main-d'œuvre en heures de 3 devis", statut: "ok" },
    { cle: "volume_heures_mensuel", label: "Volume d'heures mensuel", valeur: null, unite: "h", source: null, detail: "à demander au dirigeant", statut: "manquant" },
    { cle: "delai_reglement_moyen", label: "Délai de règlement moyen", valeur: 75, unite: "j", source: "documents", detail: "moyenne des devis qui l'indiquent", statut: "ok" },
    { cle: "acompte_moyen", label: "Acompte moyen", valeur: 30, unite: "%", source: "documents", detail: "moyenne des devis qui l'indiquent", statut: "ok" }
  ],
  indicateurs: [
    {
      cle: "chr", nom: "Coût Horaire Chargé Réel (CHr)", valeur: null, unite: "€/h", pivot: true, comparaison: null,
      formule: "CHr = (masse salariale mensuelle + charges fixes de structure)\n      ÷ heures facturables réelles",
      manquants: ["charges_fixes_structure"], statut: "manquant"
    },
    {
      cle: "emo", nom: "Écart de Facturation Main-d'œuvre (Emo)", valeur: null, unite: "€/mois", pivot: false, comparaison: null,
      formule: "Emo = (CHr − taux horaire facturé) × volume d'heures mensuel",
      manquants: ["charges_fixes_structure", "volume_heures_mensuel"], statut: "manquant"
    },
    {
      cle: "indice_bfr", nom: "Indice de Risque BFR / Trésorerie", valeur: null, unite: "/ 10", pivot: false,
      comparaison: "délai de règlement moyen détecté : 75 j",
      formule: "f(délai moyen de paiement, coût d'encours de chantier)", manquants: [], statut: "non_defini"
    }
  ],
  etapes_calcul: [
    { libelle: "Masse salariale mensuelle", equation: "(512 000 + 192 000) ÷ 12 mois", resultat: 58667, unite: "€" },
    { libelle: "Taux horaire facturé", equation: "montant main-d'œuvre ÷ heures (3 devis)", resultat: 42, unite: "€/h" }
  ],
  perte_annuelle: {
    valeur: null,
    partielle: true,
    composantes: [
      { cle: "emo_annuel", label: "Écart main-d'œuvre annuel (Emo × 12)", valeur: null, manquants: ["charges_fixes_structure", "volume_heures_mensuel"], statut: "manquant" },
      { cle: "retards_acompte", label: "Pertes sur retards d'acompte", valeur: null, manquants: [], statut: "non_defini" },
      { cle: "surcouts_administratifs", label: "Surcoûts administratifs hors devis", valeur: null, manquants: [], statut: "non_defini" }
    ]
  },
  score_sante: null,
  controles: [
    { ok: true, texte: "Secteur BTP choisi à l'onboarding" },
    { ok: true, texte: "Comptes annuels présents (exercice clos le 31/12/2025)" },
    { ok: true, texte: "3 documents commerciaux pris en compte" },
    { ok: false, texte: "1 document à vérifier" },
    { ok: false, texte: "Questionnaire de l'agent non terminé" }
  ]
};
