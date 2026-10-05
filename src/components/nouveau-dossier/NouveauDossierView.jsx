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
import { creerAudit, getInfosAudit } from "@/lib/api";
import { enNombre, groupe, heureCourante } from "@/lib/format";

const QUESTIONNAIRE_VIDE = { ca: "", effectif: "", benefices: "", siret: "", annee: "" };
const fmtNombre = n => (n === null || n === undefined ? "" : groupe(n));

/* Questionnaire pré-rempli avec les comptes publiés ; à défaut, SIREN (à compléter par le NIC)
   et dernière année close. */
const questionnaireDepuis = (infos, siren) => ({
  ca: fmtNombre(infos?.revenue),
  effectif: fmtNombre(infos?.head_count),
  benefices: fmtNombre(infos?.profit),
  siret: infos?.siret_number || siren || "",
  annee: String(infos?.publication_year ?? new Date().getFullYear() - 1)
});

/* Retire les champs vides : le backend refuse null sur les champs facultatifs de l'entreprise. */
const sansVides = objet => Object.fromEntries(
  Object.entries(objet).filter(([, v]) => v !== null && v !== undefined && v !== "")
);

/* Body de POST /api/companies/audits/create/ */
const corpsAudit = (dossier, contact, q) => {
  const e = dossier.entreprise;
  return {
    company: sansVides({
      siren_number: e.siren_number,
      company_name: e.company_name,
      naf_code: e.naf_code,
      creation_date: e.creation_date,
      industry: dossier.secteurId,
      city: e.city_code_insee,
      company_type: e.company_type_label
    }),
    ceo: {
      name: contact.nom.trim(),
      first_name: contact.prenom.trim(),
      email: contact.mail.trim(),
      phone_number: contact.tel.trim(),
      job_title: contact.fonction.trim()
    },
    audit: {
      siret_number: q.siret.replace(/\s+/g, ""),
      head_count: enNombre(q.effectif),
      revenue: enNombre(q.ca),
      profit: enNombre(q.benefices),
      publication_year: enNombre(q.annee)
    }
  };
};

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
    nom: null, siret: null, entreprise: null, secteur: null, secteurId: null, contact: null, optin: false
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

  const [contact, setContact] = useState({ nom: "", prenom : "", fonction: "", mail: "", tel: "" });
  const majContact = suivant => {
    setContact(suivant);
    majDossier({ contact: suivant.mail || [suivant.nom, suivant.prenom] || null });
  };
  const surContact = (champ, valeur) => majContact({ ...contact, [champ]: valeur });

  /* Questionnaire d'appoint, pré-rempli avec les derniers comptes publiés de l'entreprise */
  const [audit, setAudit] = useState(null);
  const [chargementAudit, setChargementAudit] = useState(false);
  const [questionnaire, setQuestionnaire] = useState(QUESTIONNAIRE_VIDE);
  /* Numéro du dernier chargement : une réponse arrivée après un changement d'entreprise est ignorée. */
  const dernierAudit = useRef(0);

  const chargerAudit = async siret => {
    const id = ++dernierAudit.current;
    setAudit(null);
    setChargementAudit(true);
    try {
      const infos = await getInfosAudit(siret);
      if (id !== dernierAudit.current) return;
      setAudit(infos);
      setQuestionnaire(questionnaireDepuis(infos, siret));
    } catch (err) {
      if (id !== dernierAudit.current) return;
      setQuestionnaire(questionnaireDepuis(null, siret));
      toast(err.message, "gold");
    } finally {
      if (id === dernierAudit.current) setChargementAudit(false);
    }
  };

  const surQuestionnaire = (champ, valeur) => {
    setQuestionnaire(q => ({ ...q, [champ]: valeur }));
    marquerSaisie();
  };

  /* Le dirigeant connu de l'annuaire pré-remplit le contact de l'étape 2.
     Changer d'entreprise efface un pré-remplissage précédent resté intact. */
  const surEntreprise = entreprise => {
    majDossier({ nom: entreprise.company_name, siret: entreprise.siren_number, entreprise });
    chargerAudit(entreprise.siren_number);
    const precedent = dossier.entreprise;
    const garder = (champ, ancien) => (contact[champ] && contact[champ] !== ancien ? contact[champ] : "");
    majContact({
      ...contact,
      prenom: entreprise.ceo_first_name || garder("prenom", precedent?.ceo_first_name),
      nom: entreprise.ceo_name || garder("nom", precedent?.ceo_name),
      fonction: entreprise.ceo_job_title || garder("fonction", precedent?.ceo_job_title)
    });
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

  const [envoi, setEnvoi] = useState(false);

  const creer = async () => {
    setEnvoi(true);
    try {
      const cree = await creerAudit(corpsAudit(dossier, contact, questionnaire));
      toast(`Dossier <b>#${cree.id}</b> créé pour ${cree.company_name} — statut : documents en attente.`, "ok");
      setTimeout(() => router.push("/documents"), 900);
    } catch (err) {
      toast(err.message, "gold");
      setEnvoi(false);
    }
  };

  return (
    <PageShell
      section="Audit · Module 1"
      title="Onboarding & ingestion"
      actions={
        <>
          {/* <Badge tone="ink">{sauvegarde}</Badge> */}
          {/* <button className="btn btn-ghost btn-s" type="button" onClick={quitter}>Quitter</button> */}
        </>
      }
    >
      <Steps etapes={ETAPES} courante={etape} className="mb" />

      <div className="wiz">
        <div className="wiz-main">
          {etape === 1 && (
            <EtapeEntreprise
              dossier={dossier}
              onChoisir={surEntreprise}
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
              onSecteur={s => majDossier({ secteur: s.name, secteurId: s.id })}
              contact={contact}
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
              audit={audit}
              siren={dossier.siret}
              chargement={chargementAudit}
              envoi={envoi}
              valeurs={questionnaire}
              onChange={surQuestionnaire}
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
