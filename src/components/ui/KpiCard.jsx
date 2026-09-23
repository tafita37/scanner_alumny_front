"use client";

import { useAnimatedNumber } from "@/lib/hooks";
import { groupe } from "@/lib/format";

/* Indicateur clé du tableau de bord, avec compteur animé au montage. */
export default function KpiCard({ label, valeur, suffixe = "", pied, blob }) {
  const anime = useAnimatedNumber(valeur);

  return (
    <article className="card kpi reveal">
      <div className="kpi-blob" style={blob ? { background: blob } : undefined} />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{groupe(anime)}{suffixe}</div>
      <div className="kpi-foot">{pied}</div>
    </article>
  );
}
