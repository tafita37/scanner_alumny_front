"use client";

import { CardHead } from "@/components/ui/Card";
import { IaBlock, IaSrc, IaTag } from "@/components/ui/Ia";
import { useUi } from "@/context/UiContext";

const ANOMALIES = [
  ["3,2 σ", "Délai de paiement atypique", "75 jours sur le devis n°2024-118, contre 30 jours sur les deux autres devis du dossier — et au-delà du plafond LME.", "anomalie numérique + veille réglementaire"],
  ["1,9 σ", "Taux horaire hétérogène", "42,00 €/h contre 47,50 €/h sur le devis n°2024-121 pour une prestation comparable.", "comparaison multi-devis"],
  ["—", "Total non recalculable", "Le total du devis n°2024-121 diffère de 84 € de la somme de ses lignes : erreur de saisie probable côté client.", "contrôle arithmétique déterministe"]
];

export default function AnomaliesDetectees() {
  const { toast } = useUi();
  const qualifier = () =>
    toast("Signal qualifié — le retour alimentera le modèle une fois un volume suffisant atteint.", "gold");

  return (
    <IaBlock>
      <CardHead>
        <h2>Anomalies et incohérences détectées</h2>
        <IaTag phase={1}>Détection d&apos;anomalies</IaTag>
        <IaTag phase={0}>Comparaison multi-devis</IaTag>
      </CardHead>

      <p className="small muted">
        Non supervisé : à faible volume, le modèle produit un <b>signal indicatif</b>, jamais un verdict.
        Chaque signal doit être confirmé ou écarté par le consultant.
      </p>

      <ul className="anos">
        {ANOMALIES.map(([score, titre, detail, source]) => (
          <li key={titre}>
            <span className="ano-sc">{score}</span>
            <span className="grow">
              <b>{titre}</b>{detail}
              <span className="sig">{source}</span>
            </span>
            <span className="tbl-actions">
              <button className="btn btn-icon" type="button" title="Confirmer le signal" onClick={qualifier}>✓</button>
              <button className="btn btn-icon" type="button" title="Écarter le signal" onClick={qualifier}>✕</button>
            </span>
          </li>
        ))}
      </ul>

      <IaSrc>
        Isolation Forest sur les champs numériques du dossier + comparaison structurée entre les 3 devis
      </IaSrc>
    </IaBlock>
  );
}
