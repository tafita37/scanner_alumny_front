"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { IaBlock, IaPhase, IaSrc } from "@/components/ui/Ia";
import { useUser } from "@/context/UserContext";

const ENTITES = [
  ["Client", "créé si le SIRET est inconnu, sinon réutilisé — SIRET unique"],
  ["Dossier", "rattaché au Client + au consultant initiateur, secteur figé"],
  ["Consentement", "texte + horodatage conservés"]
];

export default function WizAside({ dossier }) {
  const { user } = useUser();

  const recap = [
    ["Entreprise", dossier.nom],
    ["SIREN", dossier.siret],
    ["Secteur (figé)", dossier.secteur],
    ["Contact dirigeant", dossier.contact],
    ["Opt-in RGPD", dossier.optin ? "recueilli ✓" : null],
    ["Consultant", user.nom]
  ];

  return (
    <aside className="wiz-side col gap-l">
      <Card tint="blue">
        <CardHead><h3>Dossier en préparation</h3></CardHead>
        <dl className="recap">
          {recap.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className={v ? undefined : "vide"}>{v || "à renseigner"}</dd>
            </div>
          ))}
        </dl>
        {/* <p className="hint mt-s">
          Statut : <b>{dossier.optin ? "prêt à créer" : "brouillon"}</b> → documents en attente
        </p> */}
      </Card>

      {/* <IaBlock>
        <CardHead><h3>Scoring du lead</h3><IaPhase phase={2} /></CardHead>
        <div className="row-between" style={{ alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "var(--font-title)", fontSize: 28, fontWeight: 700, color: "var(--blue)" }}>
              72<span className="faint" style={{ fontSize: 16 }}>/100</span>
            </div>
            <span className="hint">probabilité de conversion</span>
          </div>
          <Badge tone="gold">heuristique</Badge>
        </div>
        <IaSrc>
          heuristique manuelle au lancement, affinée par le modèle de conversion une fois l&apos;historique
          commercial constitué
        </IaSrc>
      </IaBlock> */}
    </aside>
  );
}
