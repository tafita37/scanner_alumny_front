/* ============================================================
   Alumny — Les trois moteurs sectoriels du cockpit
   Trois moteurs distincts, pas une formule unique adaptée.
   ============================================================ */

export const MOTEURS = {
  BTP: {
    score: 68, fuite: 47800, facteur: "× 14,2",
    tend: [
      ["Masse salariale + charges fixes", "892 500 €", "bilan déposé"],
      ["Heures théoriques annuelles", "38 400 h", "effectif × 1 600 h"],
      ["Coefficient d'improductivité", "20 %", "paramètre sectoriel"],
      ["Coût horaire tendanciel du secteur", "54,00 €", "référence régionale"]
    ],
    indics: [
      {
        pivot: true, nom: "Coût Horaire Chargé Réel (CHr)", val: "29,05 €/h", cmp: "vs 54,00 €/h tendanciel secteur",
        formule: "CHr = (masse salariale + charges fixes)\n      ÷ (heures théoriques × (1 − 20 %))"
      },
      {
        nom: "Écart de Facturation Main-d'œuvre (Emo)", val: "− 31 200 €", cmp: "taux facturé 42 €/h < coût réel corrigé",
        formule: "Emo = (taux facturé − CHr) × volume d'heures"
      },
      {
        nom: "Indice de Risque BFR / Trésorerie", val: "7,4 / 10", cmp: "délai de paiement détecté : 75 j (LME : 60 j max)",
        formule: "f(délai de paiement, encours, saisonnalité)"
      }
    ],
    calc: [
      ["Masse salariale + charges fixes issues du bilan", "704 000 + 188 500", "892 500 €"],
      ["Heures facturables réelles", "38 400 × (1 − 0,20)", "30 720 h"],
      ["Coût horaire chargé réel", "892 500 ÷ 30 720", "29,05 €/h"],
      ["Écart main-d'œuvre sur les devis analysés", "(42,00 − 29,05) × 38 h × 3 devis", "− 1 476 €"],
      ["Extrapolation annuelle", "× facteur sectoriel 14,2", "− 20 960 €"],
      ["Agrégation pondérée (Emo 45 % · BFR 35 % · marge 20 %)", "Score de Fuite Global", "47 800 €"]
    ],
    bench: [["Vous", 78, "29,05 €"], ["Médiane locale BTP", 58, "34,10 €"], ["Top quartile", 40, "41,80 €"]],
    leviers: [
      ["Renégocier les conditions de paiement", "75 j → 45 j sur les 3 principaux donneurs d'ordre — gain de BFR estimé 18 k€."],
      ["Réviser le taux horaire facturé", "+ 4,50 €/h sur les prestations de pose : + 26 k€ de marge annuelle."],
      ["Suivre les heures improductives", "Pointage chantier hebdomadaire pour objectiver le coefficient de 20 %."]
    ]
  },

  Services: {
    score: 81, fuite: 18400, facteur: "× 11,8",
    tend: [
      ["Masse salariale + charges fixes", "486 000 €", "bilan déposé"],
      ["Jours ouvrés facturables", "1 620 j", "effectif × 180 j"],
      ["Taux de facturabilité de référence", "72 %", "paramètre sectoriel"],
      ["TJM tendanciel du secteur", "640 €", "référence métier / région"]
    ],
    indics: [
      {
        pivot: true, nom: "TJM Réel Chargé vs TJM Vendu", val: "417 € / 550 €", cmp: "écart de 133 € par jour vendu",
        formule: "TJM réel = coûts chargés ÷ (jours ouvrés × taux de facturabilité)"
      },
      {
        nom: "Taux de facturabilité (Utilization Rate)", val: "63 %", cmp: "vs 72 % de référence sectorielle",
        formule: "jours facturés ÷ jours ouvrés disponibles"
      },
      {
        nom: "Écart de scope creep", val: "9,2 %", cmp: "prestations livrées hors périmètre contractuel",
        formule: "(jours livrés − jours vendus) ÷ jours vendus"
      }
    ],
    calc: [
      ["Coûts chargés annuels", "bilan déposé", "486 000 €"],
      ["Jours réellement facturables", "1 620 × 0,63", "1 021 j"],
      ["TJM réel chargé", "486 000 ÷ 1 021", "476 €"],
      ["Écart de facturabilité vs référence", "(0,72 − 0,63) × 1 620 j × 550 €", "− 80 190 €"],
      ["Coût d'opportunité du temps du dirigeant", "42 j non facturés × 550 €", "− 23 100 €"],
      ["Agrégation pondérée après extrapolation", "Score de Fuite Global", "18 400 €"]
    ],
    bench: [["Vous", 63, "63 %"], ["Médiane locale Services", 72, "72 %"], ["Top quartile", 84, "84 %"]],
    leviers: [
      ["Cadrer le périmètre par avenant", "Formaliser les demandes hors scope : ~9 % de jours récupérables."],
      ["Remonter le TJM vendu", "550 € → 610 € sur les nouvelles missions, aligné sur le tendanciel secteur."],
      ["Déléguer l'administratif du dirigeant", "42 jours/an à réaffecter en production facturable."]
    ]
  },

  Industrie: {
    score: 62, fuite: 96500, facteur: "× 16,5",
    tend: [
      ["Coûts variables de production", "3 240 000 €", "bilan déposé"],
      ["Temps d'ouverture machine", "5 800 h", "déclaratif consultant"],
      ["TRS/OEE de référence", "76 %", "paramètre sectoriel"],
      ["Taux de charge machine de référence", "82 €/h", "amortissement + énergie"]
    ],
    indics: [
      {
        pivot: true, nom: "Taux de Rendement Synthétique (TRS/OEE)", val: "61 %", cmp: "vs 76 % de référence sectorielle",
        formule: "TRS = disponibilité × performance × qualité"
      },
      {
        nom: "Marge sur coûts variables", val: "23,8 %", cmp: "− 5,2 pts vs référence secteur",
        formule: "(CA − coûts variables) ÷ CA"
      },
      {
        nom: "Coût d'immobilisation des stocks", val: "41 700 €/an", cmp: "rotation : 4,1 tours/an",
        formule: "stock moyen × taux de portage annuel"
      }
    ],
    calc: [
      ["Temps d'ouverture machine", "déclaratif consultant", "5 800 h"],
      ["Heures réellement productives", "5 800 × 0,61", "3 538 h"],
      ["Heures perdues vs référence 76 %", "5 800 × (0,76 − 0,61)", "870 h"],
      ["Valorisation des heures perdues", "870 h × 82 €/h", "− 71 340 €"],
      ["Coût de portage des stocks", "stock moyen × 11 %", "− 41 700 €"],
      ["Agrégation pondérée après extrapolation", "Score de Fuite Global", "96 500 €"]
    ],
    bench: [["Vous", 61, "61 %"], ["Médiane locale Industrie", 76, "76 %"], ["Top quartile", 88, "88 %"]],
    leviers: [
      ["Instrumenter les arrêts machine", "Relevé manuel 2 semaines pour objectiver la perte de disponibilité."],
      ["Réduire le stock dormant", "Rotation 4,1 → 6 tours/an : ~15 k€ de trésorerie libérée."],
      ["Revoir la tarification des petites séries", "Marge sur coûts variables inférieure au seuil de rentabilité."]
    ]
  }
};

export const CONTROLES_COCKPIT = [
  [true, "Secteur déclaré confirmé par l'agent orchestrateur"],
  [true, "Schéma JSON validé (Pydantic) sur les 4 documents"],
  [false, "1 champ extrait sous le seuil de confiance — délai de paiement"],
  [true, "Bilan comptable présent (masse salariale + charges fixes)"],
  [false, "Facteur d'extrapolation annuelle à confirmer avec le consultant"]
];
