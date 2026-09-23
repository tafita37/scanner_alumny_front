"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/shell/PageShell";
import Badge from "@/components/ui/Badge";
import DepotPieces from "@/components/documents/DepotPieces";
import PipelineExtraction, { ETAPES_PIPELINE } from "@/components/documents/PipelineExtraction";
import AnomaliesDetectees from "@/components/documents/AnomaliesDetectees";
import ExtractionPanel from "@/components/documents/ExtractionPanel";
import DocumentsAside from "@/components/documents/DocumentsAside";
import { useUi } from "@/context/UiContext";

const FICHIERS_INITIAUX = [
  { nom: "devis-2024-118.pdf", type: "PDF", taille: "412 Ko", etat: "extrait (natif)", cat: "Devis" },
  { nom: "devis-2024-121.pdf", type: "PDF", taille: "388 Ko", etat: "extrait (natif)", cat: "Devis" },
  { nom: "facture-scan-0392.jpg", type: "JPG", taille: "2,1 Mo", etat: "extrait (OCR)", cat: "Facture" },
  { nom: "bilan-2024-batiduran.pdf", type: "PDF", taille: "1,4 Mo", etat: "extrait (natif)", cat: "Bilan comptable" }
];

const CHAMPS_INITIAUX = [
  { k: "taux_horaire_mo", label: "Taux horaire main-d'œuvre", val: "42,00 €/h", conf: 0.97 },
  { k: "volume_heures", label: "Volume d'heures facturé", val: "38 h", conf: 0.95 },
  { k: "montant_fournitures", label: "Montant fournitures", val: "6 240,00 €", conf: 0.93 },
  { k: "marge_brute_apparente", label: "Marge brute apparente", val: "21,4 %", conf: 0.88 },
  { k: "conditions_paiement", label: "Conditions de paiement", val: "75 jours fin de mois", conf: 0.61 },
  { k: "client_final", label: "Client final (nominatif)", val: "Sophie Arnaud", conf: 0.99, pii: true },
  { k: "masse_salariale", label: "Masse salariale (bilan)", val: "704 000 €", conf: 0.96 },
  { k: "charges_fixes", label: "Charges fixes de structure (bilan)", val: "188 500 €", conf: 0.94 }
];

export default function DocumentsView() {
  const [fichiers, setFichiers] = useState(FICHIERS_INITIAUX);
  const [champs, setChamps] = useState(CHAMPS_INITIAUX);
  const [masque, setMasque] = useState(true);
  const [moteur, setMoteur] = useState("local");
  const [pipeline, setPipeline] = useState({ encours: false, index: 0 });
  const timers = useRef([]);
  const { toast } = useUi();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* Déroulé animé du pipeline, étape par étape. */
  const lancerPipeline = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPipeline({ encours: true, index: 0 });

    let cumul = 0;
    ETAPES_PIPELINE.forEach((e, i) => {
      cumul += e.duree;
      timers.current.push(setTimeout(() => {
        if (i === ETAPES_PIPELINE.length - 1) {
          setPipeline({ encours: false, index: 0 });
          toast("Extraction terminée — 1 champ à valider manuellement.", "gold");
        } else {
          setPipeline({ encours: true, index: i + 1 });
        }
      }, cumul));
    });
  };

  const ajouterFichier = () => {
    setFichiers(f => [...f, { nom: "devis-2024-127.pdf", type: "PDF", taille: "356 Ko", etat: "en attente", cat: "Devis" }]);
    toast("Document ajouté au dossier — lancement du pipeline.");
    lancerPipeline();
  };

  const supprimerFichier = index => setFichiers(f => f.filter((_, i) => i !== index));

  const corrigerChamp = (index, valeur) =>
    setChamps(list => list.map((c, i) => (i === index ? { ...c, val: valeur, conf: 1 } : c)));

  const besoins = [
    ["Au moins 1 devis", fichiers.some(f => f.cat === "Devis")],
    ["Facture (recoupement)", fichiers.some(f => f.cat === "Facture")],
    ["Bilan comptable", fichiers.some(f => f.cat === "Bilan comptable")],
    ["Opt-in RGPD", true],
    ["Questionnaire d'appoint", false]
  ];

  return (
    <PageShell
      section="Audit · Module 2"
      title="Analyse documentaire (OCR & IA)"
      actions={
        <>
          <Badge tone="sky" dot>D-2026-041 · Bâti Duran SARL · BTP</Badge>
          <Link className="btn btn-ghost btn-s" href="/cockpit">Aller au cockpit</Link>
        </>
      }
    >
      <div className="doc-cols">
        <section className="col gap-l">
          <DepotPieces fichiers={fichiers} onAjouter={ajouterFichier} onSupprimer={supprimerFichier} />
          <PipelineExtraction
            etat={pipeline}
            moteur={moteur}
            onMoteur={setMoteur}
            onRelancer={lancerPipeline}
          />
          <AnomaliesDetectees />
          <ExtractionPanel
            champs={champs}
            masque={masque}
            onMasque={valeur => {
              setMasque(valeur);
              toast(valeur ? "Valeurs re-masquées." : "Démasquage via la table de correspondance locale.");
            }}
            onCorriger={corrigerChamp}
          />
        </section>

        <DocumentsAside besoins={besoins} />
      </div>
    </PageShell>
  );
}
