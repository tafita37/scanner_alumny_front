"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/shell/PageShell";
import Badge from "@/components/ui/Badge";
import { Steps } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import EtapeEntreprise from "@/components/nouveau-dossier/EtapeEntreprise";
import EtapeSecteur from "@/components/nouveau-dossier/EtapeSecteur";
import EtapeConsentement from "@/components/nouveau-dossier/EtapeConsentement";
import EtapeQuestionnaire from "@/components/nouveau-dossier/EtapeQuestionnaire";
import WizAside from "@/components/nouveau-dossier/WizAside";
import { useUi } from "@/context/UiContext";
import { heureCourante } from "@/lib/format";

const ETAPES = [
  { n: 1, label: "Entreprise" },
  { n: 2, label: "Secteur & contact" },
  { n: 3, label: "Consentement" },
  { n: 4, label: "Questionnaire d'appoint" }
];

export default function NouveauDossierView() {
  const router = useRouter();
  const { toast, openModal, closeModal } = useUi();

  const [etape, setEtape] = useState(1);
  const [dossier, setDossier] = useState({
    nom: null, siret: null, secteur: "BTP", contact: null, optin: false
  });
  const [horodatage, setHorodatage] = useState("");
  const [badgeQuestionnaire, setBadgeQuestionnaire] = useState("déclenché : données publiques partielles");
  const [sauvegarde, setSauvegarde] = useState("Brouillon enregistré");
  const timerSauvegarde = useRef(null);

  useEffect(() => () => clearTimeout(timerSauvegarde.current), []);

  /* Indicateur d'enregistrement automatique du brouillon. */
  const marquerSaisie = useCallback(() => {
    setSauvegarde("Enregistrement…");
    clearTimeout(timerSauvegarde.current);
    timerSauvegarde.current = setTimeout(() => setSauvegarde("Brouillon enregistré"), 700);
  }, []);

  const aller = n => {
    setEtape(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const majDossier = patch => {
    setDossier(d => ({ ...d, ...patch }));
    marquerSaisie();
  };

  const contact = useRef({ nom: "", mail: "", tel: "" });
  const surContact = (champ, valeur) => {
    contact.current[champ] = valeur;
    majDossier({ contact: contact.current.mail || contact.current.nom || null });
  };

  const surOptin = coche => {
    setHorodatage(coche ? heureCourante() : "");
    majDossier({ optin: coche });
    if (coche) toast("Consentement enregistré : le dépôt de documents est débloqué.", "ok");
  };

  const quitter = () => openModal(
    <>
      <h2>Quitter l&apos;onboarding ?</h2>
      <p>
        Le dossier reste en <b>brouillon</b>. Les coordonnées déjà saisies sont conservées sur la fiche Client
        (fonction lead) même si l&apos;audit n&apos;est jamais mené à son terme.
      </p>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Rester</button>
        <Link className="btn" href="/dashboard" onClick={closeModal}>Quitter</Link>
      </ModalActions>
    </>
  );

  const creer = () => {
    toast("Dossier <b>D-2026-042</b> créé — statut : documents en attente.", "ok");
    setTimeout(() => router.push("/documents"), 900);
  };

  return (
    <PageShell
      section="Audit · Module 1"
      title="Onboarding & ingestion"
      actions={
        <>
          <Badge tone="ink">{sauvegarde}</Badge>
          <button className="btn btn-ghost btn-s" type="button" onClick={quitter}>Quitter</button>
        </>
      }
    >
      <Steps etapes={ETAPES} courante={etape} className="mb" />

      <div className="wiz">
        <div className="wiz-main">
          {etape === 1 && (
            <EtapeEntreprise
              dossier={dossier}
              onChoisir={(nom, siret) => majDossier({ nom, siret })}
              onSuivant={() => aller(2)}
              onSansDonnees={() => {
                toast("Bascule vers le questionnaire d'appoint (étape 4) — pas de données publiques exploitables.", "gold");
                setBadgeQuestionnaire("déclenché : aucune donnée publique");
              }}
            />
          )}

          {etape === 2 && (
            <EtapeSecteur
              dossier={dossier}
              onSecteur={secteur => majDossier({ secteur })}
              onContact={surContact}
              onPrecedent={() => aller(1)}
              onSuivant={() => aller(3)}
            />
          )}

          {etape === 3 && (
            <EtapeConsentement
              dossier={dossier}
              horodatage={horodatage}
              onOptin={surOptin}
              onPrecedent={() => aller(2)}
              onSuivant={() => aller(4)}
            />
          )}

          {etape === 4 && (
            <EtapeQuestionnaire
              badge={badgeQuestionnaire}
              onPrecedent={() => aller(3)}
              onCreer={creer}
            />
          )}
        </div>

        <WizAside dossier={dossier} />
      </div>
    </PageShell>
  );
}
