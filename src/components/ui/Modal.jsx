"use client";

import { useEffect } from "react";

export default function Modal({ children, onClose }) {
  useEffect(() => {
    const surTouche = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [onClose]);

  return (
    <div
      className="modal-back"
      role="presentation"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}

/* Pied de modale : boutons alignés à droite, empilés sur petit écran. */
export function ModalActions({ children }) {
  return <div className="row-end mt">{children}</div>;
}
