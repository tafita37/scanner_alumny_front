"use client";

import { useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { Field, Table, TableWrap } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { useUi } from "@/context/UiContext";
import { SEUIL_CONFIANCE } from "@/lib/extractionSimulee";

const DETECTION = {
  EMAIL: ["E-mail", "Regex", "re / validator"],
  PHONE: ["Téléphone", "Regex", "re / phonenumbers"],
  PERSON: ["Nom de personne", "NER local", "Presidio + spaCy fr"],
  ADDRESS: ["Adresse postale", "NER local", "Presidio + spaCy fr"]
};

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

/* docs : documents extraits · doc : celui affiché (null → état vide) */
export default function ExtractionPanel({ docs, doc, onSelection, masque, onMasque, onCorriger }) {
  const [onglet, setOnglet] = useState("champs");
  const { openModal, closeModal, toast } = useUi();

  if (!doc) {
    return (
      <Card>
        <CardHead><h2>Extraction</h2></CardHead>
        <p className="hint">Les champs extraits s&apos;afficheront ici à la fin du pipeline du premier document.</p>
      </Card>
    );
  }

  const confGlobale = doc.champs.reduce((s, c) => s + c.conf, 0) / doc.champs.length;
  const objetJson = {
    document_id: doc.nom.replace(/\.[^.]+$/, ""),
    categorie: doc.categorie,
    secteur: "BTP",
    mode_extraction: doc.mode,
    ...Object.fromEntries(doc.champs.map(c => [c.k, c.pii && masque ? "<PERSON_1>" : c.brut])),
    ...(doc.categorie === "Bilan comptable" ? {} : { tva: null }),
    confiance_globale: Math.round(confGlobale * 100) / 100
  };

  const delai = doc.champs.find(c => c.k === "conditions_paiement_jours");
  const delaiJours = delai ? Number(delai.brut) : null;

  const ouvrirCorrection = champ => {
    let valeur = champ.val;
    openModal(
      <>
        <h2>Corriger « {champ.label} »</h2>
        <p className="small muted">
          Confiance {champ.conf.toFixed(2)} · source : {doc.categorie.toLowerCase()} n°{doc.numero} ({doc.nom})
        </p>
        <Field label="Valeur" className="mt">
          <input type="text" defaultValue={champ.val} onChange={e => { valeur = e.target.value; }} />
        </Field>
        <Note tone="blue" ico="↻" className="mt">
          Toute correction déclenche un <b>recalcul en cascade</b> des résultats du dossier :
          les indicateurs ne sont jamais saisis à la main.
        </Note>
        <ModalActions>
          <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
          <button
            className="btn" type="button"
            onClick={() => {
              closeModal();
              onCorriger(doc.id, champ.k, valeur);
              toast("Champ corrigé — résultats du dossier recalculés.", "ok");
            }}
          >
            Enregistrer &amp; recalculer
          </button>
        </ModalActions>
      </>
    );
  };

  const occurrences = type => doc.texte.filter(s => s.pii === type).length;

  return (
    <Card>
      <CardHead>
        <h2>Extraction — {doc.categorie.toLowerCase()} n°{doc.numero}</h2>
        <div className="row gap-s wrap">
          {docs.length > 1 && (
            <select className="select-s" value={doc.id} onChange={e => onSelection(e.target.value)} aria-label="Document affiché">
              {docs.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          )}
          <button className="btn btn-ghost btn-s" type="button" onClick={() => onMasque(!masque)}>
            {masque ? "Démasquer les valeurs" : "Masquer les valeurs"}
          </button>
        </div>
      </CardHead>

      <Tabs
        value={onglet} onChange={setOnglet}
        items={[
          { id: "champs", label: "Champs extraits" },
          { id: "json", label: "JSON strict" },
          { id: "anon", label: "Anonymisation" }
        ]}
      />

      <TabPanel active={onglet === "champs"}>
        {/* Enveloppe de défilement : sans elle le tableau débordait de la carte sur mobile. */}
        <TableWrap>
        <Table>
          <thead>
            <tr><th>Champ</th><th>Valeur extraite</th><th>Confiance</th><th /></tr>
          </thead>
          <tbody>
            {doc.champs.map(c => (
              <tr key={c.k} className={c.conf < SEUIL_CONFIANCE ? "low" : undefined}>
                <td>
                  {c.label}
                  {c.pii && <> <Badge tone="gold">PII</Badge></>}
                  {c.corrige && <> <Badge tone="ok">corrigé</Badge></>}
                </td>
                <td className="cell-strong">{c.pii && masque ? "<PERSON_1>" : c.val}</td>
                <td>
                  <span className="conf">
                    <span className={"conf-bar" + (c.conf < SEUIL_CONFIANCE ? " low" : "")}>
                      <i style={{ width: `${c.conf * 100}%` }} />
                    </span>
                    {c.conf.toFixed(2)}
                  </span>
                </td>
                <td className="right">
                  <button className="btn btn-ghost btn-s" type="button" onClick={() => ouvrirCorrection(c)}>
                    Corriger
                  </button>
                </td>
              </tr>
            ))}
            {delai && (
              <tr>
                <td>Délai de paiement légal (LME)</td>
                <td className="cell-strong">60 j max</td>
                <td>
                  {delaiJours > 60
                    ? <Badge tone="bad">dépassement détecté</Badge>
                    : <Badge tone="ok">conforme</Badge>}
                </td>
                <td />
              </tr>
            )}
          </tbody>
        </Table>
        </TableWrap>
        <p className="hint mt-s">
          Les champs sous le seuil de confiance sont surlignés : un <b>Update</b> manuel déclenche
          le recalcul en cascade des résultats du dossier.
        </p>
      </TabPanel>

      <TabPanel active={onglet === "json"}>
        <JsonStrict objet={objetJson} />
        <p className="hint">
          Validation stricte du schéma côté backend (Pydantic / Zod) avant toute utilisation par le moteur de calcul.
        </p>
      </TabPanel>

      <TabPanel active={onglet === "anon"}>
        <div className="grid g-2">
          <div>
            <span className="lbl">Texte brut (local uniquement)</span>
            <pre className="json mt-s">
              {doc.texte.map((s, i) => (s.pii ? <mark key={i}>{s.t}</mark> : <span key={i}>{s.t}</span>))}
            </pre>
          </div>
          <div>
            <span className="lbl">Texte anonymisé (envoyé au LLM)</span>
            <pre className="json mt-s">
              {doc.texte.map((s, i) => (s.pii ? <b key={i}>{`<${s.pii}_1>`}</b> : <span key={i}>{s.t}</span>))}
            </pre>
          </div>
        </div>

        <Note ico="🔒" className="mt">
          Substitution de mots, pas de chiffrement. La table de correspondance{" "}
          <span className="mono">token → valeur réelle</span> reste stockée <b>localement</b> pour le démasquage
          à l&apos;affichage interne. L&apos;anonymisation porte sur le <b>texte</b>, jamais sur l&apos;image —
          d&apos;où l&apos;intérêt d&apos;un OCR local en amont.
        </Note>

        <TableWrap className="mt">
          <Table>
            <thead>
              <tr><th>Type</th><th>Méthode de détection</th><th>Outil</th><th className="right">Occurrences</th></tr>
            </thead>
            <tbody>
              {Object.keys(doc.entites).map(type => {
                const [label, methode, outil] = DETECTION[type];
                return (
                  <tr key={type}>
                    <td>{label}</td><td>{methode}</td><td className="mono">{outil}</td>
                    <td className="right">{occurrences(type)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </TabPanel>
    </Card>
  );
}
