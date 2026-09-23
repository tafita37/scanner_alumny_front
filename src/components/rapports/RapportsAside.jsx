"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { IaBlock, IaPhase, IaSrc } from "@/components/ui/Ia";
import { Placeholder } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { useUi } from "@/context/UiContext";

const TONS = [
  <>Factuel &amp; chiffré <span className="hint">(défaut)</span></>,
  "Pédagogique — dirigeant non financier",
  "Direct — orienté décision rapide"
];

export default function RapportsAside({ version }) {
  const { toast, openModal, closeModal } = useUi();

  const apercuPleinEcran = () => openModal(
    <>
      <h2>Aperçu — Audit Alumny {version}</h2>
      <p className="small muted">
        11 pages · synthèse rédigée par le Copilote · CTA Calendly en dernière page.
      </p>
      <Placeholder className="mt" style={{ height: 380 }}>
        rendu PDF plein écran<br />(visionneuse)
      </Placeholder>
      <ModalActions><button className="btn" type="button" onClick={closeModal}>Fermer</button></ModalActions>
    </>
  );

  return (
    <aside className="col gap-l">
      <Card className="preview-card">
        <CardHead><h3>Aperçu</h3><Badge tone="gold">{version}</Badge></CardHead>

        <div className="pdf">
          <div className="pdf-cover">
            <span className="pdf-brand">ALUMNY</span>
            <h4>Audit de performance<br />opérationnelle</h4>
            <span className="pdf-client">Bâti Duran SARL · Août 2026</span>
            <div className="pdf-gauge"><b>68</b><span>/100</span></div>
            <span className="pdf-money">47 800 € de perte sèche annuelle estimée</span>
          </div>
          <div className="pdf-lines">
            <span /><span /><span style={{ width: "70%" }} />
            <Placeholder style={{ height: 52, margin: "8px 0" }}>graphique comparatif marché</Placeholder>
            <span /><span style={{ width: "84%" }} />
          </div>
        </div>

        <div className="row gap-s mt">
          <button className="btn btn-ghost btn-s grow" type="button" onClick={apercuPleinEcran}>
            Aperçu plein écran
          </button>
          <button
            className="btn btn-s grow" type="button"
            onClick={() => toast(`Téléchargement du PDF (${version}) — 2,3 Mo.`)}
          >
            Télécharger
          </button>
        </div>
      </Card>

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

      <Card tint="gold">
        <CardHead><h3>Ton de la synthèse</h3></CardHead>
        <div className="col gap-s">
          {TONS.map((label, i) => (
            <label className="check" key={i}>
              <input type="radio" name="ton" defaultChecked={i === 0} /> <span>{label}</span>
            </label>
          ))}
        </div>
        <p className="hint mt-s">Paramètre du Copilote de rédaction, appliqué à la régénération.</p>
      </Card>
    </aside>
  );
}
