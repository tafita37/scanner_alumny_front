"use client";

import Link from "next/link";
import Card, { CardHead } from "@/components/ui/Card";
import Note from "@/components/ui/Note";
import { fmtEur, groupe } from "@/lib/format";

const nombre = n => (n === null || n === undefined ? null : groupe(n));

/* Étape 1 vue depuis un dossier existant : l'onboarding est déjà enregistré,
   on en affiche le récapitulatif. Un brouillon renvoie vers l'assistant. */
export default function RecapOnboarding({ dossier, onSuivant }) {
  const brouillon = dossier.etape <= 1;

  const recap = [
    ["Entreprise", dossier.client],
    ["SIRET", dossier.siret],
    ["Forme juridique", dossier.formeJuridique],
    ["Code NAF", dossier.naf],
    ["Commune", dossier.ville],
    ["Secteur (figé)", dossier.secteur],
    ["Contact dirigeant", dossier.contact],
    ["E-mail", dossier.contactMail],
    ["Téléphone", dossier.contactTel],
    ["Effectif", nombre(dossier.effectif)],
    ["Chiffre d'affaires", dossier.ca === null || dossier.ca === undefined ? null : fmtEur(dossier.ca)],
    ["Bénéfice", dossier.benefices === null || dossier.benefices === undefined ? null : fmtEur(dossier.benefices)],
    ["Année des comptes", dossier.annee],
    ["Date d'audit", dossier.maj]
  ];

  return (
    <Card>
      <CardHead><h2>Onboarding</h2></CardHead>
      <dl className="recap">
        {recap.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className={v ? undefined : "vide"}>{v || "non renseigné"}</dd>
          </div>
        ))}
      </dl>

      {brouillon ? (
        <>
          <Note tone="gold" ico="✎" className="mt">
            Onboarding non terminé : le consentement et le questionnaire d&apos;appoint restent à compléter.
          </Note>
          <div className="row-between mt">
            <span />
            <Link className="btn" href="/nouveau-dossier">Reprendre l&apos;onboarding</Link>
          </div>
        </>
      ) : (
        <div className="row-between mt">
          <span className="hint">Entreprise, contact et consentement enregistrés.</span>
          <button className="btn" type="button" onClick={onSuivant}>Analyse documentaire →</button>
        </div>
      )}
    </Card>
  );
}
