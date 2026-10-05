"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/shell/PageShell";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import { Spinner, Steps } from "@/components/ui/Misc";
import RecapOnboarding from "@/components/audits/RecapOnboarding";
import EtapeDocuments from "@/components/documents/EtapeDocuments";
import EtapeCockpit from "@/components/cockpit/EtapeCockpit";
import EtapeRapport from "@/components/rapports/EtapeRapport";
import { useDossiers } from "@/context/DossiersContext";
import { ETAPES_AUDIT, lienDossier } from "@/lib/dossiers";

/* Page d'un dossier d'audit : les 4 étapes s'enchaînent ici.
   On peut revenir sur toute étape déjà atteinte, jamais sauter au-delà. */
export default function DossierView({ refDossier, etapeDemandee }) {
  const router = useRouter();
  const { dossiers, charge, majDossier } = useDossiers();
  const dossier = dossiers.find(d => d.ref === refDossier);
  const [choisie, setChoisie] = useState(null);

  /* Un lien vers une autre étape de ce même dossier (?etape=…) l'emporte sur le choix local. */
  const [demandeSuivie, setDemandeSuivie] = useState(etapeDemandee);
  if (demandeSuivie !== etapeDemandee) {
    setDemandeSuivie(etapeDemandee);
    setChoisie(null);
  }

  if (!dossier) {
    return (
      <PageShell section="Audit" title={charge ? "Dossier introuvable" : "Chargement…"}>
        {charge ? (
          <p className="muted">
            Aucun dossier <b>{refDossier}</b>. <Link href="/audits">Retour aux audits</Link>
          </p>
        ) : <Spinner />}
      </PageShell>
    );
  }

  const atteinte = dossier.etape;
  const vue = Math.min(Math.max(choisie ?? etapeDemandee ?? atteinte, 1), atteinte);

  const aller = n => {
    setChoisie(n);
    router.replace(lienDossier(refDossier, n), { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Termine l'étape courante et ouvre la suivante. */
  const avancer = (n, patch = {}) => {
    majDossier(refDossier, { ...patch, etape: Math.max(atteinte, n) });
    aller(n);
  };

  return (
    <PageShell
      section={`Audit · ${dossier.ref}`}
      title={dossier.client}
      actions={
        <>
          <Badge tone="sky">{dossier.secteur}</Badge>
          <StatusBadge statut={dossier.statut} />
          <Link className="btn btn-ghost btn-s" href="/audits">← Audits</Link>
        </>
      }
    >
      <Steps etapes={ETAPES_AUDIT} courante={vue} atteinte={atteinte} onAller={aller} className="mb" />

      {vue === 1 && <RecapOnboarding dossier={dossier} onSuivant={() => aller(2)} />}

      {vue === 2 && <EtapeDocuments onSuivant={() => avancer(3, { statut: "analysé" })} />}

      {vue === 3 && <EtapeCockpit dossier={dossier} onSuivant={() => avancer(4)} />}

      {vue === 4 && <EtapeRapport onGenere={() => majDossier(refDossier, { statut: "rapport généré" })} />}
    </PageShell>
  );
}
