"use client";

import { useEffect, useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import { IaBlock, IaTag } from "@/components/ui/Ia";
import { Placeholder, Spinner } from "@/components/ui/Misc";
import { PAGES_PREVUES, SECTIONS_RAPPORT } from "@/lib/rapport";

/* Génération en cours : lancée ici (chrono) ou ailleurs (relue toute seule). */
export function GenerationEnCours({ local }) {
  const [secondes, setSecondes] = useState(0);
  useEffect(() => {
    if (!local) return;
    const t = setInterval(() => setSecondes(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [local]);

  return (
    <IaBlock className="rp-gen">
      <div className="row">
        <Spinner />
        <div className="grow">
          <b>Génération du rapport…</b>
          <p className="muted small">
            {local
              ? "Le LLM rédige la synthèse, les commentaires et les 3 leviers à partir du cockpit, puis le PDF est mis en page. Compter une à deux minutes : vous pouvez quitter la page, la génération continue."
              : "Une génération est en cours (lancée depuis une autre page ou un autre onglet). Cette page se met à jour toute seule. Si elle reste bloquée plusieurs minutes, le serveur a pu s'arrêter : le rapport doit alors être repassé en « erreur » côté back."}
          </p>
        </div>
        {local && <span className="mono small faint">{Math.floor(secondes / 60)}:{String(secondes % 60).padStart(2, "0")}</span>}
      </div>
    </IaBlock>
  );
}

/* Aperçu du PDF actuel dans la page. */
export function ApercuPdf({ existe, pdf, onReessayer }) {
  return (
    <Card>
      <CardHead><h2>Aperçu du PDF</h2></CardHead>
      {!existe ? (
        <Placeholder className="rp-vide">
          Aucun rapport généré pour l&apos;instant.<br />Le PDF apparaîtra ici après la première génération.
        </Placeholder>
      ) : pdf.encours ? (
        <Placeholder className="rp-vide"><Spinner /></Placeholder>
      ) : pdf.erreur ? (
        <p className="muted small">
          PDF indisponible : {pdf.erreur}{" "}
          <button className="btn btn-ghost btn-s" type="button" onClick={onReessayer}>Réessayer</button>
        </p>
      ) : pdf.url ? (
        <iframe className="rp-frame" src={pdf.url} title="Aperçu du rapport PDF" />
      ) : null}
    </Card>
  );
}

const Titre = ({ children }) => <h3 className="rp-h">{children}</h3>;

/* Textes rédigés par le LLM pour le PDF actuel, pour relecture sans ouvrir le PDF. */
export function TextesRediges({ content, indicateurs }) {
  const synthese = content.synthese_executive ?? [];
  const points = content.points_cles ?? [];
  const commentaires = content.commentaires_indicateurs ?? [];
  const leviers = content.leviers ?? [];

  return (
    <IaBlock>
      <CardHead>
        <h2>Textes rédigés</h2>
        <IaTag phase={0}>Copilote de rédaction</IaTag>
      </CardHead>
      <p className="hint">
        Textes du PDF actuel. Les chiffres des tableaux viennent du moteur de calcul ; le LLM ne cite que des
        montants présents dans les données de l&apos;audit (vérifié par le back).
      </p>

      {synthese.length > 0 && (
        <>
          <Titre>Synthèse exécutive</Titre>
          {synthese.map((p, i) => <p key={i} className="rp-p">{p}</p>)}
        </>
      )}

      {points.length > 0 && (
        <>
          <Titre>Points clés</Titre>
          <ul className="rp-list">{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </>
      )}

      {content.commentaire_perte && (
        <>
          <Titre>Perte annuelle estimée</Titre>
          <p className="rp-p">{content.commentaire_perte}</p>
        </>
      )}

      {commentaires.length > 0 && (
        <details className="rp-details">
          <summary>Commentaires des indicateurs ({commentaires.length})</summary>
          <dl className="rp-dl">
            {commentaires.map(c => (
              <div key={c.cle}>
                <dt>{indicateurs[c.cle] ?? c.cle}</dt>
                <dd>{c.commentaire}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {leviers.length > 0 && (
        <>
          <Titre>{leviers.length} leviers à 30 jours</Titre>
          <ol className="rp-leviers">
            {leviers.map((l, i) => (
              <li key={i}>
                <b>{l.titre}</b>
                <p className="rp-p">{l.constat}</p>
                {l.actions?.length > 0 && (
                  <ul className="rp-list">{l.actions.map((a, j) => <li key={j}>{a}</li>)}</ul>
                )}
                {l.gain_attendu && <p className="small"><b>Gain attendu :</b> {l.gain_attendu}</p>}
                {l.indicateur_suivi && <p className="small"><b>Suivi à 30 jours :</b> {l.indicateur_suivi}</p>}
              </li>
            ))}
          </ol>
        </>
      )}

      {content.message_conclusion && (
        <>
          <Titre>Conclusion</Titre>
          <p className="rp-p">{content.message_conclusion}</p>
        </>
      )}
    </IaBlock>
  );
}

/* Plan du PDF (fixé par le back). */
export function CompositionRapport({ pages }) {
  return (
    <Card>
      <CardHead>
        <h3>Composition du rapport</h3>
        <span className="hand">{pages ? `${pages} pages` : `${PAGES_PREVUES} pages prévues`} 📄</span>
      </CardHead>
      <ul className="sections">
        {SECTIONS_RAPPORT.map(([titre, source], i) => (
          <li key={titre}>
            <span className="sec-n">{i + 1}</span>
            <span className="grow">
              {titre}<br />
              <span className="sec-src">source : {source}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="hint mt-s">Aucune mention interne dans le PDF : une méthode non fixée y est « en cours de finalisation ».</p>
    </Card>
  );
}
