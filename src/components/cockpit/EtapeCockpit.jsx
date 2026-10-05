"use client";

import { useEffect, useRef, useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Note from "@/components/ui/Note";
import { IaSrc, IaTag } from "@/components/ui/Ia";
import { Spinner } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import CockpitHero from "@/components/cockpit/CockpitHero";
import { DetailCalcul, Indicateurs, ValeurTendancielle } from "@/components/cockpit/CockpitSections";
import { CONTROLES_COCKPIT, MOTEURS } from "@/data/moteurs";
import { SECTEURS } from "@/data/al";
import { useUi } from "@/context/UiContext";

/* Étape 3 du dossier d'audit : résultats calculés par le moteur sectoriel.
   onSuivant : résultats validés → génération du rapport */
export default function EtapeCockpit({ dossier, onSuivant }) {
  const [secteur, setSecteur] = useState(SECTEURS.includes(dossier.secteur) ? dossier.secteur : "BTP");
  const [cle, setCle] = useState(0);            // force le rejeu des animations
  const [leviersEnCours, setLeviersEnCours] = useState(false);
  const timer = useRef(null);
  const { toast, openModal, closeModal } = useUi();

  useEffect(() => () => clearTimeout(timer.current), []);

  const moteur = MOTEURS[secteur];

  const changerSecteur = valeur => {
    setSecteur(valeur);
    setCle(k => k + 1);
    toast(`Moteur <b>${valeur}</b> chargé — indicateurs structurellement différents.`, "gold");
  };

  const recalculer = () => {
    setCle(k => k + 1);
    toast("Recalcul déclenché à partir des données d'entrée actuelles.", "ok");
  };

  const reproposerLeviers = () => {
    setLeviersEnCours(true);
    timer.current = setTimeout(() => {
      setLeviersEnCours(false);
      toast("Nouvelle sélection de leviers proposée — à valider avant le rapport.", "gold");
    }, 900);
  };

  const validerResultats = () => openModal(
    <>
      <h2>Valider les résultats</h2>
      <p>
        Deux contrôles restent en alerte. La validation autorise la génération du rapport PDF ;
        les résultats de calcul ne sont jamais saisis manuellement, seulement recalculés.
      </p>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Revenir aux alertes</button>
        <button className="btn btn-gold" type="button" onClick={() => { closeModal(); onSuivant(); }}>
          Valider &amp; générer
        </button>
      </ModalActions>
    </>
  );

  return (
    <>
      <div className="row-between mb">
        <div className="row gap-s">
          <select
            className="select-auto" value={secteur} aria-label="Moteur sectoriel"
            onChange={e => changerSecteur(e.target.value)}
          >
            {SECTEURS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost btn-s" type="button" onClick={recalculer}>↻ Recalculer</button>
        </div>
        <button className="btn btn-gold" type="button" onClick={validerResultats}>Générer le rapport</button>
      </div>

      <Note tone="gold" ico="👁" className="mb">
        <b>Vue interne.</b> Ce cockpit n&apos;est jamais montré au client : il ne reçoit que le rapport PDF
        généré à partir de ces résultats.
      </Note>

      <CockpitHero moteur={moteur} secteur={`${secteur}-${cle}`} />

      <ValeurTendancielle tend={moteur.tend} secteur={secteur} />
      <Indicateurs indics={moteur.indics} secteur={secteur} />
      <DetailCalcul calc={moteur.calc} />

      <section className="grid g-2 mt">
        <div className="card ia-block">
          <CardHead>
            <h3>3 leviers d&apos;optimisation à 30 jours</h3>
            <IaTag phase={0}>Agent de recommandation</IaTag>
          </CardHead>

          <ol className="leviers">
            {leviersEnCours ? (
              <li className="muted"><Spinner /> recherche dans les playbooks consultants…</li>
            ) : moteur.leviers.map(([titre, detail]) => (
              <li key={titre}><b>{titre}</b><span>{detail}</span></li>
            ))}
          </ol>

          <div className="row gap-s mt wrap">
            <button className="btn btn-s btn-gold" type="button" onClick={reproposerLeviers}>
              Proposer d&apos;autres leviers
            </button>
            <button
              className="btn btn-ghost btn-s" type="button"
              onClick={() => toast("Leviers validés — ils seront repris tels quels dans le rapport.", "ok")}
            >
              Valider pour le rapport
            </button>
          </div>

          <IaSrc>
            RAG sur les playbooks rédigés par les consultants · validation humaine obligatoire avant intégration
            au rapport
          </IaSrc>
        </div>

        <Card tint="sky">
          <CardHead><h3>Contrôles avant génération du rapport</h3></CardHead>
          <ul className="checks">
            {CONTROLES_COCKPIT.map(([ok, texte]) => (
              <li className={ok ? undefined : "warn"} key={texte}>
                <span className="ic">{ok ? "✓" : "!"}</span>{texte}
              </li>
            ))}
          </ul>
          <button className="btn mt" type="button" onClick={validerResultats}>Valider les résultats</button>
        </Card>
      </section>
    </>
  );
}
