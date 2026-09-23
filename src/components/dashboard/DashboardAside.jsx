"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DOSSIERS, SECTEURS } from "@/data/al";
import Card, { CardHead } from "@/components/ui/Card";
import { IaBlock, IaSrc, IaTag, IaPhase } from "@/components/ui/Ia";
import { Bar } from "@/components/ui/Misc";

const A_TRAITER = [
  { ico: "▤", client: "Métal Ouest", quoi: "Bilan comptable manquant — relance envoyée il y a 2 j", cta: ["Ouvrir", "/documents"] },
  { ico: "⚠", client: "Néo Conseil", quoi: "2 champs extraits en faible confiance à valider", cta: ["Vérifier", "/documents"] },
  { ico: "▥", client: "Bâti Duran SARL", quoi: "Résultats validés — rapport non généré", cta: ["Générer", "/rapports"] }
];

const SIGNAUX = [
  ["Anomalie", "Métal Ouest — 1 facture s'écarte de 3,2 σ du profil du dossier", "P1 · Isolation Forest", 1],
  ["Réglementaire", "2 dossiers BTP au-delà du plafond LME de 60 jours", "P0 · veille réglementaire", 0],
  ["Défaillance", "Plasturgie Rhône — Z-score 1,87, zone de risque élevé", "P0 · Altman Z-score", 0]
];

const JOURNAL = [
  [<><b>Tafita A.</b> a généré le rapport <i>Toiture &amp; Fils v2</i></>, "il y a 1 h"],
  [<><b>Agent d&apos;extraction</b> a traité 3 devis (Bâti Duran)</>, "il y a 3 h"],
  [<><b>Job RGPD</b> a purgé 1 fiche nominative (dernier dossier &gt; 3 ans)</>, "hier, 03:00"],
  [<><b>Ny Aina R.</b> a modifié le coefficient d&apos;improductivité BTP (20 % → 22 %)</>, "hier"]
];

const TEINTES = { BTP: undefined, Services: "sky", Industrie: "gold" };

export default function DashboardAside() {
  /* Les barres partent de 0 pour rejouer l'animation de la maquette. */
  const [rempli, setRempli] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRempli(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <aside className="col gap-l">
      <Card tint="blue">
        <CardHead>
          <h3>À traiter en priorité</h3>
          <IaTag phase={0}>Priorisation</IaTag>
        </CardHead>
        <ul className="todo">
          {A_TRAITER.map(t => (
            <li key={t.client}>
              <span className="todo-ico">{t.ico}</span>
              <span className="grow">
                <b>{t.client}</b><br />
                <span className="small muted">{t.quoi}</span>
              </span>
              <Link className="btn btn-soft btn-s" href={t.cta[1]}>{t.cta[0]}</Link>
            </li>
          ))}
        </ul>
      </Card>

      <IaBlock>
        <CardHead><h3>Signaux détectés sur le portefeuille</h3></CardHead>
        <ul className="signaux">
          {SIGNAUX.map(([cat, texte, source, phase]) => (
            <li key={cat}>
              <div className="row-between"><b>{cat}</b><IaPhase phase={phase} /></div>
              {texte}<span>{source}</span>
            </li>
          ))}
        </ul>
        <IaSrc>détection d&apos;anomalies (Isolation Forest) + veille réglementaire · signaux indicatifs, à vérifier</IaSrc>
      </IaBlock>

      <Card>
        <CardHead><h3>Répartition par secteur</h3></CardHead>
        <div className="sect-bars">
          {SECTEURS.map(s => {
            const n = DOSSIERS.filter(d => d.secteur === s).length;
            const pct = Math.round(n / DOSSIERS.length * 100);
            return (
              <div className="sect-row" key={s}>
                <div className="row"><span>{s}</span><b>{n} dossier{n > 1 ? "s" : ""}</b></div>
                <Bar value={rempli ? pct : 0} tint={TEINTES[s]} />
              </div>
            );
          })}
        </div>
        <p className="hint mt-s">Volume de dossiers 2026, tous statuts confondus.</p>
      </Card>

      <Card tint="gold">
        <CardHead><h3>Journal d&apos;activité</h3></CardHead>
        <ol className="feed">
          {JOURNAL.map(([texte, quand], i) => (
            <li key={i}>{texte}<span className="feed-t">{quand}</span></li>
          ))}
        </ol>
      </Card>
    </aside>
  );
}
