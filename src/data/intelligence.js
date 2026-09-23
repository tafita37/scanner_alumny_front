/* ============================================================
   Alumny — Données de la page Benchmark & veille
   ============================================================ */

export const INTEL = {
  BTP: {
    n: 412, med: "34,10 €/h", pos: "−15 % vs médiane", z: "2,41", zl: "zone grise", bfr: "62 j", trend: "+3 j sur 12 mois",
    mat: [["Acier béton", "+8,2 %", "up"], ["Bois de charpente", "−2,1 %", "down"], ["Ciment", "+4,6 %", "up"], ["Cuivre", "+11,4 %", "up"]],
    veille: [
      ["Loi LME — délais de paiement", "Plafond de 60 jours date de facture, ou 45 jours fin de mois si clause expresse. 2 dossiers en dépassement.", "badge-bad"],
      ["Convention collective ouvriers BTP", "Revalorisation des minima au 1er juillet 2026 : +2,1 %. Impacte le coût horaire chargé de référence.", "badge-warn"],
      ["Facturation électronique obligatoire", "Calendrier confirmé pour les PME : à mentionner dans les leviers à 30 jours.", "badge-sky"]
    ]
  },
  Services: {
    n: 268, med: "612 € TJM", pos: "−10 % vs médiane", z: "3,08", zl: "risque faible", bfr: "48 j", trend: "stable",
    mat: [["Indice salaires cadres", "+3,4 %", "up"], ["Licences logicielles", "+6,8 %", "up"], ["Loyers bureaux", "+1,2 %", "up"], ["Énergie", "−4,3 %", "down"]],
    veille: [
      ["Sous-traitance & portage salarial", "Nouvelles obligations déclaratives, à vérifier sur les missions longues.", "badge-warn"],
      ["Délais de paiement B2B", "Même plafond LME que le BTP : 60 jours.", "badge-sky"]
    ]
  },
  Industrie: {
    n: 154, med: "78 % TRS", pos: "−15 pts vs médiane", z: "1,87", zl: "risque élevé", bfr: "94 j", trend: "+7 j sur 12 mois",
    mat: [["Acier plat", "+9,7 %", "up"], ["Polymères", "+5,1 %", "up"], ["Électricité industrielle", "−6,2 %", "down"], ["Fret routier", "+2,8 %", "up"]],
    veille: [
      ["Amortissement du matériel industriel", "Durées fiscales de référence mises à jour — impacte le taux de charge machine.", "badge-warn"],
      ["Obligations de traçabilité des déchets", "Contrôles renforcés, coût de conformité à intégrer aux charges fixes.", "badge-sky"]
    ]
  }
};
