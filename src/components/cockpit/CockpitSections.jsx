"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { SOURCES, STATUTS, libellesManquants, valeurAvecUnite } from "@/lib/cockpit";

/* Données d'entrée du moteur, chacune avec sa source ; celles qui manquent sont signalées.
   onCompleter : ouvre l'étape des questions de l'agent */
export function DonneesEntree({ entrees, secteur, onCompleter }) {
  const renseignees = entrees.filter(e => e.statut === "ok").length;
  const aCompleter = entrees.filter(e => e.statut === "manquant").length;

  return (
    <Card className="mt">
      <CardHead>
        <h2>Données d&apos;entrée du moteur</h2>
        <Badge tone="sky">{secteur}</Badge>
        <Badge tone={renseignees === entrees.length ? "ok" : "warn"}>
          {renseignees} / {entrees.length} renseignée{renseignees > 1 ? "s" : ""}
        </Badge>
      </CardHead>

      {entrees.length ? (
        <div className="tend">
          {entrees.map(e => {
            const source = SOURCES[e.source];
            const statut = STATUTS[e.statut];
            return (
              <div className={"tend-cell" + (e.statut === "ok" ? "" : ` is-${e.statut}`)} key={e.cle}>
                <div className="tend-k">{e.label}</div>
                <div className="tend-v">{valeurAvecUnite(e.valeur, e.unite)}</div>
                <div className="tend-src">
                  {statut
                    ? <Badge tone={statut.tone}>{statut.label}</Badge>
                    : source && <Badge tone={source.tone ?? undefined}>{source.label}</Badge>}
                </div>
                {e.detail && <div className="tend-h">{e.detail}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted small">Aucune donnée d&apos;entrée renvoyée par le moteur.</p>
      )}

      {aCompleter > 0 && onCompleter && (
        <div className="row-between mt">
          <span className="hint">
            {aCompleter} donnée{aCompleter > 1 ? "s" : ""} à obtenir du dirigeant : l&apos;agent peut la poser dans son questionnaire.
          </span>
          <button className="btn btn-soft btn-s" type="button" onClick={onCompleter}>
            Compléter via les questions de l&apos;agent →
          </button>
        </div>
      )}
    </Card>
  );
}

/* Indicateurs du moteur : chaque secteur a son indicateur pivot. */
export function Indicateurs({ indicateurs, entrees, secteur }) {
  if (!indicateurs.length) return null;
  return (
    <section className="mt">
      <div className="row mb row-between">
        <h2>Indicateurs du moteur {secteur}</h2>
        <span className="hint">
          Trois moteurs distincts, pas une formule unique adaptée — chaque secteur a son indicateur pivot.
        </span>
      </div>
      <div className="grid g-3">
        {indicateurs.map(ind => {
          const calcule = ind.valeur !== null && ind.valeur !== undefined;
          const manquants = libellesManquants(ind.manquants, entrees);
          return (
            <article className={"card indic reveal" + (ind.pivot ? " indic-pivot" : "") + (calcule ? "" : " is-empty")} key={ind.cle}>
              {ind.pivot && <span className="indic-tag">indicateur pivot</span>}
              <h3 className="indic-title">{ind.nom}</h3>
              <div className="indic-val">{valeurAvecUnite(ind.valeur, ind.unite)}</div>
              {ind.comparaison && <div className="indic-cmp">{ind.comparaison}</div>}
              {!calcule && (
                <div className="indic-cmp">
                  {ind.statut === "non_defini" ? (
                    <Badge tone="ink">formule à définir</Badge>
                  ) : manquants.length ? (
                    <>Manque : <b>{manquants.join(", ")}</b></>
                  ) : (
                    <Badge tone="warn">non calculé</Badge>
                  )}
                </div>
              )}
              {ind.formule && <pre className="indic-formule">{ind.formule}</pre>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* Détail du calcul : tout est traçable, rien n'est saisi à la main. */
export function DetailCalcul({ etapes }) {
  return (
    <Card className="mt">
      <CardHead>
        <h2>Détail du calcul</h2>
        <span className="hand">tout est traçable ✦</span>
      </CardHead>
      <p className="hint" style={{ margin: "-8px 0 14px" }}>
        Chaque étape est calculée par le moteur à partir des données d&apos;entrée : les résultats ne sont jamais
        saisis à la main, seulement recalculés.
      </p>
      {etapes.length ? (
        <div className="calc">
          {etapes.map((e, i) => (
            <div className="calc-step" key={`${i}-${e.libelle}`}>
              <span className="calc-n">{i + 1}</span>
              <span className="calc-lbl">{e.libelle}</span>
              <span className="calc-eq">{e.equation}</span>
              <span className="calc-out">{valeurAvecUnite(e.resultat, e.unite)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted small">Aucune étape de calcul possible avec les données actuelles.</p>
      )}
    </Card>
  );
}

/* Contrôles avant génération du rapport. */
export function Controles({ controles, onValider }) {
  return (
    <Card tint="sky">
      <CardHead><h3>Contrôles avant génération du rapport</h3></CardHead>
      <ul className="checks">
        {controles.map(({ ok, texte }) => (
          <li className={ok ? undefined : "warn"} key={texte}>
            <span className="ic">{ok ? "✓" : "!"}</span>{texte}
          </li>
        ))}
      </ul>
      <button className="btn mt" type="button" onClick={onValider}>Valider les résultats</button>
    </Card>
  );
}
