"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import { IaSrc } from "@/components/ui/Ia";
import { Spinner } from "@/components/ui/Misc";
import {
  MAX_TEXTE, STATUT_QUESTION, TYPES_NUMERIQUES, aProposition, depuisSaisie, formaterReponse, uniteQuestion, versSaisie
} from "@/lib/questionnaire";

/* Champ de saisie adapté au type de réponse attendu. */
function Saisie({ q, valeur, onChange, onValider, disabled, id }) {
  const entree = e => { if (e.key === "Enter") { e.preventDefault(); onValider(); } };

  if (TYPES_NUMERIQUES.includes(q.answer_type)) {
    const unite = uniteQuestion(q);
    return (
      <div className="qa-unit">
        <input type="text" id={id} inputMode="decimal" disabled={disabled} value={valeur} onKeyDown={entree}
          placeholder={q.answer_type === "montant" ? "ex. 12 500" : "ex. 35"} onChange={e => onChange(e.target.value)} />
        {unite && <span>{unite}</span>}
      </div>
    );
  }
  if (q.answer_type === "date") {
    return <input type="date" id={id} disabled={disabled} value={valeur} onKeyDown={entree} onChange={e => onChange(e.target.value)} />;
  }
  if (q.answer_type === "oui_non") {
    return (
      <div className="row gap-s wrap" role="radiogroup">
        <Chip active={valeur === true} disabled={disabled} onClick={() => onChange(true)}>Oui</Chip>
        <Chip active={valeur === false} disabled={disabled} onClick={() => onChange(false)}>Non</Chip>
      </div>
    );
  }
  if (q.answer_type === "choix") {
    return (
      <div className="row gap-s wrap" role="radiogroup">
        {(q.choices ?? []).map(c => (
          <Chip key={c} active={valeur === c} disabled={disabled} onClick={() => onChange(c)}>{c}</Chip>
        ))}
      </div>
    );
  }
  return (
    <>
      <textarea id={id} disabled={disabled} value={valeur} maxLength={MAX_TEXTE} rows={3}
        placeholder="Votre réponse…" onChange={e => onChange(e.target.value)} />
      <span className="hint right">{valeur.length} / {MAX_TEXTE}</span>
    </>
  );
}

/* Une question de l'agent : proposition éventuelle, saisie, réponse enregistrée.
   variable : libellé de l'entrée du cockpit qu'alimente la réponse (null si aucune)
   verrouillee : le tour suivant a été généré, la réponse ne peut plus changer.
   onRepondre(body) → Promise<message d'erreur | null> */
export default function QuestionAgent({ q, numero, variable, verrouillee, documents, envoi, onRepondre }) {
  const [edition, setEdition] = useState(q.status === "en_attente");
  const [saisie, setSaisie] = useState(() => versSaisie(q, q.answer));
  const [erreur, setErreur] = useState(null);

  const statut = STATUT_QUESTION[q.status] ?? STATUT_QUESTION.en_attente;
  const enEdition = edition && !verrouillee;
  const proposition = aProposition(q);
  const corrigee = q.status === "repondue" && proposition
    && JSON.stringify(q.answer) !== JSON.stringify(q.suggested_answer);
  const docs = (q.document_ids ?? []).map(id => documents[id] ?? `Document n° ${id}`);
  const idChamp = `qa-${q.id}`;

  const envoyer = async body => {
    setErreur(null);
    const err = await onRepondre(body);
    if (err) {
      setErreur(err);
      return;
    }
    setEdition(body.status === "en_attente");
    if (body.status === "repondue") setSaisie(versSaisie(q, body.answer));
    if (body.status === "en_attente") setSaisie(versSaisie(q, null));
  };

  const enregistrer = () => {
    const { valeur, erreur: e } = depuisSaisie(q, saisie);
    if (e) {
      setErreur(e);
      return;
    }
    envoyer({ status: "repondue", answer: valeur });
  };

  const annulerEdition = () => {
    setErreur(null);
    setSaisie(versSaisie(q, q.answer));
    setEdition(false);
  };

  return (
    <article className={`qa qa-${q.status}${enEdition ? " is-edit" : ""}`}>
      <div className="qa-head">
        <span className="qa-n">{numero}</span>
        <div className="grow">
          <h3 className="qa-label">{q.label}</h3>
          {q.rationale && <p className="qa-why">{q.rationale}</p>}
          {variable && <p className="qa-var">◈ alimente le cockpit : <b>{variable}</b></p>}
          {docs.length > 0 && (
            <p className="qa-docs">
              {docs.map((nom, i) => <span key={q.document_ids[i]} title={nom}>📄 {nom}</span>)}
            </p>
          )}
        </div>
        <Badge tone={statut.tone} dot>{statut.label}</Badge>
      </div>

      {enEdition ? (
        <div className="qa-body">
          {proposition && (
            <div className="ia-out qa-sugg">
              <div className="row-between">
                <span>
                  <span className="qa-sugg-t">Proposition de l&apos;agent</span>{" "}
                  <b>{formaterReponse(q, q.suggested_answer)}</b>
                </span>
                <button className="btn btn-gold btn-s" type="button" disabled={envoi}
                  onClick={() => envoyer({ status: "repondue", answer: q.suggested_answer })}>
                  Confirmer
                </button>
              </div>
              {q.suggested_answer_source && <IaSrc>{q.suggested_answer_source}</IaSrc>}
            </div>
          )}

          <div className={`field${erreur ? " is-err" : ""}`}>
            <label htmlFor={idChamp}>{proposition ? "Ou corrigez :" : "Votre réponse"}</label>
            <Saisie q={q} id={idChamp} valeur={saisie} onChange={setSaisie} onValider={enregistrer} disabled={envoi} />
            {erreur && <span className="hint hint-err">{erreur}</span>}
          </div>

          <div className="row-end">
            {envoi && <Spinner />}
            {q.status !== "en_attente" && (
              <button className="btn btn-ghost btn-s" type="button" disabled={envoi} onClick={annulerEdition}>Annuler</button>
            )}
            {q.status !== "ignoree" && (
              <button className="btn btn-ghost btn-s" type="button" disabled={envoi}
                onClick={() => envoyer({ status: "ignoree" })}>
                Ignorer
              </button>
            )}
            <button className="btn btn-s" type="button" disabled={envoi} onClick={enregistrer}>Enregistrer</button>
          </div>
        </div>
      ) : (
        <div className="qa-body qa-done">
          <div className="grow">
            {q.status === "repondue" && (
              <>
                <span className="qa-answer">Réponse : <b>{formaterReponse(q, q.answer)}</b></span>
                {proposition && (
                  <span className="hint">
                    {corrigee
                      ? <> · corrige la proposition de l&apos;agent ({formaterReponse(q, q.suggested_answer)})</>
                      : <> · proposition de l&apos;agent confirmée</>}
                  </span>
                )}
              </>
            )}
            {q.status === "ignoree" && <span className="qa-answer muted">Question ignorée, sans réponse.</span>}
            {q.status === "en_attente" && <span className="qa-answer muted">Sans réponse.</span>}
            {erreur && <span className="hint hint-err qa-err">{erreur}</span>}
          </div>
          {!verrouillee && (
            <div className="row-end">
              {envoi && <Spinner />}
              <button className="btn btn-ghost btn-s" type="button" disabled={envoi}
                onClick={() => envoyer({ status: "en_attente" })}>
                Remettre en attente
              </button>
              <button className="btn btn-soft btn-s" type="button" disabled={envoi} onClick={() => setEdition(true)}>
                {q.status === "ignoree" ? "Répondre" : "Modifier"}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
