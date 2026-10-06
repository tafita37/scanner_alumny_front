"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/shell/PageShell";
import Card, { CardHead } from "@/components/ui/Card";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import { Bar, Spinner, Table, TableWrap } from "@/components/ui/Misc";
import Note from "@/components/ui/Note";
import { useDossiers } from "@/context/DossiersContext";
import { ETAPES_AUDIT, estEnCours, libelleEtape, lienDossier } from "@/lib/dossiers";

/* Filtre d'avancement : par défaut, seuls les audits où il reste quelque chose à faire. */
const AVANCEMENTS = [
  { id: "en-cours", label: "En cours", garde: estEnCours },
  { id: "termines", label: "Terminés", garde: d => !estEnCours(d) },
  { id: "tous", label: "Tous", garde: () => true }
];

/* Liste des audits : un clic reprend le dossier là où il s'est arrêté. */
export default function AuditsView() {
  const { dossiers, charge, erreur, recharger } = useDossiers();
  const [avancement, setAvancement] = useState("en-cours");
  const [etape, setEtape] = useState(0);
  const [q, setQ] = useState("");

  /* Liste relue à chaque ouverture de la page : on voit aussi les audits créés par les collègues. */
  useEffect(() => { recharger(); }, [recharger]);

  const nbEnCours = useMemo(() => dossiers.filter(estEnCours).length, [dossiers]);

  const liste = useMemo(() => {
    const { garde } = AVANCEMENTS.find(a => a.id === avancement);
    const requete = q.toLowerCase().trim();
    return dossiers.filter(d =>
      garde(d) &&
      (etape === 0 || d.etape === etape) &&
      (requete === "" || `${d.client} ${d.ref} ${d.siret}`.toLowerCase().includes(requete))
    );
  }, [dossiers, avancement, etape, q]);

  return (
    <PageShell
      section="Audit"
      title="Audits"
      actions={<Link className="btn" href="/nouveau-dossier">+ Nouvel audit</Link>}
    >
      <Card>
        <CardHead>
          <h2>Dossiers</h2>
          <input
            type="search" className="head-search" placeholder="Rechercher un client, une référence…"
            value={q} onChange={e => setQ(e.target.value)}
          />
        </CardHead>

        {erreur && (
          <Note tone="gold" ico="!" className="mb">
            Liste des audits indisponible : {erreur}{" "}
            <button className="btn btn-ghost btn-s" type="button" onClick={recharger}>Réessayer</button>
          </Note>
        )}

        <div className="row gap-s wrap mb">
          <Chip active={etape === 0} onClick={() => setEtape(0)}>Toutes les étapes</Chip>
          {ETAPES_AUDIT.map(e => (
            <Chip key={e.n} active={etape === e.n} onClick={() => setEtape(e.n)}>{e.n}. {e.label}</Chip>
          ))}
          <span className="v-sep" />
          <select
            className="select-auto" value={avancement} aria-label="Filtrer par avancement"
            onChange={e => setAvancement(e.target.value)}
          >
            {AVANCEMENTS.map(a => (
              <option key={a.id} value={a.id}>
                {a.label} ({dossiers.filter(a.garde).length})
              </option>
            ))}
          </select>
        </div>

        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Secteur</th>
                <th>Étape</th>
                <th>MAJ</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {!charge ? (
                <tr className="empty-row"><td colSpan={6}><Spinner /> Chargement des audits…</td></tr>
              ) : liste.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={6}>
                    {dossiers.length === 0 ? "Aucun audit pour le moment." : "Aucun dossier ne correspond à ces filtres."}
                  </td>
                </tr>
              ) : liste.map(d => {
                const termine = !estEnCours(d);
                return (
                <tr key={d.ref}>
                  <td className="ref">{d.ref}</td>
                  <td>
                    <Link className="cell-strong" href={lienDossier(d.ref)}>{d.client}</Link><br />
                    <span className="tiny faint mono">{d.siret}</span>
                  </td>
                  <td><Badge tone="sky">{d.secteur}</Badge></td>
                  <td style={{ minWidth: 150 }}>
                    {termine ? (
                      <StatusBadge statut={d.statut} />
                    ) : (
                      <>
                        <span className="small">{d.etape}/{ETAPES_AUDIT.length} · {libelleEtape(d.etape)}</span>
                        <Bar value={d.etape / ETAPES_AUDIT.length * 100} className="mt-s" />
                      </>
                    )}
                  </td>
                  {/* <td><StatusBadge statut={d.statut} /></td> */}
                  <td className="small faint nowrap">{d.maj}</td>
                  <td>
                    {termine
                      ? <Link className="btn btn-ghost btn-s" href={lienDossier(d.ref)}>Ouvrir</Link>
                      : <Link className="btn btn-s" href={lienDossier(d.ref)}>Continuer →</Link>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>

        <p className="hint mt-s">
          {liste.length} dossier{liste.length > 1 ? "s" : ""} affiché{liste.length > 1 ? "s" : ""} sur {dossiers.length}
          {" "}· {nbEnCours} audit{nbEnCours > 1 ? "s" : ""} en cours.
        </p>
      </Card>
    </PageShell>
  );
}
