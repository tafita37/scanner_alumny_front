"use client";

import { useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { Field, Table, TableWrap } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { useUi } from "@/context/UiContext";
import { formatValeur, libelle, sectionsDocument, tableauxDocument, titreDocument } from "@/lib/extraction";

/* Coloration simple du JSON : clés en bleu, valeurs en or — comme la maquette. */
function JsonStrict({ objet }) {
  const brut = JSON.stringify(objet, null, 2);
  const lignes = brut.split("\n");
  return (
    <pre className="json">
      {lignes.map((ligne, i) => {
        const m = ligne.match(/^(\s*)"([^"]+)":\s*(.*?)(,?)$/);
        if (!m) return <span key={i}>{ligne}{"\n"}</span>;
        const [, indent, cle, valeur, virgule] = m;
        return (
          <span key={i}>
            {indent}<span className="k">&quot;{cle}&quot;</span>: <span className="v">{valeur}</span>{virgule}{"\n"}
          </span>
        );
      })}
    </pre>
  );
}

/* Bloc « libellé → valeur » ; corrections : { chemin: valeur saisie } */
function Section({ section, corrections, onCorriger }) {
  return (
    <div>
      <span className="lbl">{section.titre}</span>
      <TableWrap className="mt-s">
        <Table>
          <tbody>
            {section.champs.map(c => {
              const corrige = corrections[c.chemin];
              return (
                <tr key={c.chemin}>
                  <td>
                    {c.label}
                    {c.calcule && <> <Badge tone="sky">calculé</Badge></>}
                    {corrige !== undefined && <> <Badge tone="ok">corrigé</Badge></>}
                  </td>
                  <td className="cell-strong">{corrige ?? formatValeur(c.cle, c.valeur)}</td>
                  <td className="right">
                    <button className="btn btn-ghost btn-s" type="button" onClick={() => onCorriger(c)}>Corriger</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}

function Tableau({ tableau }) {
  return (
    <div className="mt">
      <span className="lbl">{tableau.titre} ({tableau.lignes.length})</span>
      <TableWrap className="mt-s">
        <Table>
          <thead>
            <tr>{tableau.colonnes.map(cle => <th key={cle}>{libelle(cle)}</th>)}</tr>
          </thead>
          <tbody>
            {tableau.lignes.map((ligne, i) => (
              <tr key={i}>
                {tableau.colonnes.map(cle => <td key={cle}>{formatValeur(cle, ligne[cle])}</td>)}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}

/* docs : documents extraits · doc : celui affiché (null → état vide) */
export default function ExtractionPanel({ docs, doc, onSelection, onCorriger }) {
  const [onglet, setOnglet] = useState("donnees");
  const { openModal, closeModal, toast } = useUi();

  if (!doc) {
    return (
      <Card>
        <CardHead><h2>Extraction</h2></CardHead>
        <p className="hint">Les champs extraits s&apos;afficheront ici à la fin du pipeline du premier document.</p>
      </Card>
    );
  }

  const { resultat } = doc;
  const titre = titreDocument(resultat);
  const sections = sectionsDocument(resultat);
  const tableaux = tableauxDocument(resultat);
  const aVerifier = resultat.status !== "ok";
  const ongletActif = onglet === "tableaux" && !tableaux.length ? "donnees" : onglet;

  const ouvrirCorrection = champ => {
    let valeur = doc.corrections[champ.chemin] ?? formatValeur(champ.cle, champ.valeur);
    openModal(
      <>
        <h2>Corriger « {champ.label} »</h2>
        <p className="small muted">Source : {titre} ({doc.nom})</p>
        <Field label="Valeur" className="mt">
          <input type="text" defaultValue={valeur} onChange={e => { valeur = e.target.value; }} />
        </Field>
        <Note tone="gold" ico="!" className="mt">
          Correction <b>locale</b> : elle n&apos;est pas encore enregistrée sur le serveur et n&apos;est pas
          reprise dans les indicateurs du dossier.
        </Note>
        <ModalActions>
          <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
          <button
            className="btn" type="button"
            onClick={() => {
              closeModal();
              onCorriger(doc.id, champ.chemin, valeur);
              toast("Champ corrigé localement.", "ok");
            }}
          >
            Enregistrer
          </button>
        </ModalActions>
      </>
    );
  };

  return (
    <Card>
      <CardHead>
        <h2>Extraction — {titre}</h2>
        <div className="row gap-s wrap">
          {docs.length > 1 && (
            <select className="select-s" value={doc.id} onChange={e => onSelection(e.target.value)} aria-label="Document affiché">
              {docs.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          )}
          {aVerifier ? <Badge tone="gold">à vérifier</Badge> : <Badge tone="ok">conforme</Badge>}
        </div>
      </CardHead>

      {aVerifier && (
        <Note tone="gold" ico="!" className="mb">
          <b>Extraction à vérifier</b> : relis le document original avant d&apos;utiliser ces valeurs.
          {resultat.errors.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {resultat.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </Note>
      )}

      {!resultat.extraction ? (
        <p className="hint">Aucune donnée exploitable : le document n&apos;a pas été reconnu comme une pièce commerciale ou des comptes annuels.</p>
      ) : (
        <>
          <Tabs
            value={ongletActif} onChange={setOnglet}
            items={[
              { id: "donnees", label: "Données extraites" },
              ...(tableaux.length ? [{ id: "tableaux", label: "Lignes et tableaux" }] : []),
              { id: "json", label: "JSON strict" }
            ]}
          />

          <TabPanel active={ongletActif === "donnees"}>
            <div className="grid g-2">
              {sections.map(s => (
                <Section key={s.titre} section={s} corrections={doc.corrections} onCorriger={ouvrirCorrection} />
              ))}
            </div>
            <p className="hint mt-s">
              Seuls les champs renseignés sont affichés. « Calculé » : valeur déduite par le serveur
              (ex. délai de règlement à partir de l&apos;échéance) ; le détail complet est dans l&apos;onglet JSON.
            </p>
          </TabPanel>

          <TabPanel active={ongletActif === "tableaux"}>
            {tableaux.map(t => <Tableau key={t.cle} tableau={t} />)}
          </TabPanel>

          <TabPanel active={ongletActif === "json"}>
            <JsonStrict objet={resultat.extraction} />
            <p className="hint">
              Réponse du LLM validée par le schéma strict du back (Pydantic) avant le calcul des variables.
            </p>
          </TabPanel>
        </>
      )}
    </Card>
  );
}
