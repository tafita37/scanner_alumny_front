"use client";

import { useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Note from "@/components/ui/Note";
import Badge from "@/components/ui/Badge";
import { Placeholder } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { useUi } from "@/context/UiContext";

export default function DepotPieces({ fichiers, onAjouter, onSupprimer }) {
  const [survol, setSurvol] = useState(false);
  const { toast, openModal, closeModal } = useUi();

  const confirmerSuppression = index => openModal(
    <>
      <h2>Supprimer ce document ?</h2>
      <p>
        La suppression porte sur le <b>fichier physique stocké</b>, pas seulement sur sa référence en base.
        Les résultats de calcul du dossier seront recalculés en cascade.
      </p>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
        <button
          className="btn btn-danger" type="button"
          onClick={() => {
            closeModal();
            onSupprimer(index);
            toast("Document supprimé — recalcul du dossier déclenché.");
          }}
        >
          Supprimer
        </button>
      </ModalActions>
    </>
  );

  const apercu = fichier => openModal(
    <>
      <h2>{fichier.nom}</h2>
      <Placeholder style={{ height: 320, marginTop: 14 }}>
        aperçu du fichier original<br />(visionneuse PDF / image)
      </Placeholder>
      <p className="hint mt-s">Vue côte à côte : document source ↔ extraction JSON associée.</p>
      <ModalActions><button className="btn" type="button" onClick={closeModal}>Fermer</button></ModalActions>
    </>
  );

  return (
    <Card>
      <CardHead><h2>Dépôt de pièces</h2><span className="hand">glisse-dépose tes fichiers 📄</span></CardHead>

      <div
        className={"drop" + (survol ? " is-over" : "")}
        onDragEnter={e => { e.preventDefault(); setSurvol(true); }}
        onDragOver={e => { e.preventDefault(); setSurvol(true); }}
        onDragLeave={e => { e.preventDefault(); setSurvol(false); }}
        onDrop={e => { e.preventDefault(); setSurvol(false); onAjouter(); }}
      >
        <div className="drop-ico">⇪</div>
        <b>Dépose devis, factures et bilan comptable</b>
        <span className="small muted">PDF, JPG, PNG — 20 Mo max par fichier</span>
        <button className="btn btn-soft btn-s mt-s" type="button" onClick={onAjouter}>Simuler un dépôt</button>
      </div>

      <Note tone="gold" ico="ⓘ" className="mt">
        Le <b>bilan comptable est déposé par le consultant</b>, jamais récupéré automatiquement : c&apos;est la
        source de la masse salariale et des charges fixes de structure utilisées par le moteur de calcul.
      </Note>

      <ul className="files mt">
        {fichiers.map((f, i) => (
          <li key={f.nom + i} style={{ animationDelay: `${i * 50}ms` }}>
            <span className="file-ico">{f.type}</span>
            <span className="grow">
              <span className="file-nom">{f.nom}</span><br />
              <span className="file-meta">{f.cat} · {f.taille} · {f.etat}</span>
            </span>
            <Badge tone={f.etat.includes("OCR") ? "gold" : "ok"}>{f.etat}</Badge>
            <span className="tbl-actions">
              <button className="btn btn-icon" type="button" title="Voir le fichier original" onClick={() => apercu(f)}>◱</button>
              <button className="btn btn-icon" type="button" title="Supprimer (fichier + référence)" onClick={() => confirmerSuppression(i)}>✕</button>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
