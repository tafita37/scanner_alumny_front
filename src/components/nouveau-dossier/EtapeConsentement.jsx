"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Note from "@/components/ui/Note";

export default function EtapeConsentement({ dossier, horodatage, onOptin, onPrecedent, onSuivant }) {
  return (
    <Card>
      <CardHead><h2>Consentement RGPD</h2></CardHead>

      <div className="consent">
        <p className="consent-text">
          J&apos;autorise Alumny à traiter les données de mon entreprise et mes coordonnées professionnelles
          dans le cadre de l&apos;audit demandé, et à me recontacter à ce sujet. Les documents déposés sont
          anonymisés localement avant tout traitement par un service tiers.
        </p>
        <label className="check mt">
          <input type="checkbox" checked={dossier.optin} onChange={e => onOptin(e.target.checked)} />
          <span>
            Le dirigeant a donné son accord explicite. <b>Case bloquante</b> — sans elle, aucun document
            ne peut être déposé.
          </span>
        </label>
        <p className="hint mt-s">
          {dossier.optin
            ? <>Horodaté le <b>12/08/2026 à {horodatage}</b> — texte affiché conservé (version v3).</>
            : "Non horodaté."}
        </p>
      </div>

      <Note ico="⏱" className="mt">
        Texte affiché + horodatage conservés comme preuve. Conservation des champs nominatifs :
        3 ans à compter du <b>dernier dossier</b> de ce client.
      </Note>

      <div className="row-between mt">
        <button className="btn btn-ghost" type="button" onClick={onPrecedent}>Retour</button>
        <button className="btn" type="button" disabled={!dossier.optin} onClick={onSuivant}>Continuer</button>
      </div>
    </Card>
  );
}
