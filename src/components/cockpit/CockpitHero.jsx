"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { CardHead } from "@/components/ui/Card";
import { IaBlock, IaSrc, IaTag } from "@/components/ui/Ia";
import { useAnimatedNumber } from "@/lib/hooks";
import { groupe } from "@/lib/format";
import { STATUTS, libellesManquants, valeurAvecUnite } from "@/lib/cockpit";

const couleurScore = s => (s < 50 ? "var(--bad)" : s < 75 ? "var(--warn)" : "var(--ok)");

/* Contenu pas encore calculé par le moteur : valeurs d'exemple, signalées comme telles. */
export const Illustratif = ({ raison }) => (
  <Badge tone="ink" className="illus" title={raison}>illustratif</Badge>
);

/* Jauge circulaire : le dégradé conique suit le score animé.
   illustratif : le score ne vient pas du moteur (formule à définir). */
function Jauge({ score, illustratif }) {
  const anime = useAnimatedNumber(score);
  const couleur = illustratif ? "var(--ink-faint)" : couleurScore(score);

  return (
    <div className={"hero-gauge" + (illustratif ? " is-illus" : "")}>
      {illustratif && <Illustratif raison="Formule du score de santé à définir" />}
      <div
        className="gauge"
        style={{ background: `conic-gradient(${couleur} ${anime * 3.6}deg, #eef1f8 ${anime * 3.6}deg)` }}
        role="img"
        aria-label={`Score de santé${illustratif ? " (exemple)" : ""} : ${score} sur 100`}
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
      <p className="hint center">
        {illustratif
          ? "Exemple : la formule du score de santé reste à définir."
          : "Seuils de couleur définis dans les Paramètres sectoriels."}
      </p>
    </div>
  );
}

/* Perte sèche annuelle calculée par le moteur, avec ses composantes. */
function Montant({ perte, entrees }) {
  const valeur = perte?.valeur ?? null;
  const anime = useAnimatedNumber(valeur ?? 0);
  const composantes = perte?.composantes ?? [];
  const nonCalculees = composantes.filter(c => c.valeur === null || c.valeur === undefined).length;

  return (
    <div className="hero-money">
      <p className="hand">Perte sèche annuelle estimée</p>
      <div className={"money" + (valeur === null ? " is-empty" : "")}>
        {valeur === null ? "—" : `${groupe(anime)} €`}
      </div>
      <p className="muted small">
        {valeur === null
          ? "Pas encore calculable : il manque des données ou des méthodes de calcul (détail ci-dessous)."
          : <>soit <b>{groupe(Math.round(valeur / 12))} €</b> par mois{perte.partielle ? " — montant partiel" : ""}.</>}
      </p>

      {composantes.length > 0 && (
        <div className="extrap">
          <span className="lbl">Composantes</span>
          <ul className="perte-list">
            {composantes.map(c => (
              <li key={c.cle}>
                <span>{c.label}</span>
                {c.valeur !== null && c.valeur !== undefined ? (
                  <b>{valeurAvecUnite(c.valeur, "€")}</b>
                ) : (
                  <Badge tone={STATUTS[c.statut]?.tone ?? "ink"}
                    title={c.manquants?.length ? `Manque : ${libellesManquants(c.manquants, entrees).join(", ")}` : undefined}>
                    {STATUTS[c.statut]?.label ?? "non calculé"}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
          {nonCalculees > 0 && valeur !== null && (
            <p className="hint">
              {nonCalculees} composante{nonCalculees > 1 ? "s" : ""} pas encore calculée{nonCalculees > 1 ? "s" : ""} :
              le montant réel est au moins celui affiché.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* Comparatif marché local : illustratif tant que la source des benchmarks n'est pas définie. */
function Comparatif({ bench, secteur }) {
  /* Les barres repartent de zéro à chaque changement de moteur. */
  const [rempli, setRempli] = useState(false);
  useEffect(() => {
    setRempli(false);
    const id = requestAnimationFrame(() => setRempli(true));
    return () => cancelAnimationFrame(id);
  }, [secteur]);

  return (
    <div className="hero-bench is-illus">
      <CardHead>
        <h3>Comparatif marché local</h3>
        <IaTag phase={0}>Clustering</IaTag>
        <Illustratif raison="Source des benchmarks sectoriels à définir" />
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
        Exemple : la source des benchmarks (marché local Charente, Vienne, Nouvelle-Aquitaine) reste à définir.
      </p>
    </div>
  );
}

/* cockpit : réponse du moteur · illustratif : contenus d'exemple du secteur (data/moteurs.js) */
export default function CockpitHero({ cockpit, illustratif, secteur }) {
  const score = cockpit.score_sante;
  const scoreCalcule = typeof score === "number";
  return (
    <section className="hero">
      <Jauge score={scoreCalcule ? score : illustratif.score} illustratif={!scoreCalcule} key={`g-${secteur}`} />
      <Montant perte={cockpit.perte_annuelle} entrees={cockpit.entrees} />
      <Comparatif bench={illustratif.bench} secteur={secteur} />
    </section>
  );
}
