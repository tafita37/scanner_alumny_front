"use client";

import { useEffect, useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import { IaBlock, IaTag } from "@/components/ui/Ia";
import { Bar, Spinner } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import QuestionAgent from "@/components/questionnaire/QuestionAgent";
import { useQuestionnaire } from "@/components/questionnaire/useQuestionnaire";
import { useUi } from "@/context/UiContext";
import { groupe } from "@/lib/format";
import { decompte, formaterReponse, libelleTool, resumeArguments, STATUT_QUESTION } from "@/lib/questionnaire";

const pluriel = (n, mot, motPluriel = `${mot}s`) => `${n} ${n > 1 ? motPluriel : mot}`;

/* Génération en cours. local : lancée depuis cette page (on affiche le temps écoulé). */
function GenerationEnCours({ local, numero }) {
  const [secondes, setSecondes] = useState(0);
  useEffect(() => {
    if (!local) return;
    const t = setInterval(() => setSecondes(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [local]);

  return (
    <IaBlock className="qn-gen">
      <div className="row">
        <Spinner />
        <div className="grow">
          <b>{numero ? `Génération du tour ${numero}…` : "Génération des questions…"}</b>
          <p className="muted small">
            {local
              ? "L'agent fouille les documents extraits et vos réponses précédentes, fait ses calculs, puis rédige ses questions. Cela peut prendre jusqu'à deux minutes."
              : "Un tour est en cours de génération (lancé depuis une autre page ou un autre onglet). Cette page se met à jour toute seule."}
          </p>
        </div>
        {local && <span className="mono small faint">{Math.floor(secondes / 60)}:{String(secondes % 60).padStart(2, "0")}</span>}
      </div>
    </IaBlock>
  );
}

/* Recherches, lectures et calculs de l'agent pendant la génération d'un tour (connus seulement juste après). */
function Enquete({ appels }) {
  if (!appels?.length) return null;
  return (
    <details className="qn-enquete">
      <summary>Enquête de l&apos;agent · {pluriel(appels.length, "opération")}</summary>
      <ol>
        {appels.map((a, i) => (
          <li key={i}><b>{libelleTool(a)}</b> <span className="mono tiny">{resumeArguments(a.arguments)}</span></li>
        ))}
      </ol>
    </details>
  );
}

const Tokens = ({ tour }) => (tour.input_tokens || tour.output_tokens ? (
  <span className="tiny faint">{groupe(tour.input_tokens)} tokens lus · {groupe(tour.output_tokens)} générés</span>
) : null);

/* Tour déjà verrouillé (le suivant a été généré) : lecture seule, replié. */
function TourPrecedent({ tour }) {
  const c = decompte(tour.questions);
  return (
    <details className="qn-old">
      <summary>
        <b>Tour {tour.round_number}</b>
        <span className="small muted">
          {pluriel(tour.questions.length, "question")} · {pluriel(c.repondue, "répondue")} · {pluriel(c.ignoree, "ignorée")}
        </span>
      </summary>
      {tour.analysis && <p className="small muted qn-old-analysis">{tour.analysis}</p>}
      <ol className="qn-old-list">
        {tour.questions.map(q => (
          <li key={q.id}>
            <span>{q.label}</span>
            <span className="small">
              {q.status === "repondue"
                ? <b>{formaterReponse(q, q.answer)}</b>
                : <Badge tone={STATUT_QUESTION[q.status]?.tone}>{STATUT_QUESTION[q.status]?.label}</Badge>}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

/* Étape 3 du dossier d'audit : questionnaire adaptatif de l'agent IA.
   Les tours se suivent : quand toutes les questions d'un tour sont répondues ou ignorées, le consultant
   valide le tour et l'agent en génère un nouveau à partir des réponses. Un tour sans question clôt le questionnaire.
   onSuivant : passe au cockpit */
export default function EtapeQuestions({ auditId, onSuivant }) {
  const { toast, openModal, closeModal } = useUi();
  const {
    tours, termine, chargement, generation, enCoursAilleurs, enquetes, documents, envois, recharger, generer, repondre
  } = useQuestionnaire({ auditId, toast });

  const toursOk = tours.filter(t => t.status === "ok");
  const dernierOk = toursOk.at(-1) ?? null;
  const dernier = tours.at(-1) ?? null;
  const courant = dernierOk?.questions.length ? dernierOk : null;
  const precedents = toursOk.filter(t => t !== courant && t.questions.length).reverse();
  const c = courant ? decompte(courant.questions) : null;
  const traitees = c ? c.repondue + c.ignoree : 0;

  const enCours = generation.encours || enCoursAilleurs;
  const enErreur = !enCours && !termine && (dernier?.status === "erreur" || Boolean(generation.erreur));
  /* Réponses figées dès qu'un tour suivant est en cours ou généré (un tour en erreur ne compte pas) */
  const verrouille = enCours || (dernier !== courant && dernier?.status !== "erreur");
  const peutValider =Boolean(courant) && c.en_attente === 0 && !enCours && !termine && dernier === courant && !generation.erreur;
  const prochainNumero = (dernierOk?.round_number ?? 0) + 1;

  const passerAuCockpit = () => {
    if (termine) {
      onSuivant();
      return;
    }
    openModal(
      <>
        <h2>Passer au cockpit ?</h2>
        <p>
          {enCours
            ? "Un tour de questions est en cours de génération. "
            : courant && c.en_attente
              ? `${pluriel(c.en_attente, "question reste", "questions restent")} sans réponse. `
              : "L'agent n'a pas terminé son questionnaire. "}
          Les réponses déjà enregistrées sont conservées et vous pourrez revenir à cette étape pour continuer.
        </p>
        <ModalActions>
          <button className="btn btn-ghost" type="button" onClick={closeModal}>Rester sur les questions</button>
          <button className="btn" type="button" onClick={() => { closeModal(); onSuivant(); }}>Passer au cockpit</button>
        </ModalActions>
      </>
    );
  };

  return (
    <div className="col gap-l">
      <Card>
        <CardHead>
          <h2>Questions de l&apos;agent</h2>
          <IaTag phase={1}>Questionnaire adaptatif</IaTag>
          {termine && <Badge tone="ok" dot>terminé</Badge>}
        </CardHead>
        <p className="muted small">
          L&apos;agent a lu les documents extraits et pose des questions ciblées sur ce qui manque pour chiffrer les
          pertes. Quand il a trouvé un indice dans les documents, il propose une réponse : confirmez-la ou corrigez-la.
          Ignorez les questions sans réponse ; chaque nouveau tour tient compte des réponses du précédent.
        </p>
      </Card>

      {chargement.encours ? (
        <div className="row muted"><Spinner /> Chargement du questionnaire…</div>
      ) : chargement.erreur ? (
        <Note tone="bad" ico="⚠">
          {chargement.erreur}{" "}
          <button className="btn btn-ghost btn-s" type="button" onClick={recharger}>Réessayer</button>
        </Note>
      ) : (
        <>
          {enCours && <GenerationEnCours local={generation.encours} numero={prochainNumero} />}

          {enErreur && (
            <div className="note note-bad">
              <span className="note-ico">⚠</span>
              <div>
                <b>{generation.erreur ?? `Le tour ${dernier.round_number} n'a pas pu être généré.`}</b>
                {generation.errors.length > 0 && (
                  <ul className="qn-errors">{generation.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                )}
                <div className="mt-s">
                  <button className="btn btn-s" type="button" onClick={generer}>Relancer la génération</button>
                </div>
              </div>
            </div>
          )}

          {!tours.length && !enCours && !enErreur && (
            <Note tone="blue" ico="ⓘ">
              Aucune question générée pour cet audit.{" "}
              <button className="btn btn-s" type="button" onClick={generer}>Générer les questions</button>
            </Note>
          )}

          {termine && (
            <IaBlock>
              <CardHead>
                <h3>Questionnaire terminé</h3>
                <Badge tone="ok" dot>{precedents.length ? pluriel(precedents.length, "tour") : "aucune question"}</Badge>
              </CardHead>
              <p className="small">L&apos;agent n&apos;a plus de question : les réponses alimentent le cockpit du dossier.</p>
              {dernierOk?.analysis && <div className="ia-out mt-s qn-analysis">{dernierOk.analysis}</div>}
              <Enquete appels={enquetes[dernierOk?.id]} />
            </IaBlock>
          )}

          {courant && (
            <Card>
              <CardHead>
                <h2>Tour {courant.round_number}</h2>
                <Badge tone={c.en_attente ? "warn" : "ok"}>
                  {traitees} / {courant.questions.length} traitée{traitees > 1 ? "s" : ""}
                </Badge>
                <Tokens tour={courant} />
              </CardHead>
              <Bar value={traitees / courant.questions.length * 100} tint={c.en_attente ? undefined : "gold"} />

              {courant.analysis && (
                <IaBlock className="mt">
                  <span className="lbl">Analyse de l&apos;agent</span>
                  <p className="small qn-analysis">{courant.analysis}</p>
                  <Enquete appels={enquetes[courant.id]} />
                </IaBlock>
              )}

              <div className="col gap-s mt">
                {courant.questions.map((q, i) => (
                  <QuestionAgent
                    key={q.id}
                    q={q}
                    numero={i + 1}
                    verrouillee={verrouille}
                    documents={documents}
                    envoi={Boolean(envois[q.id])}
                    onRepondre={body => repondre(q.id, body)}
                  />
                ))}
              </div>

              {dernier === courant && !termine && (
                <div className="row-between mt">
                  <span className="hint">
                    {c.en_attente
                      ? `Encore ${pluriel(c.en_attente, "question")} à traiter (répondre ou ignorer) avant de passer au tour suivant.`
                      : "Une fois le tour validé, ses réponses ne pourront plus être modifiées."}
                  </span>
                  <button className="btn btn-gold" type="button" disabled={!peutValider} onClick={generer}>
                    Valider le tour {courant.round_number} &amp; générer la suite →
                  </button>
                </div>
              )}
            </Card>
          )}

          {precedents.length > 0 && (
            <Card flat>
              <CardHead><h3>Tours précédents</h3></CardHead>
              <div className="col gap-s">
                {precedents.map(t => <TourPrecedent key={t.id} tour={t} />)}
              </div>
            </Card>
          )}
        </>
      )}

      <div className="row-between">
        <span className="hint">
          {termine
            ? "Questionnaire terminé : vous pouvez passer au cockpit."
            : "Le cockpit reste accessible avant la fin du questionnaire."}
        </span>
        <button className="btn" type="button" onClick={passerAuCockpit}>Passer au cockpit →</button>
      </div>
    </div>
  );
}
