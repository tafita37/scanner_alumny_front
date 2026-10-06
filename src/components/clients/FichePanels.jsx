"use client";

import Link from "next/link";
import { DOSSIERS } from "@/data/al";
import { fmtEur } from "@/lib/format";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Note from "@/components/ui/Note";
import { Divider } from "@/components/ui/Misc";

/* Liste de définitions à trois colonnes (deux puis une sur petit écran). */
export function Dl({ items, className = "" }) {
  return (
    <div className={`dl ${className}`.trim()}>
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="dl-k">{k}</div>
          <div className="dl-v">{v}</div>
        </div>
      ))}
    </div>
  );
}

export function PanneauIdentite({ client, onAction }) {
  return (
    <div>
      <Dl items={[
        ["Raison sociale", <b>{client.nom}</b>],
        ["SIRET (unique)", <span className="mono">{client.siret}</span>],
        ["Code NAF (API)", client.naf],
        ["Secteur Alumny par défaut", <>{client.secteur} <span className="hint">(≠ code NAF)</span></>],
        ["Effectif (API)", `${client.effectif} salariés`],
        ["CA publié (API)", client.ca],
        ["Statut commercial", client.statut],
        ["Dernier dossier", client.dernier],
        ["Source d'enrichissement", <>Recherche Entreprises · <span className="hint">sync. il y a 3 j</span></>]
      ]} />

      <div className="pii mt">
        <div className="row-between">
          <span className="pii-tag">Champs nominatifs — suppressibles isolément</span>
          <span className="hint">Purge auto : 3 ans après le dernier dossier</span>
        </div>
        <Dl className="mt-s" items={[
          ["Dirigeant", client.dirigeant],
          ["E-mail", client.email],
          ["Téléphone", client.tel]
        ]} />
      </div>

      <Divider />
      <div className="crud-row">
        <button className="btn btn-ghost btn-s" type="button" onClick={() => onAction("edit")}>
          Update — coordonnées / statut
        </button>
        <button className="btn btn-ghost btn-s" type="button" onClick={() => onAction("secteur")}>
          Update — secteur par défaut
        </button>
        <button className="btn btn-danger btn-s" type="button" onClick={() => onAction("purge")}>
          Delete — champs nominatifs uniquement
        </button>
      </div>
      <p className="hint mt-s">
        Le Client n&apos;est jamais supprimé dans son ensemble : SIRET, secteur et historique agrégé
        sont conservés pour le benchmark.
      </p>
    </div>
  );
}

export function PanneauHistorique({ client, onAction }) {
  const dossiers = DOSSIERS.filter(d => d.siret === client.siret);

  return (
    <div>
      <ul className="timeline">
        {dossiers.map(d => (
          <li key={d.ref}>
            <div className="tl-date">{d.maj} · {d.consultant}</div>
            <div className="tl-title">{d.ref} — {d.secteur}</div>
            <div className="row gap-s wrap mt-s">
              <StatusBadge statut={d.statut} />
              {d.score !== null && <Badge tone="gold">Score {d.score}/100</Badge>}
              {d.fuite !== null && <Badge tone="ink">Fuite {fmtEur(d.fuite)}</Badge>}
              <Link className="btn btn-ghost btn-s" href="/audits">Voir les audits</Link>
            </div>
          </li>
        ))}
      </ul>

      {dossiers.length > 1 ? (
        <Note tone="gold" ico="↗" className="mt">
          Deux audits comparables sur ce client : la fuite estimée passe de{" "}
          <b>{fmtEur(dossiers[dossiers.length - 1].fuite)}</b> à <b>{fmtEur(dossiers[0].fuite)}</b>.
          <button className="btn btn-s btn-gold" type="button" style={{ marginLeft: 8 }} onClick={() => onAction("compare")}>
            Comparer les deux audits
          </button>
        </Note>
      ) : (
        <p className="hint">
          Un seul audit pour ce client — la comparaison d&apos;évolution sera disponible au prochain audit de suivi.
        </p>
      )}
    </div>
  );
}

export function PanneauRgpd({ client, onAction }) {
  return (
    <div>
      <div className="grid g-2">
        <Card flat tint="sky" as="div">
          <h3>Données nominatives</h3>
          <p className="small muted">Identifient une personne physique — supprimables sans toucher au reste.</p>
          <ul className="small">
            <li>Nom du dirigeant</li>
            <li>E-mail, téléphone</li>
            <li>Noms de clients finaux détectés dans les devis</li>
          </ul>
        </Card>
        <Card flat tint="blue" as="div">
          <h3>Données anonymisées / agrégées</h3>
          <p className="small muted">Conservées pour le futur benchmark sectoriel.</p>
          <ul className="small">
            <li>Montants, ratios, scores</li>
            <li>SIRET, secteur, effectif</li>
            <li>Historique de dossiers</li>
          </ul>
        </Card>
      </div>

      <Note ico="⏱" className="mt">
        Le décompte des 3 ans part du <b>dernier dossier créé</b> ({client.dernier}), pas de la création de la fiche —
        un client régulièrement audité ne perd jamais ses coordonnées à tort.
        Politique interne inspirée de la recommandation CNIL (ex-NS-056), non d&apos;une obligation légale rigide.
      </Note>

      <div className="row gap-s mt wrap">
        <Badge tone="ok" dot>Opt-in recueilli le 04/02/2026 à 14:32</Badge>
        <button className="btn btn-ghost btn-s" type="button" onClick={() => onAction("preuve")}>
          Voir le texte de consentement conservé
        </button>
      </div>
    </div>
  );
}
