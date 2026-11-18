/* ============================================================
   Alumny — Contenus ILLUSTRATIFS du cockpit, par secteur.
   Ce que le moteur ne calcule pas encore : score de santé (formule
   à définir), comparatif marché local (source des benchmarks à
   définir) et leviers d'optimisation (agent pas encore construit).
   Les données d'entrée, indicateurs, étapes de calcul, perte annuelle
   et contrôles viennent de GET …/audits/<id>/cockpit/.
   ============================================================ */

export const MOTEURS = {
  BTP: {
    score: 68,
    bench: [["Vous", 78, "29,05 €"], ["Médiane locale BTP", 58, "34,10 €"], ["Top quartile", 40, "41,80 €"]],
    leviers: [
      ["Renégocier les conditions de paiement", "75 j → 45 j sur les 3 principaux donneurs d'ordre — gain de BFR estimé 18 k€."],
      ["Réviser le taux horaire facturé", "+ 4,50 €/h sur les prestations de pose : + 26 k€ de marge annuelle."],
      ["Suivre les heures improductives", "Pointage chantier hebdomadaire pour objectiver le coefficient de 20 %."]
    ]
  },

  Services: {
    score: 81,
    bench: [["Vous", 63, "63 %"], ["Médiane locale Services", 72, "72 %"], ["Top quartile", 84, "84 %"]],
    leviers: [
      ["Cadrer le périmètre par avenant", "Formaliser les demandes hors scope : ~9 % de jours récupérables."],
      ["Remonter le TJM vendu", "550 € → 610 € sur les nouvelles missions, aligné sur le tendanciel secteur."],
      ["Déléguer l'administratif du dirigeant", "42 jours/an à réaffecter en production facturable."]
    ]
  },

  Industrie: {
    score: 62,
    bench: [["Vous", 61, "61 %"], ["Médiane locale Industrie", 76, "76 %"], ["Top quartile", 88, "88 %"]],
    leviers: [
      ["Instrumenter les arrêts machine", "Relevé manuel 2 semaines pour objectiver la perte de disponibilité."],
      ["Réduire le stock dormant", "Rotation 4,1 → 6 tours/an : ~15 k€ de trésorerie libérée."],
      ["Revoir la tarification des petites séries", "Marge sur coûts variables inférieure au seuil de rentabilité."]
    ]
  }
};
