"use client";

import { useEffect, useRef, useState } from "react";
import PageShell from "@/components/shell/PageShell";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import Html from "@/components/ui/Html";
import { IaBlock, IaOut, IaSrc, IaTag } from "@/components/ui/Ia";
import { Field, Spinner, Table, TableWrap } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import RapportsAside from "@/components/rapports/RapportsAside";
import {
  CompositionRapport, ETAPES_GENERATION, GenerationRapport
} from "@/components/rapports/GenerationRapport";
import { useUser } from "@/context/UserContext";
import { useUi } from "@/context/UiContext";
import { heureCourante } from "@/lib/format";

const VERSIONS_INITIALES = [
  { v: "v3", date: "12/08/2026 09:14", par: "Ny Aina R.", motif: "Correction du délai de paiement extrait", statut: "remise au client" },
  { v: "v2", date: "11/08/2026 17:02", par: "Tafita A.", motif: "Ajout du comparatif marché", statut: "archivée" },
  { v: "v1", date: "11/08/2026 11:48", par: "Tafita A.", motif: "Génération initiale", statut: "archivée" }
];

const SYNTHESE_INITIALE = `Sur les trois devis analysés, votre main-d'œuvre est facturée 42,00 €/h alors que son
  coût horaire chargé réel ressort à 29,05 €/h : la marge existe, mais elle est absorbée par des délais de paiement
  de 75 jours, supérieurs au plafond légal de 60 jours. À volume constant, la perte sèche annuelle estimée atteint
  47 800 €, soit environ 3 980 € par mois.
  <span class="ia-src">RAG sur la base de connaissance métier Alumny + résultats de calcul du dossier</span>`;

const SYNTHESE_REFORMULEE = `Votre entreprise sous-facture sa main-d'œuvre : 42,00 €/h vendus pour 29,05 €/h de coût réel chargé,
  alors que la médiane de votre marché local se situe à 34,10 €/h. Trois actions immédiates permettent de récupérer
  l'essentiel des 47 800 € de perte sèche annuelle estimée, sans investissement.
  <span class="ia-src">RAG sur la base métier Alumny · ton pédagogique</span>`;

export default function RapportsView() {
  const [versions, setVersions] = useState(VERSIONS_INITIALES);
  const [generation, setGeneration] = useState({ encours: false, index: 0 });
  const [synthese, setSynthese] = useState(SYNTHESE_INITIALE);
  const [reformulation, setReformulation] = useState(false);
  const timers = useRef([]);
  const { user } = useUser();
  const { toast, openModal, closeModal } = useUi();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* ---------- Génération d'une nouvelle version ---------- */
  const generer = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setGeneration({ encours: true, index: 0 });

    ETAPES_GENERATION.forEach((_, i) => {
      timers.current.push(setTimeout(() => {
        if (i === ETAPES_GENERATION.length - 1) {
          setGeneration({ encours: false, index: ETAPES_GENERATION.length });
          setVersions(list => {
            const nom = "v" + (list.length + 1);
            toast(`Rapport <b>${nom}</b> généré — 11 pages, prêt à remettre.`, "ok");
            return [{
              v: nom,
              date: "12/08/2026 " + heureCourante(false),
              par: user.nom,
              motif: "Régénération manuelle",
              statut: "prête à remettre"
            }, ...list];
          });
        } else {
          setGeneration({ encours: true, index: i + 1 });
        }
      }, (i + 1) * 700));
    });
  };

  /* ---------- Synthèse dirigeant ---------- */
  const reformuler = () => {
    setReformulation(true);
    timers.current.push(setTimeout(() => {
      setReformulation(false);
      setSynthese(SYNTHESE_REFORMULEE);
      toast("Synthèse reformulée — relis avant de régénérer le PDF.", "gold");
    }, 900));
  };

  const editerSynthese = () => openModal(
    <>
      <h2>Éditer la synthèse dirigeant</h2>
      <p className="small muted">
        Le texte édité remplace celui du Copilote dans la prochaine version générée.
      </p>
      <Field label="Texte" className="mt">
        <textarea
          style={{ minHeight: 150 }}
          defaultValue={synthese.replace(/<[^>]+>/g, "").trim()}
        />
      </Field>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
        <button
          className="btn" type="button"
          onClick={() => { closeModal(); toast("Synthèse remplacée par la version du consultant.", "ok"); }}
        >
          Enregistrer
        </button>
      </ModalActions>
    </>
  );

  /* ---------- Historique ---------- */
  const supprimerVersion = () => openModal(
    <>
      <h2>Supprimer cette version ?</h2>
      <p>
        Réservé aux erreurs de génération. Le <b>log</b> de la version est conservé même après suppression du fichier.
      </p>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
        <button
          className="btn btn-danger" type="button"
          onClick={() => { closeModal(); toast("Version supprimée — log conservé."); }}
        >
          Supprimer
        </button>
      </ModalActions>
    </>
  );

  return (
    <PageShell
      section="Audit · Module 4"
      title="Restitution & rapport PDF"
      actions={
        <>
          <Badge tone="sky" dot>D-2026-041 · Bâti Duran SARL</Badge>
          <button className="btn btn-gold" type="button" onClick={generer}>Générer une nouvelle version</button>
        </>
      }
    >
      <div className="rap-cols">
        <section className="col gap-l">
          <CompositionRapport />
          <GenerationRapport etat={generation} />

          <IaBlock>
            <CardHead>
              <h3>Synthèse dirigeant proposée</h3>
              <IaTag phase={0}>Rédaction</IaTag>
            </CardHead>

            {reformulation
              ? <IaOut><Spinner /> reformulation en cours…</IaOut>
              : <Html as="div" className="ia-out" html={synthese} />}

            <div className="row gap-s mt wrap">
              <button className="btn btn-s btn-gold" type="button" onClick={reformuler}>Reformuler</button>
              <button className="btn btn-ghost btn-s" type="button" onClick={editerSynthese}>
                Éditer avant intégration
              </button>
            </div>
            <p className="hint mt-s">
              Le consultant relit et valide : aucun texte généré ne part au client sans relecture.
            </p>
          </IaBlock>

          <Card>
            <CardHead><h2>Historique des versions</h2></CardHead>
            <TableWrap>
              <Table>
                <thead>
                  <tr><th>Version</th><th>Généré le</th><th>Par</th><th>Motif</th><th>Statut</th><th /></tr>
                </thead>
                <tbody>
                  {versions.map((v, i) => (
                    <tr key={v.v} className={i === 0 ? "v-current" : undefined}>
                      <td className="cell-strong">{v.v}</td>
                      <td className="small">{v.date}</td>
                      <td className="small">{v.par}</td>
                      <td className="small">{v.motif}</td>
                      <td>
                        {i === 0
                          ? <Badge tone="ok" dot>{v.statut}</Badge>
                          : <Badge tone="ink">{v.statut}</Badge>}
                      </td>
                      <td>
                        <div className="tbl-actions">
                          <button
                            className="btn btn-icon" type="button" title="Télécharger"
                            onClick={() => toast(`Téléchargement du PDF (${v.v}) — 2,3 Mo.`)}
                          >
                            ↓
                          </button>
                          <button
                            className="btn btn-icon" type="button" title="Supprimer cette version"
                            onClick={supprimerVersion}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>

            <Note tone="gold" ico="↻" className="mt">
              Un rapport n&apos;est <b>jamais édité directement</b> : toute correction passe par une régénération
              en nouvelle version, pour garder un historique fiable de ce qui a été réellement remis au client.
            </Note>
          </Card>
        </section>

        <RapportsAside version={versions[0].v} />
      </div>
    </PageShell>
  );
}
