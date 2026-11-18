"use client";

import { useEffect, useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import { CardHead } from "@/components/ui/Card";
import Note from "@/components/ui/Note";
import { IaSrc, IaTag } from "@/components/ui/Ia";
import { Spinner } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import CockpitHero, { Illustratif } from "@/components/cockpit/CockpitHero";
import { Controles, DetailCalcul, DonneesEntree, Indicateurs } from "@/components/cockpit/CockpitSections";
import { useCockpit } from "@/components/cockpit/useCockpit";
import { MOTEURS } from "@/data/moteurs";
import { SECTEUR_MOTEUR } from "@/lib/cockpit";
import { useUi } from "@/context/UiContext";

/* Étape 4 du dossier d'audit : résultats du moteur de calcul du secteur (GET …/cockpit/).
   Score de santé, comparatif marché et leviers restent illustratifs tant qu'ils ne sont pas calculés.
   onSuivant : résultats validés → génération du rapport · onCompleter : retour aux questions de l'agent */
export default function EtapeCockpit({ dossier, onSuivant, onCompleter }) {
  const { cockpit, encours, erreur, exemple, recharger } = useCockpit(dossier.id);
  const [leviersEnCours, setLeviersEnCours] = useState(false);
  const timer = useRef(null);
  const { toast, openModal, closeModal } = useUi();

  useEffect(() => () => clearTimeout(timer.current), []);

  const secteur = SECTEUR_MOTEUR[cockpit?.secteur]
    ?? Object.values(SECTEUR_MOTEUR).find(s => s.toUpperCase() === dossier.secteur?.toUpperCase())
    ?? "BTP";
  const illustratif = MOTEURS[secteur];
  const alertes = cockpit?.controles.filter(c => !c.ok).length ?? 0;

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
        {alertes
          ? `${alertes} contrôle${alertes > 1 ? "s restent" : " reste"} en alerte. `
          : "Tous les contrôles sont au vert. "}
        La validation autorise la génération du rapport PDF ; les résultats de calcul ne sont jamais saisis
        manuellement, seulement recalculés.
      </p>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>
          {alertes ? "Revenir aux alertes" : "Annuler"}
        </button>
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
          <Badge tone="sky">Moteur {secteur}</Badge>
          <button className="btn btn-ghost btn-s" type="button" onClick={recharger} disabled={encours}>
            ↻ Recalculer
          </button>
        </div>
        <button className="btn btn-gold" type="button" onClick={validerResultats} disabled={!cockpit}>
          Générer le rapport
        </button>
      </div>

      <Note tone="gold" ico="👁" className="mb">
        <b>Vue interne.</b> Ce cockpit n&apos;est jamais montré au client : il ne reçoit que le rapport PDF
        généré à partir de ces résultats. Les blocs marqués <b>illustratif</b> sont des exemples, pas encore calculés.
      </Note>

      {exemple && (
        <Note tone="bad" ico="⚠" className="mb">
          <b>Données d&apos;exemple.</b> La route <code>GET /api/companies/audits/&lt;id&gt;/cockpit/</code> n&apos;existe
          pas encore côté back : cette réponse fictive (affichée en développement seulement) montre le format attendu.
        </Note>
      )}

      {encours && !cockpit ? (
        <div className="row muted"><Spinner /> Calcul du cockpit…</div>
      ) : erreur ? (
        <Note tone="bad" ico="⚠">
          {erreur}{" "}
          <button className="btn btn-ghost btn-s" type="button" onClick={recharger}>Réessayer</button>
        </Note>
      ) : cockpit && (
        <div className={encours ? "is-loading" : undefined}>
          <CockpitHero cockpit={cockpit} illustratif={illustratif} secteur={secteur} />

          <DonneesEntree entrees={cockpit.entrees} secteur={secteur} onCompleter={onCompleter} />
          <Indicateurs indicateurs={cockpit.indicateurs} entrees={cockpit.entrees} secteur={secteur} />
          <DetailCalcul etapes={cockpit.etapes_calcul} />

          <section className="grid g-2 mt">
            <div className="card ia-block">
              <CardHead>
                <h3>3 leviers d&apos;optimisation à 30 jours</h3>
                <IaTag phase={0}>Agent de recommandation</IaTag>
                <Illustratif raison="Agent de recommandation pas encore construit" />
              </CardHead>

              <ol className="leviers">
                {leviersEnCours ? (
                  <li className="muted"><Spinner /> recherche dans les playbooks consultants…</li>
                ) : illustratif.leviers.map(([titre, detail]) => (
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

            <Controles controles={cockpit.controles} onValider={validerResultats} />
          </section>
        </div>
      )}
    </>
  );
}
