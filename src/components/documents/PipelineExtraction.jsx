"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import { Bar, Divider, Spinner } from "@/components/ui/Misc";
import { useUi } from "@/context/UiContext";
import { ETAPES_PIPELINE } from "@/lib/extractionSimulee";

const HINTS = {
  local: "Auto-hébergé, ~8-12 Go de VRAM. Aucune donnée ne quitte l'infrastructure Alumny ; fiabilité légèrement inférieure sur les documents très dégradés.",
  externe: "Meilleure qualité sur écriture manuscrite et photos dégradées, mais l'image brute part chez un tiers : exige une anonymisation en amont ou un DPA / Zero Data Retention."
};

const CLASSES = { run: "is-run", ok: "is-ok", skip: "is-skip", warn: "is-warn", err: "is-err" };

function badgeEtat(doc, enFile) {
  if (!doc) return <Badge tone="ink">en attente de documents</Badge>;
  if (doc.statut === "upload") return <Badge tone="sky">téléversement</Badge>;
  if (doc.statut === "analyse") return <Badge tone="warn">en cours</Badge>;
  if (doc.statut === "attente") return <Badge tone="ink">en file</Badge>;
  if (doc.statut === "erreur") return <Badge tone="bad">échec</Badge>;
  return <Badge tone="ok">{enFile ? `terminé · ${enFile} en file` : "terminé"}</Badge>;
}

/* doc : document suivi (celui en cours de traitement, sinon celui sélectionné)
   journal : [{ id, heure, texte, ton }] du plus récent au plus ancien */
export default function PipelineExtraction({ doc, enFile, journal, moteur, onMoteur, onRelancer }) {
  const { toast } = useUi();
  const occupe = doc && (doc.statut === "upload" || doc.statut === "analyse" || doc.statut === "attente");

  const choisirMoteur = m => {
    onMoteur(m);
    if (m === "externe") toast("Attention : garanties contractuelles requises (DPA / Zero Data Retention).", "gold");
  };

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
                : `${doc.cat || "catégorie à déterminer"} · ${doc.taille}`}
            </span>
            {doc.statut === "upload" && <Bar value={doc.progression} tint="sky" className="file-bar" />}
          </span>
        </div>
      ) : (
        <p className="hint mb">Dépose une pièce pour suivre son traitement étape par étape.</p>
      )}

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
                    ? <>schéma imposé, <code>null</code> plutôt qu&apos;une valeur hallucinée</>
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
        <div>
          <span className="lbl">Moteur d&apos;extraction</span>
          <div className="row gap-s mt-s wrap">
            <Chip active={moteur === "local"} onClick={() => choisirMoteur("local")}>Vision LLM local (RGPD ✓)</Chip>
            <Chip active={moteur === "externe"} onClick={() => choisirMoteur("externe")}>API externe (qualité +)</Chip>
          </div>
        </div>
        <button className="btn btn-ghost btn-s" type="button" disabled={!doc || occupe} onClick={() => onRelancer(doc.id)}>
          Relancer le pipeline
        </button>
      </div>

      <p className="hint mt-s">{HINTS[moteur]}</p>
    </Card>
  );
}
