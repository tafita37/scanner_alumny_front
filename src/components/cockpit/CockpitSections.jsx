"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { IaTag } from "@/components/ui/Ia";

/* Étape préalable : la valeur tendancielle de référence du secteur. */
export function ValeurTendancielle({ tend, secteur }) {
  return (
    <Card className="mt">
      <CardHead>
        <h2>Étape préalable — valeur tendancielle de référence</h2>
        <Badge tone="sky">{secteur}</Badge>
      </CardHead>
      <div className="tend">
        {tend.map(([k, v, h], i) => (
          <div className={"tend-cell" + (i === tend.length - 1 ? " res" : "")} key={k}>
            <div className="tend-k">{k}</div>
            <div className="tend-v">{v}</div>
            <div className="tend-h">{h}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* Indicateurs du moteur : chaque secteur a son indicateur pivot. */
export function Indicateurs({ indics, secteur }) {
  return (
    <section className="mt">
      <div className="row mb row-between">
        <h2>Indicateurs du moteur {secteur}</h2>
        <span className="hint">
          Trois moteurs distincts, pas une formule unique adaptée — chaque secteur a son indicateur pivot.
        </span>
      </div>
      <div className="grid g-3">
        {indics.map(ind => (
          <article className={"card indic reveal" + (ind.pivot ? " indic-pivot" : "")} key={ind.nom}>
            {ind.pivot && <span className="indic-tag">indicateur pivot</span>}
            <h3 className="indic-title">{ind.nom}</h3>
            <div className="indic-val">{ind.val}</div>
            <div className="indic-cmp">{ind.cmp}</div>
            <pre className="indic-formule">{ind.formule}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}

/* Détail du calcul : tout est traçable, rien n'est saisi à la main. */
export function DetailCalcul({ calc }) {
  return (
    <Card className="mt">
      <CardHead>
        <h2>Détail du calcul</h2>
        <span className="hand">tout est traçable ✦</span>
        <span className="grow" />
        <IaTag phase={2}>Score appris</IaTag>
      </CardHead>
      <p className="hint" style={{ margin: "-8px 0 14px" }}>
        Aujourd&apos;hui : pondération fixe paramétrée en base. À terme, un modèle supervisé entraîné sur
        l&apos;historique Alumny remplacera cette pondération manuelle — et le coefficient d&apos;improductivité
        de 20 % sera lui aussi estimé plutôt que déclaré.
      </p>
      <div className="calc">
        {calc.map(([titre, equation, resultat], i) => (
          <div className="calc-step" key={titre}>
            <span className="calc-n">{i + 1}</span>
            <span className="calc-lbl">{titre}</span>
            <span className="calc-eq">{equation}</span>
            <span className="calc-out">{resultat}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
