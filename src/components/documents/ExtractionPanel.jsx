"use client";

import { useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { Field, Table, TableWrap } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { useUi } from "@/context/UiContext";

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

export default function ExtractionPanel({ champs, masque, onMasque, onCorriger }) {
  const [onglet, setOnglet] = useState("champs");
  const { openModal, closeModal, toast } = useUi();

  const objetJson = {
    document_id: "devis-2024-118",
    secteur: "BTP",
    taux_horaire_mo: 42.0,
    volume_heures: 38,
    montant_fournitures: 6240.0,
    marge_brute_apparente: 0.214,
    conditions_paiement_jours: 75,
    client_final: masque ? "<PERSON_1>" : "Sophie Arnaud",
    masse_salariale: 704000,
    charges_fixes_structure: 188500,
    tva: null,
    confiance_globale: 0.91
  };

  const ouvrirCorrection = (champ, index) => {
    let valeur = champ.val;
    openModal(
      <>
        <h2>Corriger « {champ.label} »</h2>
        <p className="small muted">
          Confiance {champ.conf.toFixed(2)} · source :{" "}
          {champ.k.includes("salariale") || champ.k.includes("charges") ? "bilan comptable" : "devis n°2024-118"}
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
              onCorriger(index, valeur);
              toast("Champ corrigé — résultats du dossier recalculés.", "ok");
            }}
          >
            Enregistrer &amp; recalculer
          </button>
        </ModalActions>
      </>
    );
  };

  return (
    <Card>
      <CardHead>
        <h2>Extraction — devis n°2024-118</h2>
        <button className="btn btn-ghost btn-s" type="button" onClick={() => onMasque(!masque)}>
          {masque ? "Démasquer les valeurs" : "Masquer les valeurs"}
        </button>
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
            {champs.map((c, i) => (
              <tr key={c.k} className={c.conf < 0.75 ? "low" : undefined}>
                <td>{c.label}{c.pii && <> <Badge tone="gold">PII</Badge></>}</td>
                <td className="cell-strong">{c.pii && masque ? "<PERSON_1>" : c.val}</td>
                <td>
                  <span className="conf">
                    <span className={"conf-bar" + (c.conf < 0.75 ? " low" : "")}>
                      <i style={{ width: `${c.conf * 100}%` }} />
                    </span>
                    {c.conf.toFixed(2)}
                  </span>
                </td>
                <td className="right">
                  <button className="btn btn-ghost btn-s" type="button" onClick={() => ouvrirCorrection(c, i)}>
                    Corriger
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td>Délai de paiement légal (LME)</td>
              <td className="cell-strong">60 j max</td>
              <td><Badge tone="bad">dépassement détecté</Badge></td>
              <td />
            </tr>
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
{`Devis n°2024-118 — client : `}<mark>Mme Sophie Arnaud</mark>{`
`}<mark>12 rue des Lilas, 31400 Toulouse</mark>{`
Contact : `}<mark>s.arnaud@mail.fr</mark>{` — `}<mark>06 71 22 08 34</mark>{`
Main-d'œuvre : 38 h à 42,00 € HT`}
            </pre>
          </div>
          <div>
            <span className="lbl">Texte anonymisé (envoyé au LLM)</span>
            <pre className="json mt-s">
{`Devis n°2024-118 — client : `}<b>&lt;PERSON_1&gt;</b>{`
`}<b>&lt;ADDRESS_1&gt;</b>{`
Contact : `}<b>&lt;EMAIL_1&gt;</b>{` — `}<b>&lt;PHONE_1&gt;</b>{`
Main-d'œuvre : 38 h à 42,00 € HT`}
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
              <tr><td>E-mail</td><td>Regex</td><td className="mono">re / validator</td><td className="right">1</td></tr>
              <tr><td>Téléphone</td><td>Regex</td><td className="mono">re / phonenumbers</td><td className="right">1</td></tr>
              <tr><td>Nom de personne</td><td>NER local</td><td className="mono">Presidio + spaCy fr</td><td className="right">1</td></tr>
              <tr><td>Adresse postale</td><td>NER local</td><td className="mono">Presidio + spaCy fr</td><td className="right">1</td></tr>
            </tbody>
          </Table>
        </TableWrap>
      </TabPanel>
    </Card>
  );
}
