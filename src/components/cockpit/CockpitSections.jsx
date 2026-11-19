"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Table, TableWrap } from "@/components/ui/Misc";
import {
  COLONNES_LIGNES, SOURCES, aFournirParDocument, libellesManquants, statutEntree, valeurAvecUnite
} from "@/lib/cockpit";

/* Données d'entrée du moteur, chacune avec sa source ; celles qui manquent sont signalées.
   onCompleter : ouvre l'étape des questions de l'agent · onDocuments : ouvre le dépôt de pièces */
export function DonneesEntree({ entrees, secteur, onCompleter, onDocuments }) {
  const renseignees = entrees.filter(e => e.statut === "ok").length;
  const aDemander = entrees.filter(e => e.statut === "manquant" && !aFournirParDocument(e));
  const aFournir = entrees.filter(aFournirParDocument);

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
            const statut = statutEntree(e);
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

      {aDemander.length > 0 && onCompleter && (
        <div className="row-between mt">
          <span className="hint">
            À demander au dirigeant : {aDemander.map(e => e.label).join(", ")}.
          </span>
          <button className="btn btn-soft btn-s" type="button" onClick={onCompleter}>
            Compléter via les questions de l&apos;agent →
          </button>
        </div>
      )}
      {aFournir.length > 0 && onDocuments && (
        <div className="row-between mt">
          <span className="hint">
            Seul un document peut fournir : {aFournir.map(e => e.label).join(", ")}.
          </span>
          <button className="btn btn-ghost btn-s" type="button" onClick={onDocuments}>
            Ajouter des documents →
          </button>
        </div>
      )}
    </Card>
  );
}

/* Détail ligne à ligne d'une entrée agrégée (ex. marge sur coûts variables par produit). */
export function DetailLignes({ entree }) {
  const lignes = entree.lignes ?? [];
  const cles = [...new Set(lignes.flatMap(l => Object.keys(l)))];
  const colonnes = [
    ...Object.keys(COLONNES_LIGNES).filter(c => cles.includes(c)),
    ...cles.filter(c => !COLONNES_LIGNES[c])
  ];
  /* Le total s'aligne sous la marge totale, sinon dans la dernière colonne */
  const colTotal = colonnes.includes("marge_totale") ? "marge_totale" : colonnes.at(-1);
  const cellule = (col, v) => {
    if (v === null || v === undefined || v === "") return "—";
    const def = COLONNES_LIGNES[col];
    if (typeof v === "number") return valeurAvecUnite(v, def?.unite);
    return String(v);
  };

  return (
    <Card className="mt">
      <CardHead>
        <h2>Détail — {entree.label}</h2>
        <Badge tone="sky">{lignes.length} ligne{lignes.length > 1 ? "s" : ""}</Badge>
      </CardHead>
      {entree.detail && <p className="hint" style={{ margin: "-8px 0 12px" }}>{entree.detail}</p>}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              {colonnes.map(c => (
                <th key={c} className={COLONNES_LIGNES[c]?.num ? "right" : undefined}>{COLONNES_LIGNES[c]?.label ?? c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} className={l.marge_totale === null || l.marge_totale === undefined ? "is-off" : undefined}>
                {colonnes.map(c => (
                  <td key={c} className={COLONNES_LIGNES[c]?.num || typeof l[c] === "number" ? "right nowrap" : undefined}>
                    {cellule(c, l[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {typeof entree.valeur === "number" && (
            <tfoot>
              <tr>
                {colonnes.map((c, i) => (
                  <td key={c} className={c === colTotal ? "right nowrap" : undefined}>
                    {c === colTotal
                      ? <b>{valeurAvecUnite(entree.valeur, entree.unite)}</b>
                      : i === 0 && <b>Total retenu</b>}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </Table>
      </TableWrap>
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
