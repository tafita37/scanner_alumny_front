"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DOSSIERS, SECTEURS } from "@/data/al";
import { fmtEur } from "@/lib/format";
import Card, { CardHead } from "@/components/ui/Card";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import { Table, TableWrap } from "@/components/ui/Misc";

const STATUTS = ["brouillon", "documents en attente", "en cours d'analyse", "analysé", "rapport généré", "archivé"];
const CONSULTANTS = ["Ny Aina R.", "Tafita A."];

export default function DossiersTable() {
  const [secteur, setSecteur] = useState("tous");
  const [statut, setStatut] = useState("tous");
  const [consultant, setConsultant] = useState("tous");
  const [q, setQ] = useState("");

  const liste = useMemo(() => {
    const requete = q.toLowerCase().trim();
    return DOSSIERS.filter(d =>
      (secteur === "tous" || d.secteur === secteur) &&
      (statut === "tous" || d.statut === statut) &&
      (consultant === "tous" || d.consultant === consultant) &&
      (requete === "" || `${d.client} ${d.ref} ${d.siret}`.toLowerCase().includes(requete))
    );
  }, [secteur, statut, consultant, q]);

  return (
    <Card>
      <CardHead>
        <h2>Dossiers</h2>
        <input
          type="search" className="head-search" placeholder="Rechercher un client, une référence…"
          value={q} onChange={e => setQ(e.target.value)}
        />
      </CardHead>

      <div className="row gap-s wrap mb">
        <Chip active={secteur === "tous"} onClick={() => setSecteur("tous")}>Tous secteurs</Chip>
        {SECTEURS.map(s => (
          <Chip key={s} active={secteur === s} onClick={() => setSecteur(s)}>{s}</Chip>
        ))}
        <span className="v-sep" />
        <select
          className="select-auto is-wide" value={statut} aria-label="Filtrer par statut"
          onChange={e => setStatut(e.target.value)}
        >
          <option value="tous">Tous les statuts</option>
          {STATUTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          className="select-auto" value={consultant} aria-label="Filtrer par consultant"
          onChange={e => setConsultant(e.target.value)}
        >
          <option value="tous">Tous les consultants</option>
          {CONSULTANTS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>Référence</th><th>Client</th><th>Secteur</th><th>Statut</th>
              <th className="right">Score</th><th className="right">Fuite estimée</th>
              <th>Consultant</th><th>MAJ</th><th />
            </tr>
          </thead>
          <tbody>
            {liste.length === 0 ? (
              <tr className="empty-row"><td colSpan={9}>Aucun dossier ne correspond à ces filtres.</td></tr>
            ) : liste.map(d => (
              <tr key={d.ref}>
                <td className="ref">{d.ref}</td>
                <td>
                  <span className="cell-strong">{d.client}</span><br />
                  <span className="tiny faint mono">{d.siret}</span>
                </td>
                <td><Badge tone="sky">{d.secteur}</Badge></td>
                <td><StatusBadge statut={d.statut} /></td>
                <td className="right">
                  {d.score !== null
                    ? <><b>{d.score}</b><span className="faint">/100</span></>
                    : <span className="faint">—</span>}
                </td>
                <td className="right nowrap">
                  {d.fuite !== null
                    ? <b style={{ color: "var(--gold)" }}>{fmtEur(d.fuite)}</b>
                    : <span className="faint">—</span>}
                </td>
                <td className="small">{d.consultant}</td>
                <td className="small faint nowrap">{d.maj}</td>
                <td>
                  <div className="tbl-actions">
                    <Link className="btn btn-icon" href="/cockpit" title="Cockpit">◎</Link>
                    <Link className="btn btn-icon" href="/documents" title="Documents">▤</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      <p className="hint mt-s">
        {liste.length} dossier{liste.length > 1 ? "s" : ""} affiché{liste.length > 1 ? "s" : ""} sur {DOSSIERS.length}.
      </p>
    </Card>
  );
}
