"use client";

import { CLIENTS, STATUT_TON } from "@/data/al";
import { initiales } from "@/lib/format";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ChipFilter } from "@/components/ui/Chip";

const STATUTS = [
  { value: "tous", label: "Tous" },
  { value: "prospect", label: "Prospect" },
  { value: "audité", label: "Audité" },
  { value: "accompagné", label: "Accompagné" },
  { value: "perdu", label: "Perdu" }
];

export default function ClientList({ statut, onStatut, q, onQ, courant, onSelect }) {
  const requete = q.toLowerCase().trim();
  const liste = CLIENTS.filter(c =>
    (statut === "tous" || c.statut === statut) &&
    (requete === "" || (c.nom + c.siret + c.dirigeant).toLowerCase().includes(requete))
  );

  return (
    <Card>
      <CardHead>
        <h2>Portefeuille</h2>
        <input
          type="search" className="head-search" placeholder="Nom, SIRET, dirigeant…"
          value={q} onChange={e => onQ(e.target.value)}
        />
      </CardHead>

      <ChipFilter options={STATUTS} value={statut} onChange={onStatut} />

      <ul className="client-list">
        {liste.length === 0 ? (
          <li style={{ justifyContent: "center", color: "var(--ink-faint)", cursor: "default" }}>Aucun client</li>
        ) : liste.map(c => (
          <li
            key={c.siret}
            className={c.siret === courant ? "is-on" : undefined}
            onClick={() => onSelect(c.siret)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(c.siret); } }}
            role="button"
            tabIndex={0}
            aria-pressed={c.siret === courant}
          >
            <span className="cl-ini">{initiales(c.nom)}</span>
            <span className="grow">
              <span className="cl-nom">{c.nom}</span><br />
              <span className="cl-meta">{c.secteur} · {c.dossiers} dossier{c.dossiers > 1 ? "s" : ""}</span>
            </span>
            <Badge tone={STATUT_TON[c.statut]}>{c.statut}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
