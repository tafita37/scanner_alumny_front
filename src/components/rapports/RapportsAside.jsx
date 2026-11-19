"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { IaBlock, IaPhase, IaSrc } from "@/components/ui/Ia";
import { CompositionRapport } from "@/components/rapports/RapportSections";
import { STATUT_RAPPORT, dateHeure, nomFichierRapport } from "@/lib/rapport";
import { groupe } from "@/lib/format";

/* Rapport actuel : état, date, téléchargement. */
function RapportActuel({ rapport, pdf, client, enCours }) {
  const existe = Boolean(rapport?.pdf_available);
  const statut = enCours ? STATUT_RAPPORT.en_cours : STATUT_RAPPORT[rapport?.status];
  const tokens = (rapport?.input_tokens ?? 0) + (rapport?.output_tokens ?? 0);

  return (
    <Card className="preview-card">
      <CardHead>
        <h3>Rapport actuel</h3>
        {statut ? <Badge tone={statut.tone} dot>{statut.label}</Badge> : <Badge tone="ink">jamais généré</Badge>}
      </CardHead>

      {existe ? (
        <dl className="rp-meta small">
          <div><dt>Généré le</dt><dd>{dateHeure(rapport.generated_at) ?? "—"}</dd></div>
          <div><dt>Pages</dt><dd>{rapport.page_count ?? "—"}</dd></div>
          {tokens > 0 && (
            <div>
              <dt>Tokens LLM</dt>
              <dd className="mono">{groupe(rapport.input_tokens)} entrée · {groupe(rapport.output_tokens)} sortie</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="small muted">Aucun PDF pour cet audit.</p>
      )}

      {existe && (
        <div className="row gap-s mt">
          {pdf.url ? (
            <>
              <a className="btn btn-s grow" href={pdf.url} download={nomFichierRapport(client, rapport.generated_at)}>
                Télécharger
              </a>
              <a className="btn btn-ghost btn-s grow" href={pdf.url} target="_blank" rel="noopener noreferrer">
                Ouvrir dans un onglet
              </a>
            </>
          ) : (
            <button className="btn btn-s grow" type="button" disabled>
              {pdf.encours ? "Chargement du PDF…" : "PDF indisponible"}
            </button>
          )}
        </div>
      )}

      <p className="hint mt-s">
        Une seule version est conservée : régénérer remplace ce PDF (il reste en place si la génération échoue).
      </p>
    </Card>
  );
}

export default function RapportsAside({ rapport, pdf, client, enCours }) {
  return (
    <aside className="col gap-l">
      <RapportActuel rapport={rapport} pdf={pdf} client={client} enCours={enCours} />

      <CompositionRapport pages={rapport?.pdf_available ? rapport.page_count : null} />

      <Card tint="blue">
        <CardHead><h3>Ce que voit le client</h3></CardHead>
        <p className="small">
          Le client final ne se connecte <b>jamais</b> à l&apos;application. Il reçoit uniquement ce PDF,
          accompagné du lien Calendly de prise de rendez-vous.
        </p>
        <ul className="small mt-s" style={{ paddingLeft: 18 }}>
          <li>Pas d&apos;accès au cockpit</li>
          <li>Pas d&apos;accès aux documents sources</li>
          <li>Pas de compte utilisateur</li>
        </ul>
      </Card>

      <IaBlock>
        <CardHead><h3>Après la remise</h3><IaPhase phase={2} /></CardHead>
        <p className="small">Deux briques qui n&apos;ont de sens qu&apos;avec un historique de dossiers remis :</p>
        <ul className="small" style={{ paddingLeft: 18, margin: "6px 0 0" }}>
          <li><b>Suivi post-audit &amp; relance</b> — relances personnalisées selon les leviers proposés (CRM / Calendly)</li>
          <li><b>Copilote post-audit</b> — questions du client sur son rapport, RAG sur ses propres documents</li>
        </ul>
        <IaSrc>conditionné à l&apos;existence d&apos;une boucle de retour terrain</IaSrc>
      </IaBlock>
    </aside>
  );
}
