"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------
   Compteur animé — équivalent de animateNumber() de la maquette.
   Rend « 0 » au premier rendu (donc identique au HTML serveur)
   puis anime jusqu'à la valeur cible.
   ------------------------------------------------------------ */
export function useAnimatedNumber(cible, duree = 900) {
  const [valeur, setValeur] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const depart = performance.now();
    const tick = maintenant => {
      const p = Math.min(1, (maintenant - depart) / duree);
      const adouci = 1 - Math.pow(1 - p, 3);
      setValeur(Math.round(cible * adouci));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [cible, duree]);

  return valeur;
}

/* Media query réactive (utilisée pour distinguer tiroir mobile / rail desktop) */
export function useMediaQuery(query) {
  const [match, setMatch] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatch(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return match;
}
