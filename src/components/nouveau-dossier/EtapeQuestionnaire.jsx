"use client";

import { useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { IaTag } from "@/components/ui/Ia";
import { Field } from "@/components/ui/Misc";

/* Contrôle de cohérence : la réponse saisie est recoupée avec la source publique. */
function coherence(valeur, reference, libelle) {
  const chiffres = Number(valeur.replace(/[^\d]/g, ""));
  if (!chiffres) return { texte: `↳ à renseigner pour recouper avec ${libelle}`, ok: null };
  const ecart = Math.abs(chiffres - reference) / reference;
  const ok = ecart < 0.15;
  return {
    ok,
    texte: ok ? `↳ cohérent avec ${libelle}` : `↳ écart de ${Math.round(ecart * 100)} % avec ${libelle} — à vérifier`
  };
}

export default function EtapeQuestionnaire({ badge, onPrecedent, onCreer }) {
  const [ca, setCa] = useState("3 100 000 €");
  const [effectif, setEffectif] = useState("24");

  const cCa = coherence(ca, 3100000, "le CA publié (3,1 M€)");
  const cEff = coherence(effectif, 24, "l'effectif API (24)");
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

      <div className="form-grid mt">
        <Field label="Régime fiscal">
          <select>
            <option>IS — impôt sur les sociétés</option>
            <option>IR — BIC réel</option>
            <option>Micro-entreprise</option>
          </select>
        </Field>

        <Field label="CA estimé sur 12 mois" hint={cCa.texte} hintClassName={classe(cCa)}>
          <input type="text" value={ca} onChange={e => setCa(e.target.value)} />
        </Field>

        <Field label="Effectif" hint={cEff.texte} hintClassName={classe(cEff)}>
          <input type="text" value={effectif} onChange={e => setEffectif(e.target.value)} />
        </Field>

        <Field label="Coût moyen d'un chantier" hint="Aucune source de recoupement disponible.">
          <input type="text" defaultValue="18 500 €" />
        </Field>
      </div>

      <div className="row-between mt">
        <button className="btn btn-ghost" type="button" onClick={onPrecedent}>Retour</button>
        <button className="btn btn-gold" type="button" onClick={onCreer}>
          Créer le dossier &amp; passer au dépôt de pièces
        </button>
      </div>
    </Card>
  );
}
