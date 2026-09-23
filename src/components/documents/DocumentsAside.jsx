"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Misc";
import { IaBlock, IaPhase, IaTag } from "@/components/ui/Ia";

const AGENTS = [
  ["Agent d'extraction documentaire", "RAG sur des devis déjà traités"],
  ["Agent d'anonymisation RGPD", "regex + NER local"],
  ["Agent d'auto-évaluation", "bornes min/max par secteur"],
  ["Agent orchestrateur multi-secteurs", "secteur déclaré vs contenu réel"],
  ["Agent de comparaison multi-devis", "cohérence entre les 3 devis du dossier"]
];

export default function DocumentsAside({ besoins }) {
  const remplis = besoins.filter(b => b[1]).length;
  const pct = Math.round(remplis / besoins.length * 100);

  return (
    <aside className="col gap-l">
      <Card tint="blue">
        <CardHead><h3>Complétude du dossier</h3></CardHead>
        <div className="col gap-s">
          {besoins.map(([titre, ok]) => (
            <div className={"complet-row" + (ok ? "" : " ko")} key={titre}>
              <span className="ic">{ok ? "✓" : "!"}</span>{titre}
            </div>
          ))}
        </div>
        <Bar value={pct} className="mt" />
        <p className="hint mt-s">
          <b>{pct} %</b> — le moteur de calcul se déclenche automatiquement dès que les données d&apos;entrée
          sont suffisantes.
        </p>
      </Card>

      <Card>
        <CardHead><h3>Agents mobilisés</h3><IaPhase phase={0} /></CardHead>
        <ul className="agents">
          {AGENTS.map(([nom, quoi]) => (
            <li key={nom}><b>{nom}</b><span>{quoi}</span></li>
          ))}
        </ul>
      </Card>

      <IaBlock>
        <CardHead>
          <h3>Alerte orchestrateur</h3>
          <IaTag phase={0}>Routage multi-secteurs</IaTag>
        </CardHead>
        <p className="small">
          Secteur déclaré : <b>BTP</b>. Le contenu des devis (postes de main-d&apos;œuvre, fournitures,
          délais de paiement) confirme le routage vers le moteur BTP.
        </p>
        <Badge tone="ok" dot className="mt-s">Cohérence confirmée · confiance 0,94</Badge>
      </IaBlock>
    </aside>
  );
}
