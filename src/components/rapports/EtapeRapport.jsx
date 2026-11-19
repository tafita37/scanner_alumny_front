"use client";

import { Spinner } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import RapportsAside from "@/components/rapports/RapportsAside";
import { ApercuPdf, GenerationEnCours, TextesRediges } from "@/components/rapports/RapportSections";
import { useRapport } from "@/components/rapports/useRapport";
import { useUi } from "@/context/UiContext";

/* Étape 5 du dossier d'audit : génération du rapport PDF remis au client (une seule version,
   remplacée à chaque génération), aperçu et relecture des textes rédigés.
   - onGenere : appelé quand une génération réussit ;
   - onQuestions : retour à l'étape Questions (le rapport exige un questionnaire terminé). */
export default function EtapeRapport({ auditId, client, onGenere, onQuestions }) {
  const { toast, openModal, closeModal } = useUi();
  const {
    rapport, termine, indicateurs, chargement, generation, enCoursAilleurs, pdf,
    recharger, rechargerPdf, generer
  } = useRapport({ auditId, toast, onGenere });

  if (chargement.encours && !rapport) return <Spinner />;

  if (chargement.erreur) {
    return (
      <p className="muted">
        Rapport indisponible : {chargement.erreur}{" "}
        <button className="btn btn-ghost btn-s" type="button" onClick={recharger}>Réessayer</button>
      </p>
    );
  }

  const enCours = generation.encours || enCoursAilleurs;
  const existe = Boolean(rapport?.pdf_available);
  const bloque = termine === false;
  const echec = rapport?.status === "erreur" && !enCours;

  const lancer = () => {
    if (!existe) {
      generer();
      return;
    }
    openModal(
      <>
        <h2>Régénérer le rapport ?</h2>
        <p>
          Le PDF actuel sera <b>remplacé</b> : une seule version est conservée par audit.
          Si la génération échoue, il reste en place.
        </p>
        <p className="small muted">Rédaction par le LLM puis mise en page : une à deux minutes.</p>
        <ModalActions>
          <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
          <button className="btn btn-gold" type="button" onClick={() => { closeModal(); generer(); }}>
            Régénérer
          </button>
        </ModalActions>
      </>
    );
  };

  return (
    <>
      <div className="row-between mb">
        <span className="hint">
          {existe
            ? "Le PDF ci-dessous est celui remis au client. Relisez-le avant de l'envoyer."
            : "Le rapport est rédigé par le LLM à partir du cockpit, puis mis en page en PDF."}
        </span>
        <button className="btn btn-gold" type="button" disabled={enCours || bloque} onClick={lancer}>
          {enCours ? "Génération en cours…" : existe ? "Régénérer le rapport" : "Générer le rapport"}
        </button>
      </div>

      <div className="rap-cols">
        <section className="col gap-l">
          {bloque && !enCours && (
            <div className="note note-gold">
              <span className="note-ico">⚠</span>
              <div className="grow">
                Le questionnaire de l&apos;agent n&apos;est pas terminé : le rapport ne peut être généré
                qu&apos;une fois le dernier tour passé.
                <div className="mt-s">
                  <button className="btn btn-s" type="button" onClick={onQuestions}>Terminer le questionnaire →</button>
                </div>
              </div>
            </div>
          )}

          {enCours && <GenerationEnCours local={generation.encours} />}

          {generation.erreur && !enCours && (
            <div className="note note-bad">
              <span className="note-ico">✕</span>
              <span>{generation.erreur}</span>
            </div>
          )}

          {echec && (
            <div className="note note-bad">
              <span className="note-ico">✕</span>
              <div className="grow">
                <b>La dernière génération a échoué.</b>
                {existe && " La version précédente du rapport reste disponible."}
                {rapport.errors?.length > 0 && (
                  <ul className="rp-errors">{rapport.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                )}
              </div>
            </div>
          )}

          <ApercuPdf existe={existe} pdf={pdf} onReessayer={rechargerPdf} />

          {rapport?.content && <TextesRediges content={rapport.content} indicateurs={indicateurs} />}
        </section>

        <RapportsAside rapport={rapport} pdf={pdf} client={client} enCours={enCours} />
      </div>
    </>
  );
}
