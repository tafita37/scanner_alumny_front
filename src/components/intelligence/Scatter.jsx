"use client";

import { useEffect, useState } from "react";

/* Nuage de points du clustering.
   Les positions sont tirées au sort côté client uniquement : le premier rendu
   (serveur comme navigateur) est vide, ce qui évite tout écart d'hydratation. */
export default function Scatter({ graine }) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    setPoints(Array.from({ length: 46 }, (_, i) => ({
      cl: i % 3 === 0 ? "" : i % 3 === 1 ? "c2" : "c3",
      x: 8 + Math.random() * 84,
      y: 10 + Math.random() * 78,
      delai: i * 8
    })));
  }, [graine]);

  return (
    <div className="scatter">
      {points.map((p, i) => (
        <span
          key={i}
          className={`pt ${p.cl}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.delai}ms` }}
        />
      ))}
      <span className="pt moi" style={{ left: "31%", top: "64%" }} />
      <span className="pt-lbl" style={{ left: "31%", top: "64%" }}>client audité</span>
      <span className="scatter-ax">x : effectif · y : coût unitaire · couleur : cluster</span>
    </div>
  );
}
