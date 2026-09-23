"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Bar } from "@/components/ui/Misc";
import { IaTag } from "@/components/ui/Ia";

export const SECTIONS_RAPPORT = [
  ["Couverture & synthèse dirigeant", "Copilote de rédaction"],
  ["Contexte de l'entreprise", "fiche Client + API publique"],
  ["Méthodologie de l'audit", "base de connaissance métier"],
  ["Score de fuite global & jauge", "moteur de calcul"],
  ["Coût horaire chargé réel (CHr)", "moteur BTP"],
  ["Écart de facturation main-d'œuvre", "moteur BTP"],
  ["Risque BFR & délais de paiement", "moteur BTP + veille LME"],
  ["Comparatif marché local", "clustering d'entreprises comparables"],
  ["3 leviers d'optimisation à 30 jours", "agent de recommandation (playbooks)"],
  ["Limites méthodologiques", "facteur d'extrapolation annuelle"],
  ["Prochaines étapes & CTA Calendly", "argumentaire commercial"]
];

export const ETAPES_GENERATION = [
  { k: "collect", titre: "Collecte des résultats validés", desc: "indicateurs sectoriels + score de fuite" },
  { k: "redac", titre: "Rédaction par le Copilote", desc: "RAG sur la base de connaissance métier Alumny" },
  { k: "leviers", titre: "Sélection des 3 leviers à 30 jours", desc: "RAG sur les playbooks consultants" },
  { k: "mep", titre: "Mise en page & charte", desc: "couverture, jauge, graphique comparatif, CTA Calendly" },
  { k: "pdf", titre: "Export PDF versionné", desc: "l'historique des versions est conservé" }
];

export function CompositionRapport() {
  return (
    <Card>
      <CardHead><h2>Composition du rapport</h2><span className="hand">10-12 pages 📄</span></CardHead>
      <ul className="sections">
        {SECTIONS_RAPPORT.map(([titre, source], i) => (
          <li key={titre}>
            <span className="sec-n">{i + 1}</span>
            <span className="grow">
              {titre}<br />
              <span className="sec-src">source : {source}</span>
            </span>
            <Badge tone="ok">incluse</Badge>
          </li>
        ))}
      </ul>
      <p className="hint mt-s">
        L&apos;agent de mise en page applique des règles simples au départ
        (Phase 2 : affinées avec le retour des consultants).
      </p>
    </Card>
  );
}

/* etat : { encours, index } — index = nombre d'étapes déjà terminées ;
   quand `encours` est vrai, l'étape d'indice `index` est celle en cours. */
export function GenerationRapport({ etat }) {
  const total = ETAPES_GENERATION.length;
  const fini = !etat.encours && etat.index === total;

  const classe = i => {
    if (etat.encours && i === etat.index) return "is-run";
    return i < etat.index ? "is-ok" : "";
  };

  return (
    <Card>
      <CardHead>
        <h2>Génération</h2>
        <IaTag phase={0}>Copilote de rédaction</IaTag>
        <IaTag phase={2}>Mise en page dynamique</IaTag>
        <Badge tone={etat.encours ? "warn" : fini ? "ok" : "ink"}>
          {etat.encours ? "génération en cours" : fini ? "terminé" : "prêt"}
        </Badge>
      </CardHead>

      <ol className="gen-steps">
        {ETAPES_GENERATION.map((e, i) => (
          <li key={e.k} className={classe(i)}>
            <b>{e.titre}</b>
            <span>{e.desc}</span>
          </li>
        ))}
      </ol>

      <Bar className="mt" value={Math.round(etat.index / total * 100)} />
    </Card>
  );
}
