"use client";

import { useMemo, useState } from "react";
import DepotPieces from "@/components/documents/DepotPieces";
import PipelineExtraction from "@/components/documents/PipelineExtraction";
import AnomaliesDetectees from "@/components/documents/AnomaliesDetectees";
import ExtractionPanel from "@/components/documents/ExtractionPanel";
// import DocumentsAside from "@/components/documents/DocumentsAside";
import { useExtractionDocuments } from "@/components/documents/useExtractionDocuments";
import { detecterAnomalies } from "@/lib/extraction";
import { useUi } from "@/context/UiContext";

/* Étape 2 du dossier d'audit : dépôt des pièces, extraction par l'API et relecture des champs.
   auditId : id de l'audit auquel rattacher les pièces · onSuivant : passe aux questions de l'agent */
export default function EtapeDocuments({ auditId, onSuivant }) {
  const [selection, setSelection] = useState(null);
  const { toast } = useUi();
  const { docs, journal, actifId, chargement, recharger, ajouter, supprimer, relancer, corriger } = useExtractionDocuments({ auditId, toast });

  const extraits = docs.filter(d => d.statut === "extrait");
  const enFile = docs.filter(d => d.statut === "attente").length;
  const anomalies = useMemo(() => detecterAnomalies(docs), [docs]);

  // Le pipeline suit le document en cours ; à défaut, celui que l'utilisateur a sélectionné.
  const docSuivi = docs.find(d => d.id === actifId) || docs.find(d => d.id === selection) || docs.at(-1) || null;
  const docExtrait = extraits.find(d => d.id === selection) || extraits.at(-1) || null;

  const supprimerDoc = async id => {
    if (await supprimer(id)) setSelection(s => (s === id ? null : s));
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
          chargement={chargement}
          onRecharger={recharger}
          selection={docSuivi?.id}
          onSelection={setSelection}
          onAjouter={ajouter}
          onSupprimer={supprimerDoc}
          onRelancer={relancer}
        />
        <PipelineExtraction doc={docSuivi} enFile={enFile} journal={journal} onRelancer={relancer} />
        <AnomaliesDetectees anomalies={anomalies} nbExtraits={extraits.length} />
        <ExtractionPanel docs={extraits} doc={docExtrait} onSelection={setSelection} onCorriger={corriger} />

        <div className="row-between">
          <span className="hint">
            {extraits.length
              ? `${extraits.length} document${extraits.length > 1 ? "s" : ""} extrait${extraits.length > 1 ? "s" : ""} — l'agent s'en sert pour préparer ses questions.`
              : "Au moins un document extrait est nécessaire pour que l'agent prépare ses questions."}
          </span>
          <button className="btn" type="button" disabled={Boolean(actifId) || enFile > 0 || !extraits.length} onClick={onSuivant}>
            Passer aux questions →
          </button>
        </div>
      </section>

      {/* <DocumentsAside besoins={besoins} /> */}
    </div>
  );
}
