"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/shell/Sidebar";
import Copilote from "@/components/shell/Copilote";
import { useMediaQuery } from "@/lib/hooks";

const SidebarContext = createContext(null);
export const useSidebar = () => useContext(SidebarContext);

const CLE = "alumny_sidebar";
const MOBILE = "(max-width: 860px)";

/* Coquille applicative :
   - desktop : barre latérale repliable en rail d'icônes (état mémorisé)
   - mobile  : tiroir superposé avec voile de fond
   Les états restent portés par des classes sur <body>, exactement comme
   dans la maquette, pour que la feuille de style commune fonctionne à l'identique. */
export default function AppShell({ children }) {
  const mobile = useMediaQuery(MOBILE);
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  /* Relecture de la préférence desktop après le montage (pas d'écart d'hydratation). */
  useEffect(() => {
    try {
      if (window.localStorage.getItem(CLE) === "collapsed") setCollapsed(true);
    } catch { /* stockage indisponible */ }
  }, []);

  /* Synchronisation des classes de <body> attendues par common.css */
  useEffect(() => {
    document.body.classList.toggle("nav-collapsed", collapsed);
    document.body.classList.toggle("nav-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [collapsed, open]);

  /* Le tiroir mobile n'a pas de sens une fois revenu en desktop. */
  useEffect(() => { if (!mobile) setOpen(false); }, [mobile]);

  const fermer = useCallback(() => setOpen(false), []);

  const toggle = useCallback(() => {
    if (window.matchMedia(MOBILE).matches) {
      setOpen(o => !o);
    } else {
      setCollapsed(c => {
        const suivant = !c;
        try { window.localStorage.setItem(CLE, suivant ? "collapsed" : "expanded"); } catch { /* ignore */ }
        return suivant;
      });
    }
  }, []);

  useEffect(() => {
    const surTouche = e => { if (e.key === "Escape") fermer(); };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [fermer]);

  const valeur = useMemo(() => ({ toggle, fermer, collapsed, open, mobile }), [toggle, fermer, collapsed, open, mobile]);

  return (
    <SidebarContext.Provider value={valeur}>
      <div className="layout">
        <Sidebar onNavigate={() => { if (mobile) fermer(); }} />
        <div className="scrim" id="scrim" onClick={fermer} />
        <div className="main">{children}</div>
      </div>
      <Copilote />
    </SidebarContext.Provider>
  );
}
