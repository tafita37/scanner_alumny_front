"use client";

import { SECTEURS } from "@/data/al";
import { ModalActions } from "@/components/ui/Modal";
import Note from "@/components/ui/Note";
import Card from "@/components/ui/Card";
import { Field } from "@/components/ui/Misc";

/* Modification de la fiche : l'API ne fournit ni le statut commercial
   ni le secteur Alumny — ces deux champs restent saisis par le consultant. */
export function ModaleEdition({ client, onClose, onValider }) {
  return (
    <>
      <h2>Modifier la fiche client</h2>
      <p className="small muted">
        L&apos;API ne fournit jamais le statut commercial ni le secteur Alumny — ces champs restent saisis par le consultant.
      </p>
      <div className="form-grid mt">
        <Field label="Raison sociale"><input type="text" defaultValue={client.nom} /></Field>
        <Field label="SIRET"><input type="text" defaultValue={client.siret} disabled /></Field>
        <Field label="E-mail du dirigeant"><input type="text" defaultValue={client.email} /></Field>
        <Field label="Téléphone"><input type="text" defaultValue={client.tel} /></Field>
        <Field label="Statut commercial">
          <select defaultValue={client.statut}>
            {["prospect", "audité", "accompagné", "perdu"].map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Secteur Alumny par défaut">
          <select defaultValue={client.secteur}>
            {SECTEURS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Annuler</button>
        <button className="btn" type="button" onClick={onValider}>Enregistrer</button>
      </ModalActions>
    </>
  );
}

/* Suppression des seuls champs nominatifs : le Client, lui, n'est jamais supprimé. */
export function ModalePurge({ client, onClose, onValider }) {
  return (
    <>
      <h2>Supprimer les champs nominatifs</h2>
      <p>Cette action vide le nom du dirigeant, l&apos;e-mail et le téléphone de <b>{client.nom}</b>.</p>
      <Note tone="gold" ico="⚠" className="mt">
        Les montants, ratios, scores et l&apos;historique des dossiers sont <b>conservés</b> :
        ils alimentent le benchmark sectoriel anonymisé.
      </Note>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Annuler</button>
        <button className="btn btn-danger" type="button" onClick={onValider}>Supprimer</button>
      </ModalActions>
    </>
  );
}

export function ModalePreuve({ onClose }) {
  return (
    <>
      <h2>Preuve de consentement</h2>
      <p className="small muted">Texte affiché au moment de l&apos;opt-in, horodaté et conservé tel quel.</p>
      <Card flat tint="sky" className="mt small" as="div">
        « J&apos;autorise Alumny à traiter les données de mon entreprise et mes coordonnées professionnelles
        dans le cadre de l&apos;audit demandé, et à me recontacter à ce sujet. »
      </Card>
      <p className="hint mt-s">Horodatage : 04/02/2026 14:32:07 · IP tronquée · version de texte v3</p>
      <ModalActions>
        <button className="btn" type="button" onClick={onClose}>Fermer</button>
      </ModalActions>
    </>
  );
}
