import DossierView from "@/components/audits/DossierView";

export const metadata = { title: "Dossier d'audit" };

/* /audits/<ref>?etape=<n> : n ouvre directement une étape déjà atteinte du dossier. */
export default async function PageDossier({ params, searchParams }) {
  const { ref } = await params;
  const { etape } = await searchParams;
  const n = Number.parseInt(etape, 10);
  return <DossierView refDossier={decodeURIComponent(ref)} etapeDemandee={Number.isNaN(n) ? null : n} />;
}
