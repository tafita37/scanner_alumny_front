"use client";

import { useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import { IaTag } from "@/components/ui/Ia";
import { Field, Spinner } from "@/components/ui/Misc";
import { useUi } from "@/context/UiContext";
import { enNombre, fmtEur, groupe } from "@/lib/format";

/* Champs manquants ou invalides du questionnaire : { champ: message } (vide si tout est bon). */
export function erreursQuestionnaire(valeurs, siren) {
  const e = {};
  const montant = (champ, libelle) => {
    const n = enNombre(valeurs[champ]);
    if (n === null) e[champ] = `${libelle} obligatoire.`;
    else if (!Number.isFinite(n)) e[champ] = "Valeur non numérique.";
  };
  montant("ca", "Chiffre d'affaires");
  montant("benefices", "Bénéfices");

  const effectif = enNombre(valeurs.effectif);
  if (effectif === null) e.effectif = "Effectif obligatoire.";
  else if (!Number.isInteger(effectif) || effectif < 0) e.effectif = "Nombre entier positif attendu.";

  const siret = valeurs.siret.replace(/\s+/g, "");
  if (!siret) e.siret = "SIRET obligatoire.";
  else if (!/^\d{14}$/.test(siret)) e.siret = "Le SIRET compte exactement 14 chiffres.";
  else if (siren && !siret.startsWith(siren)) e.siret = `Le SIRET doit commencer par le SIREN ${siren}.`;

  const annee = enNombre(valeurs.annee);
  const max = new Date().getFullYear();
  if (annee === null) e.annee = "Année obligatoire.";
  else if (!Number.isInteger(annee) || annee < 1900 || annee > max) e.annee = `Année entre 1900 et ${max} attendue.`;
  return e;
}

/* Contrôle de cohérence : la réponse saisie est recoupée avec la source publique. */
function coherence(valeur, reference, libelle) {
  if (reference === null || reference === undefined) return { texte: "Aucune source de recoupement disponible.", ok: null };
  const n = enNombre(valeur);
  if (n === null) return { texte: `↳ à renseigner pour recouper avec ${libelle}`, ok: null };
  if (Number.isNaN(n)) return { texte: "↳ valeur non numérique", ok: false };
  const ecart = reference === 0 ? (n === 0 ? 0 : 1) : Math.abs(n - reference) / Math.abs(reference);
  const ok = ecart < 0.15;
  if (ok) return { ok, texte: `↳ cohérent avec ${libelle}` };
  return {
    ok,
    texte: reference === 0
      ? `↳ ${libelle} vaut 0 — à vérifier`
      : `↳ écart de ${Math.round(ecart * 100)} % avec ${libelle} — à vérifier`
  };
}

export default function EtapeQuestionnaire({
  badge, audit, siren, chargement, envoi, valeurs, onChange, onPrecedent, onCreer
}) {
  const { toast } = useUi();
  /* Les erreurs ne s'affichent qu'après une première tentative de création. */
  const [tente, setTente] = useState(false);
  const erreurs = tente ? erreursQuestionnaire(valeurs, siren) : {};

  const creer = () => {
    if (Object.keys(erreursQuestionnaire(valeurs, siren)).length) {
      setTente(true);
      toast("Complète les champs obligatoires avant de créer le dossier.", "gold");
      return;
    }
    onCreer();
  };

  const cCa = coherence(valeurs.ca, audit?.revenue, `le CA publié (${fmtEur(audit?.revenue)})`);
  const cEff = coherence(valeurs.effectif, audit?.head_count, `l'effectif publié (${audit?.head_count != null ? groupe(audit.head_count) : "—"})`);
  const cBen = coherence(valeurs.benefices, audit?.profit, `le résultat publié (${fmtEur(audit?.profit)})`);
  const classe = c => "hint " + (c.ok === null ? "" : c.ok ? "check-ok" : "check-warn");

  return (
    <Card>
      <CardHead>
        <h2>Questionnaire d&apos;appoint</h2>
        <Badge tone="warn">{badge}</Badge>
        <IaTag phase={0}>Questionnaire adaptatif</IaTag>
      </CardHead>

      <p className="muted small">
        Questions générées dynamiquement selon ce qui manque réellement — posées uniquement si l&apos;API et le
        bilan sont insuffisants. Un contrôle de cohérence automatique compare les réponses aux sources disponibles.
      </p>

      {chargement ? (
        <div className="ac-load mt"><Spinner /> Récupération des comptes publiés…</div>
      ) : (
        <Note tone={audit ? "blue" : "gold"} ico="ⓘ" className="mt">
          {audit
            ? <>Champs pré-remplis avec les comptes publiés en <b>{audit.publication_year}</b> — modifiables.</>
            : <>Aucun compte publié pour cette entreprise : les champs sont à renseigner.</>}
        </Note>
      )}

      <div className="form-grid form-grid-3 mt">
        <Field label="Chiffre d'affaires (€) *" htmlFor="q-ca" hint={cCa.texte} hintClassName={classe(cCa)}
          error={erreurs.ca}>
          <input type="text" id="q-ca" inputMode="numeric" disabled={chargement}
            value={valeurs.ca} onChange={e => onChange("ca", e.target.value)} />
        </Field>

        <Field label="Effectif *" htmlFor="q-effectif" hint={cEff.texte} hintClassName={classe(cEff)}
          error={erreurs.effectif}>
          <input type="text" id="q-effectif" inputMode="numeric" disabled={chargement}
            value={valeurs.effectif} onChange={e => onChange("effectif", e.target.value)} />
        </Field>

        <Field label="Bénéfices (€) *" htmlFor="q-benefices" hint={cBen.texte} hintClassName={classe(cBen)}
          error={erreurs.benefices}>
          <input type="text" id="q-benefices" inputMode="numeric" disabled={chargement}
            value={valeurs.benefices} onChange={e => onChange("benefices", e.target.value)} />
        </Field>

        <Field label="SIRET de l'établissement *" htmlFor="q-siret"
          hint="14 chiffres : le SIREN suivi du NIC." error={erreurs.siret}>
          <input type="text" id="q-siret" inputMode="numeric" disabled={chargement}
            value={valeurs.siret} onChange={e => onChange("siret", e.target.value)} />
        </Field>

        <Field label="Année des comptes *" htmlFor="q-annee" error={erreurs.annee}>
          <input type="text" id="q-annee" inputMode="numeric" disabled={chargement}
            value={valeurs.annee} onChange={e => onChange("annee", e.target.value)} />
        </Field>
      </div>

      <div className="row-between mt">
        <button className="btn btn-ghost" type="button" onClick={onPrecedent} disabled={envoi}>Retour</button>
        <button className="btn btn-gold" type="button" onClick={creer} disabled={chargement || envoi}>
          {envoi ? <><Spinner /> Création…</> : <>Créer le dossier &amp; passer au dépôt de pièces</>}
        </button>
      </div>
    </Card>
  );
}
