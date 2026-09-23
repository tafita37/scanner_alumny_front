"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardHead } from "@/components/ui/Card";
import { IaBlock, IaSrc, IaTag } from "@/components/ui/Ia";
import { useAnimatedNumber } from "@/lib/hooks";
import { groupe } from "@/lib/format";

const couleurScore = s => (s < 50 ? "var(--bad)" : s < 75 ? "var(--warn)" : "var(--ok)");

/* Jauge circulaire : le dégradé conique suit le score animé. */
function Jauge({ score }) {
  const anime = useAnimatedNumber(score);
  const couleur = couleurScore(score);

  return (
    <div className="hero-gauge">
      <div
        className="gauge"
        style={{ background: `conic-gradient(${couleur} ${anime * 3.6}deg, #eef1f8 ${anime * 3.6}deg)` }}
        role="img"
        aria-label={`Score de santé : ${score} sur 100`}
      >
        <div className="gauge-in">
          <span className="gauge-val" style={{ color: couleur }}>{anime}</span>
          <span className="gauge-sub">score / 100</span>
        </div>
      </div>
      <div className="gauge-legend">
        <span><i style={{ background: "var(--bad)" }} />0-49 critique</span>
        <span><i style={{ background: "var(--warn)" }} />50-74 à surveiller</span>
        <span><i style={{ background: "var(--ok)" }} />75-100 sain</span>
      </div>
      <p className="hint center">Seuils de couleur définis dans les Paramètres sectoriels.</p>
    </div>
  );
}

function Montant({ fuite, facteur }) {
  const anime = useAnimatedNumber(fuite);

  return (
    <div className="hero-money">
      <p className="hand">Perte sèche annuelle estimée</p>
      <div className="money">{groupe(anime)} €</div>
      <p className="muted small">
        soit <b>{groupe(Math.round(fuite / 12))} €</b> par mois — seul indicateur commun aux trois secteurs.
      </p>
      <div className="extrap">
        <span className="lbl">Extrapolation annuelle</span>
        <p className="small">
          Calcul basé sur <b>3 devis</b> déposés, extrapolé via le facteur sectoriel <b>{facteur}</b>{" "}
          (Paramètres sectoriels).
        </p>
        <p className="hint">Point méthodologique fragile : à documenter dans le rapport et à réajuster souvent.</p>
      </div>
    </div>
  );
}

function Comparatif({ bench, secteur }) {
  /* Les barres repartent de zéro à chaque changement de moteur. */
  const [rempli, setRempli] = useState(false);
  useEffect(() => {
    setRempli(false);
    const id = requestAnimationFrame(() => setRempli(true));
    return () => cancelAnimationFrame(id);
  }, [secteur]);

  return (
    <div className="hero-bench">
      <CardHead>
        <h3>Comparatif marché local</h3>
        <IaTag phase={0}>Clustering</IaTag>
      </CardHead>

      <div className="bench">
        {bench.map(([label, pct, valeur], i) => (
          <div className={"bench-row" + (i === 0 ? " moi" : "")} key={label}>
            <span className="bench-lbl">{label}</span>
            <span className="bench-bar"><i style={{ width: rempli ? `${pct}%` : 0 }} /></span>
            <span className="bench-val">{valeur}</span>
          </div>
        ))}
      </div>

      <IaBlock className="mt" style={{ padding: "12px 14px" }}>
        <div className="row-between" style={{ gap: 10 }}>
          <span className="small"><b>Risque de défaillance</b> · Z-score <b>2,41</b> — zone grise</span>
          <Link className="btn btn-ghost btn-s" href="/intelligence">Voir le cluster</Link>
        </div>
        <IaSrc>Altman Z-score calibré secteur · signal indicatif interne, non affiché au client</IaSrc>
      </IaBlock>

      <p className="hint mt-s">
        Cluster d&apos;entreprises comparables construit sur données SIRENE / Pappers publiques.
      </p>
    </div>
  );
}

export default function CockpitHero({ moteur, secteur }) {
  return (
    <section className="hero">
      <Jauge score={moteur.score} key={`g-${secteur}`} />
      <Montant fuite={moteur.fuite} facteur={moteur.facteur} key={`m-${secteur}`} />
      <Comparatif bench={moteur.bench} secteur={secteur} />
    </section>
  );
}
