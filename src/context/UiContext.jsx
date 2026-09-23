"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import ToastZone from "@/components/ui/ToastZone";
import Modal from "@/components/ui/Modal";

const UiContext = createContext(null);

/* Fournit les deux briques d'interface transverses de la maquette :
   - toast(message, type)  → bandeau éphémère en bas à droite
   - openModal(<contenu/>) → fenêtre modale centrée                */
export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const seq = useRef(0);

  const fermerToast = useCallback(id => {
    setToasts(list => list.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message, type = "") => {
    const id = ++seq.current;
    setToasts(list => [...list, { id, message, type }]);
    setTimeout(() => fermerToast(id), 3700);
  }, [fermerToast]);

  const closeModal = useCallback(() => setModal(null), []);
  const openModal = useCallback(contenu => setModal({ contenu }), []);

  const valeur = useMemo(() => ({ toast, openModal, closeModal }), [toast, openModal, closeModal]);

  return (
    <UiContext.Provider value={valeur}>
      {children}
      <ToastZone toasts={toasts} onClose={fermerToast} />
      {modal && <Modal onClose={closeModal}>{modal.contenu}</Modal>}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi doit être utilisé dans <UiProvider>");
  return ctx;
}
