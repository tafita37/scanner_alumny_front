"use client";

import { useRef, useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Note from "@/components/ui/Note";
import Badge from "@/components/ui/Badge";
import { Bar, Placeholder, Spinner } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { useUi } from "@/context/UiContext";
import { ACCEPT, ETAPES_PIPELINE } from "@/lib/extractionSimulee";

/* Libellé, teinte du badge et avancement global (0-100) d'un document. */
function suivi(d) {
  if (d.statut === "attente") return { label: "en file d'attente", tone: "ink", pct: 0 };
  if (d.statut === "upload") return { label: `téléversement ${d.progression} %`, tone: "sky", pct: d.progression * 0.3 };
  if (d.statut === "analyse") {
    const faites = d.etapes.filter(e => e.statut !== "attente" && e.statut !== "run").length;
    const n = Math.min(faites + 1, ETAPES_PIPELINE.length);
    return { label: `analyse · étape ${n}/${ETAPES_PIPELINE.length}`, tone: "warn", pct: 30 + faites / ETAPES_PIPELINE.length * 70 };
  }
  if (d.statut === "erreur") return { label: "échec", tone: "bad", pct: 100 };
  return { label: `extrait (${d.mode})`, tone: d.mode === "OCR" ? "gold" : "ok", pct: 100 };
}

export default function DepotPieces({ docs, chargement, onRecharger, selection, onSelection, onAjouter, onSupprimer, onRelancer }) {
  const [survol, setSurvol] = useState(false);
  const input = useRef(null);
  const { openModal, closeModal } = useUi();

  const confirmerSuppression = d => openModal(
    <>
      <h2>Supprimer ce document ?</h2>
      <p>
        La suppression porte sur le <b>fichier physique stocké</b>, pas seulement sur sa référence en base.
        Les résultats de calcul du dossier seront recalculés en cascade.
      </p>
      {(d.statut === "upload" || d.statut === "analyse") && (
        <Note tone="gold" ico="!" className="mt">Le traitement en cours de ce document sera interrompu.</Note>
      )}
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
        <button className="btn btn-danger" type="button" onClick={() => { closeModal(); onSupprimer(d.id); }}>
          Supprimer
        </button>
      </ModalActions>
    </>
  );

  const apercu = d => openModal(
    <>
      <h2>{d.nom}</h2>
      {d.url ? (
        <div className="apercu mt">
          {d.type === "PDF"
            ? <iframe src={d.url} title={`Aperçu de ${d.nom}`} />
            : // eslint-disable-next-line @next/next/no-img-element
              <img src={d.url} alt={`Aperçu de ${d.nom}`} />}
        </div>
      ) : (
        <Placeholder style={{ height: 220, marginTop: 14 }}>
          aperçu indisponible<br />(pas encore de route de téléchargement du fichier)
        </Placeholder>
      )}
      {d.serveur && (
        <dl className="doc-serveur mt">
          <dt>Référence</dt><dd>document #{d.serveur.id}</dd>
          <dt>Stocké sous</dt><dd className="mono">{d.serveur.nomStocke}</dd>
          <dt>Déposé le</dt><dd>{d.serveur.creeLe.split("-").reverse().join("/")}</dd>
          <dt>Taille</dt><dd>{d.taille}</dd>
        </dl>
      )}
      <p className="hint mt-s">
        {d.statut === "extrait"
          ? <>{d.champs.length} champs extraits · {d.categorie} n°{d.numero}</>
          : "Extraction pas encore disponible pour ce document."}
      </p>
      <ModalActions><button className="btn" type="button" onClick={closeModal}>Fermer</button></ModalActions>
    </>
  );

  const deposer = files => {
    if (files?.length) onAjouter(files);
  };

  const enFile = docs.filter(d => d.statut === "attente").length;

  return (
    <Card>
      <CardHead>
        <h2>Dépôt de pièces</h2>
        {enFile > 0
          ? <Badge tone="ink">{enFile} en file d&apos;attente</Badge>
          : <span className="hand">glisse-dépose tes fichiers 📄</span>}
      </CardHead>

      <div
        className={"drop" + (survol ? " is-over" : "")}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
        onDragEnter={e => { e.preventDefault(); setSurvol(true); }}
        onDragOver={e => { e.preventDefault(); setSurvol(true); }}
        onDragLeave={e => { e.preventDefault(); setSurvol(false); }}
        onDrop={e => { e.preventDefault(); setSurvol(false); deposer(e.dataTransfer.files); }}
      >
        <div className="drop-ico">⇪</div>
        <b>Dépose devis, factures et bilan comptable</b>
        <span className="small muted">PDF, JPG, PNG — 20 Mo max par fichier</span>
        <span className="btn btn-soft btn-s mt-s">Parcourir les fichiers</span>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={e => { deposer(e.target.files); e.target.value = ""; }}
        />
      </div>

      <Note tone="gold" ico="ⓘ" className="mt">
        Le <b>bilan comptable est déposé par le consultant</b>, jamais récupéré automatiquement : c&apos;est la
        source de la masse salariale et des charges fixes de structure utilisées par le moteur de calcul.
      </Note>

      {chargement.erreur && (
        <Note tone="gold" ico="!" className="mt">
          Impossible de récupérer les pièces du dossier : {chargement.erreur}{" "}
          <button className="btn btn-ghost btn-s" type="button" onClick={onRecharger}>Réessayer</button>
        </Note>
      )}

      {docs.length === 0 ? (
        chargement.encours
          ? <p className="hint mt center"><Spinner style={{ verticalAlign: -2, marginRight: 8 }} />Chargement des pièces du dossier…</p>
          : !chargement.erreur && <p className="hint mt center">Aucune pièce déposée pour ce dossier.</p>
      ) : (
        <ul className="files mt">
          {docs.map((d, i) => {
            const s = suivi(d);
            const actif = d.statut === "upload" || d.statut === "analyse";
            return (
              <li
                key={d.id}
                className={(selection === d.id ? "is-sel " : "") + (d.statut === "erreur" ? "is-err" : "")}
                style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
                onClick={() => onSelection(d.id)}
              >
                <span className="file-ico">{d.type}</span>
                <span className="grow">
                  <span className="file-nom">{d.nom}</span><br />
                  <span className="file-meta">
                    {d.cat || "à classer"} · {d.taille}
                    {d.serveur && <> · <span title={`Stocké sous ${d.serveur.nomStocke}`}>#{d.serveur.id}</span></>}
                    {d.statut === "erreur" && <> · <span className="txt-bad">{d.erreur}</span></>}
                  </span>
                  {(actif || d.statut === "attente") && <Bar value={s.pct} className="file-bar" />}
                </span>
                <Badge tone={d.suppression ? "ink" : s.tone}>
                  {(actif || d.suppression) && <Spinner className="spin-xs" />}
                  {d.suppression ? "suppression…" : s.label}
                </Badge>
                <span className="tbl-actions" onClick={e => e.stopPropagation()}>
                  {(d.statut === "extrait" || d.statut === "erreur") && (
                    <button className="btn btn-icon" type="button" title="Relancer l'extraction" disabled={d.suppression} onClick={() => onRelancer(d.id)}>↻</button>
                  )}
                  <button className="btn btn-icon" type="button" title="Voir le fichier original" onClick={() => apercu(d)}>◱</button>
                  <button className="btn btn-icon" type="button" title="Supprimer (fichier + référence)" disabled={d.suppression} onClick={() => confirmerSuppression(d)}>✕</button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
