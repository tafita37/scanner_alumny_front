"use client";

import { useEffect } from "react";
import Link from "next/link";
import PageShell from "@/components/shell/PageShell";
import KpiCard from "@/components/ui/KpiCard";
import { Placeholder } from "@/components/ui/Misc";
import DossiersTable from "@/components/dashboard/DossiersTable";
import DashboardAside from "@/components/dashboard/DashboardAside";
import { useUser } from "@/context/UserContext";
import { useUi } from "@/context/UiContext";

const KPIS = [
  { label: "Dossiers actifs", valeur: 6, pied: "sur 8 dossiers au total" },
  { label: "Fuite détectée (cumul 2026)", valeur: 297800, suffixe: " €", pied: "sur 5 audits finalisés", blob: "var(--sky)" },
  { label: "Score moyen /100", valeur: 63, pied: "↑ 4 pts vs trimestre précédent", blob: "var(--gold-soft)" },
  { label: "Délai moyen d'audit", valeur: 4, suffixe: " j", pied: "dépôt des pièces → rapport remis", blob: "var(--pale)" }
];

export default function DashboardView() {
  const { user } = useUser();
  const { toast } = useUi();
  const prenom = user.nom.split(" ")[0];

  useEffect(() => {
    const id = setTimeout(
      () => toast("Job RGPD quotidien exécuté : aucune fiche à purger aujourd'hui.", "ok"),
      1200
    );
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <PageShell
      section="Pilotage"
      title="Tableau de bord"
      actions={
        <>
          <Link className="btn btn-ghost btn-s" href="/audits">Audits en cours</Link>
          <Link className="btn" href="/nouveau-dossier">+ Nouvel audit</Link>
        </>
      }
    >
      <section className="hello">
        <div>
          <p className="hand">
            {user.role === "Consultant" ? "Prêt pour un nouvel audit ?" : "Content de te revoir !"}
          </p>
          <h1>Bonjour {prenom} — 3 dossiers demandent ton attention</h1>
          <p className="muted">Mercredi 12 août 2026 · 2 audits en cours d&apos;analyse, 1 rapport à générer.</p>
        </div>
        <Placeholder className="hello-art" aria-hidden="true">
          illustration d&apos;accueil<br />(à fournir)
        </Placeholder>
      </section>

      <div className="grid g-4 mt">
        {KPIS.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="dash-cols mt">
        <DossiersTable />
        <DashboardAside />
      </div>
    </PageShell>
  );
}
