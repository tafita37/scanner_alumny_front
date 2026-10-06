"use client";

import { useState } from "react";
import { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { IaBlock, IaSrc, IaTag } from "@/components/ui/Ia";
import { useUi } from "@/context/UiContext";

/* anomalies : [{ id, score, titre, detail, source }] calculées sur les documents extraits */
export default function AnomaliesDetectees({ anomalies, nbExtraits }) {
  const { toast } = useUi();
  const [qualifs, setQualifs] = useState({});

  const qualifier = (id, verdict) => {
    setQualifs(q => ({ ...q, [id]: verdict }));
    toast("Signal qualifié — le retour alimentera le modèle une fois un volume suffisant atteint.", "gold");
  };

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

      {anomalies.length === 0 ? (
        <p className="hint mt">
          {nbExtraits === 0
            ? "Les signaux apparaîtront dès qu'un devis ou une facture aura été extrait."
            : "Aucune incohérence détectée sur les documents extraits."}
        </p>
      ) : (
        <ul className="anos">
          {anomalies.map(a => {
            const q = qualifs[a.id];
            return (
              <li key={a.id} className={q ? `is-${q}` : undefined}>
                <span className="ano-sc">{a.score}</span>
                <span className="grow">
                  <b>{a.titre}</b>{a.detail}
                  <span className="sig">{a.source}</span>
                </span>
                {q ? (
                  <Badge tone={q === "confirme" ? "bad" : "ink"}>{q === "confirme" ? "confirmé" : "écarté"}</Badge>
                ) : (
                  <span className="tbl-actions">
                    <button className="btn btn-icon" type="button" title="Confirmer le signal" onClick={() => qualifier(a.id, "confirme")}>✓</button>
                    <button className="btn btn-icon" type="button" title="Écarter le signal" onClick={() => qualifier(a.id, "ecarte")}>✕</button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <IaSrc>
        Isolation Forest sur les champs numériques du dossier + comparaison structurée entre les devis
      </IaSrc>
    </IaBlock>
  );
}
