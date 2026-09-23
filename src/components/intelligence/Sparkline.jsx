/* Courbe d'indice matière première : historique en or, projection en pointillés. */
export default function Sparkline({ graine }) {
  const pts = [];
  let v = 18;
  for (let i = 0; i < 10; i++) {
    v += Math.sin(i * graine) * 4 + (graine > 1 ? 1 : -0.6);
    pts.push([i * 11, Math.max(4, Math.min(26, v))]);
  }
  const dernier = pts[pts.length - 1];
  const proj = [];
  for (let i = 0; i < 4; i++) {
    proj.push([
      dernier[0] + (i + 1) * 11,
      Math.max(4, Math.min(26, dernier[1] - (graine > 1 ? 2 : -1.4) * (i + 1)))
    ]);
  }

  const chaine = liste => liste.map(p => p.map(n => n.toFixed(2)).join(",")).join(" ");

  return (
    <svg className="spark" viewBox="0 0 150 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={chaine(pts)} />
      <polyline className="proj" points={chaine([dernier, ...proj])} />
    </svg>
  );
}
