"use client";

import Topbar from "@/components/shell/Topbar";

/* Enveloppe commune à toutes les pages de l'application :
   la topbar (section + titre + actions) puis la zone de contenu. */
export default function PageShell({ section, title, actions, children }) {
  return (
    <>
      <Topbar section={section} title={title} actions={actions} />
      <div className="content" id="content">{children}</div>
    </>
  );
}
