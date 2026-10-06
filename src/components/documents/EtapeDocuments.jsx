"use client";

import { useMemo, useState } from "react";
import DepotPieces from "@/components/documents/DepotPieces";
import PipelineExtraction from "@/components/documents/PipelineExtraction";
import AnomaliesDetectees from "@/components/documents/AnomaliesDetectees";
import ExtractionPanel from "@/components/documents/ExtractionPanel";
// import DocumentsAside from "@/components/documents/DocumentsAside";
import { useExtractionDocuments } from "@/components/documents/useExtractionDocuments";
import { detecterAnomalies } from "@/lib/extractionSimulee";
import { useUi } from "@/context/UiContext";

/* Étape 2 du dossier d'audit : dépôt des pièces, extraction et validation des champs.
   L'extraction est simulée côté front (voir useExtractionDocuments) en attendant l'API.
   onSuivant : passe au cockpit */
export default function EtapeDocuments({ onSuivant }) {
  const [masque, setMasque] = useState(true);
  const [moteur, setMoteur] = useState("local");
  const [selection, setSelection] = useState(null);
  const { toast } = useUi();
  const { docs, journal, actifId, ajouter, supprimer, relancer, corriger } = useExtractionDocuments({ moteur, toast });

  const extraits = docs.filter(d => d.statut === "extrait");
  const enFile = docs.filter(d => d.statut === "attente").length;
  const anomalies = useMemo(() => detecterAnomalies(docs), [docs]);

  // Le pipeline suit le document en cours ; à défaut, celui que l'utilisateur a sélectionné.
  const docSuivi = docs.find(d => d.id === actifId) || docs.find(d => d.id === selection) || docs.at(-1) || null;
  const docExtrait = extraits.find(d => d.id === selection) || extraits.at(-1) || null;

  const supprimerDoc = id => {
    supprimer(id);
    if (selection === id) setSelection(null);
    toast("Document supprimé — recalcul du dossier déclenché.");
  };

  // const besoins = [
  //   ["Au moins 1 devis", extraits.some(d => d.categorie === "Devis")],
  //   ["Facture (recoupement)", extraits.some(d => d.categorie === "Facture")],
  //   ["Bilan comptable", extraits.some(d => d.categorie === "Bilan comptable")],
  //   ["Opt-in RGPD", true],
  //   ["Questionnaire d'appoint", true]
  // ];

  return (
    <div className="doc-cols">
      <section className="col gap-l">
        <DepotPieces
          docs={docs}
          selection={docSuivi?.id}
          onSelection={setSelection}
          onAjouter={ajouter}
          onSupprimer={supprimerDoc}
          onRelancer={relancer}
        />
        <PipelineExtraction
          doc={docSuivi}
          enFile={enFile}
          journal={journal}
          moteur={moteur}
          onMoteur={setMoteur}
          onRelancer={relancer}
        />
        <AnomaliesDetectees anomalies={anomalies} nbExtraits={extraits.length} />
        <ExtractionPanel
          docs={extraits}
          doc={docExtrait}
          onSelection={setSelection}
          masque={masque}
          onMasque={valeur => {
            setMasque(valeur);
            toast(valeur ? "Valeurs re-masquées." : "Démasquage via la table de correspondance locale.");
          }}
          onCorriger={corriger}
        />

        <div className="row-between">
          <span className="hint">
            {extraits.length
              ? `${extraits.length} document${extraits.length > 1 ? "s" : ""} extrait${extraits.length > 1 ? "s" : ""} — les champs validés alimentent le cockpit du dossier.`
              : "Les champs validés alimentent le cockpit du dossier."}
          </span>
          <button className="btn" type="button" disabled={Boolean(actifId) || enFile > 0} onClick={onSuivant}>
            Passer au cockpit →
          </button>
        </div>
      </section>

      {/* <DocumentsAside besoins={besoins} /> */}
    </div>
  );
}
