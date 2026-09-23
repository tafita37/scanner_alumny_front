"use client";

import { useSidebar } from "@/components/shell/AppShell";

/* Barre supérieure : bouton de menu, fil d'Ariane, titre de page
   et zone d'actions propre à chaque écran. */
export default function Topbar({ section, title, actions }) {
  const { toggle } = useSidebar();

  return (
    <header className="topbar">
      <button
        className="burger"
        id="burger"
        type="button"
        title="Afficher / masquer le menu"
        aria-label="Afficher ou masquer le menu"
        onClick={toggle}
      >
        <i /><i /><i />
      </button>

      <div className="grow topbar-titles">
        <div className="crumb">Alumny · <b>{section}</b></div>
        <div className="page-title">{title}</div>
      </div>

      <div className="row gap-s wrap" id="topbar-actions">{actions}</div>
    </header>
  );
}
