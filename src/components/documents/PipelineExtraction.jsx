"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Bar, Divider, Spinner } from "@/components/ui/Misc";
import { ETAPES_PIPELINE, categorieDoc } from "@/lib/extraction";

const CLASSES = { run: "is-run", ok: "is-ok", skip: "is-skip", warn: "is-warn", err: "is-err" };

function badgeEtat(doc, enFile) {
  if (!doc) return <Badge tone="ink">en attente de documents</Badge>;
  if (doc.statut === "upload") return <Badge tone="sky">téléversement</Badge>;
  if (doc.statut === "analyse") return <Badge tone="warn">en cours</Badge>;
  if (doc.statut === "attente") return <Badge tone="ink">en file</Badge>;
  if (doc.statut === "erreur") return <Badge tone="bad">échec</Badge>;
  if (doc.statut === "non_extractible") return <Badge tone="ink">non extractible</Badge>;
  const suite = enFile ? ` · ${enFile} en file` : "";
  return doc.resultat.status === "ok"
    ? <Badge tone="ok">terminé{suite}</Badge>
    : <Badge tone="gold">à vérifier{suite}</Badge>;
}

/* doc : document suivi (celui en cours de traitement, sinon celui sélectionné)
   journal : [{ id, heure, texte, ton }] du plus récent au plus ancien */
export default function PipelineExtraction({ doc, enFile, journal, onRelancer }) {
  const relancable = doc && (doc.statut === "extrait" || doc.statut === "erreur");

  return (
    <Card>
      <CardHead>
        <h2>Pipeline d&apos;extraction</h2>
        {badgeEtat(doc, enFile)}
      </CardHead>

      {doc ? (
        <div className="pipe-doc">
          <span className="file-ico">{doc.type}</span>
          <span className="grow">
            <b>{doc.nom}</b>
            <span className="file-meta">
              {doc.statut === "upload"
                ? `envoi du fichier — ${doc.progression} %`
                : `${categorieDoc(doc)} · ${doc.taille}`}
            </span>
            {doc.statut === "upload" && <Bar value={doc.progression} tint="sky" className="file-bar" />}
          </span>
        </div>
      ) : (
        <p className="hint mb">Dépose une pièce pour suivre son traitement étape par étape.</p>
      )}

      {doc?.statut === "erreur" && <p className="small txt-bad mb">{doc.erreur}</p>}

      <ol className="pipe">
        {ETAPES_PIPELINE.map((e, i) => {
          const s = doc?.etapes[i] || { statut: "attente", msg: "" };
          return (
            <li key={e.k} className={CLASSES[s.statut] || ""}>
              <span className="pipe-n">{s.statut === "ok" ? "✓" : s.statut === "err" ? "✕" : e.n}</span>
              <div>
                <b>{e.titre}</b>
                <span>
                  {e.k === "llm"
                    ? <>LLM via l&apos;API Groq, schéma imposé selon le secteur, <code>null</code> plutôt qu&apos;une valeur inventée</>
                    : e.desc}
                </span>
              </div>
              <span className="pipe-s">
                {s.statut === "run" && <Spinner style={{ display: "inline-block", verticalAlign: -2, marginRight: 6 }} />}
                {s.msg}
              </span>
            </li>
          );
        })}
      </ol>

      {journal.length > 0 && (
        <>
          <div className="mt"><span className="lbl">Journal de traitement</span></div>
          <ul className="journal mt-s">
            {journal.map(l => (
              <li key={l.id} className={l.ton ? `j-${l.ton}` : undefined}>
                <span className="mono">{l.heure}</span>{l.texte}
              </li>
            ))}
          </ul>
        </>
      )}

      <Divider />

      <div className="row wrap row-between" style={{ gap: 14 }}>
        <p className="hint grow" style={{ margin: 0 }}>
          Lecture, OCR et anonymisation tournent sur le serveur Alumny : seul le texte anonymisé est envoyé
          au LLM, et les vraies valeurs sont remises dans le résultat au retour.
        </p>
        <button className="btn btn-ghost btn-s" type="button" disabled={!relancable} onClick={() => onRelancer(doc.id)}>
          Relancer le pipeline
        </button>
      </div>
    </Card>
  );
}
