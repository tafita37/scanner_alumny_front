"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import { IaTag } from "@/components/ui/Ia";
import { Field, Spinner } from "@/components/ui/Misc";
import { fmtEur, groupe } from "@/lib/format";

/* « 1 234 € », « − 5 000 » → nombre ; null si vide, NaN si illisible */
function enNombre(valeur) {
  const s = valeur.replace(/[\s €]/g, "").replace(/−/g, "-").replace(",", ".");
  return s === "" ? null : Number(s);
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

export default function EtapeQuestionnaire({ badge, audit, chargement, valeurs, onChange, onPrecedent, onCreer }) {
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
        <Field label="Chiffre d'affaires (€)" htmlFor="q-ca" hint={cCa.texte} hintClassName={classe(cCa)}>
          <input type="text" id="q-ca" inputMode="numeric" disabled={chargement}
            value={valeurs.ca} onChange={e => onChange("ca", e.target.value)} />
        </Field>

        <Field label="Effectif" htmlFor="q-effectif" hint={cEff.texte} hintClassName={classe(cEff)}>
          <input type="text" id="q-effectif" inputMode="numeric" disabled={chargement}
            value={valeurs.effectif} onChange={e => onChange("effectif", e.target.value)} />
        </Field>

        <Field label="Bénéfices (€)" htmlFor="q-benefices" hint={cBen.texte} hintClassName={classe(cBen)}>
          <input type="text" id="q-benefices" inputMode="numeric" disabled={chargement}
            value={valeurs.benefices} onChange={e => onChange("benefices", e.target.value)} />
        </Field>
      </div>

      <div className="row-between mt">
        <button className="btn btn-ghost" type="button" onClick={onPrecedent}>Retour</button>
        <button className="btn btn-gold" type="button" onClick={onCreer} disabled={chargement}>
          Créer le dossier &amp; passer au dépôt de pièces
        </button>
      </div>
    </Card>
  );
}
