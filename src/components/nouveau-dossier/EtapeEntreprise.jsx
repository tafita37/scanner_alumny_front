"use client";

import { useEffect, useRef, useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Note from "@/components/ui/Note";
import { Divider, Spinner } from "@/components/ui/Misc";
import { useUi } from "@/context/UiContext";

/* Annuaire simulé — plusieurs SIRET peuvent partager un même SIREN. */
const ANNUAIRE = [
  { nom: "BÂTI DURAN SARL", siret: "812 456 789 00023", ville: "Toulouse (31)", naf: "43.99C — Autres travaux spécialisés" },
  { nom: "BÂTI DURAN SARL — établissement secondaire", siret: "812 456 789 00031", ville: "Muret (31)", naf: "43.99C" },
  { nom: "BATIDUR CONSTRUCTION", siret: "509 774 120 00014", ville: "Blagnac (31)", naf: "41.20A" }
];

const CHAMPS_API = siret => [
  ["SIRET", siret], ["Raison sociale", "Bâti Duran SARL"], ["Code NAF", "43.99C"],
  ["Effectif", "24 salariés"], ["CA publié (2024)", "3,1 M€"], ["Date de création", "14/03/2011"],
  ["Dirigeant (API)", "Marc Duran"], ["Forme juridique", "SARL"], ["Ville", "Toulouse (31)"]
];

export default function EtapeEntreprise({ dossier, onChoisir, onSuivant, onSansDonnees }) {
  const [saisie, setSaisie] = useState(dossier.nom || "");
  const [resultats, setResultats] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [indice, setIndice] = useState(dossier.siret ? "Établissement sélectionné." : "Tape au moins 3 caractères…");
  /* Un aller-retour entre les étapes ne doit pas relancer l'appel API. */
  const [enrichi, setEnrichi] = useState(Boolean(dossier.siret));
  const timer = useRef(null);
  const { toast } = useUi();

  useEffect(() => () => clearTimeout(timer.current), []);

  const surSaisie = valeur => {
    setSaisie(valeur);
    clearTimeout(timer.current);
    const q = valeur.trim();
    if (q.length < 3) {
      setResultats(null);
      setChargement(false);
      setIndice("Tape au moins 3 caractères…");
      return;
    }
    setChargement(true);
    setIndice("Recherche en cours (debounce 300 ms)…");
    timer.current = setTimeout(() => {
      const res = ANNUAIRE.filter(a => (a.nom + a.siret).toLowerCase().includes(q.toLowerCase()));
      const liste = res.length ? res : ANNUAIRE;
      setResultats(liste);
      setChargement(false);
      setIndice(`${liste.length} établissement(s) — plusieurs SIRET peuvent partager un même SIREN.`);
    }, 700);
  };

  const choisir = etab => {
    setSaisie(etab.nom);
    setResultats(null);
    setIndice("Établissement sélectionné.");
    onChoisir(etab.nom, etab.siret);
    setEnrichi(false);
    setTimeout(() => {
      setEnrichi(true);
      toast("Entreprise enrichie via l'API Recherche Entreprises.", "ok");
    }, 900);
  };

  const zoneOuverte = Boolean(dossier.siret);

  return (
    <Card>
      <CardHead><h2>Identifier l&apos;entreprise</h2><span className="hand">on part du SIRET 🔎</span></CardHead>
      <p className="muted small">
        Saisis le SIRET à 14 chiffres ou le nom de l&apos;entreprise — l&apos;autocomplétion interroge
        l&apos;API Recherche Entreprises pendant la frappe (debounce 300 ms) et désambiguïse les établissements
        d&apos;un même SIREN.
      </p>

      <div className="field mt" style={{ position: "relative" }}>
        <label htmlFor="siret">SIRET ou raison sociale</label>
        <input
          type="text" id="siret" autoComplete="off"
          placeholder="Ex. « Bâti Duran » ou 81245678900023"
          value={saisie}
          onChange={e => surSaisie(e.target.value)}
        />
        <div className={"ac" + (chargement || resultats ? " is-open" : "")}>
          {chargement ? (
            <div className="ac-load"><Spinner /> Interrogation de l&apos;API Recherche Entreprises…</div>
          ) : resultats?.map(a => (
            <div className="ac-item" key={a.siret} role="button" tabIndex={0}
              onClick={() => choisir(a)}
              onKeyDown={e => { if (e.key === "Enter") choisir(a); }}
            >
              <b>{a.nom}</b>
              <span>{a.siret} · {a.ville} · {a.naf}</span>
            </div>
          ))}
        </div>
        <span className="hint">{indice}</span>
      </div>

      {zoneOuverte && (
        <div>
          <Divider />
          <div className="row-between">
            <h3>Enrichissement automatique</h3>
            <button
              className="btn btn-ghost btn-s" type="button"
              onClick={() => toast("Données publiques resynchronisées.")}
            >
              ↻ Rafraîchir
            </button>
          </div>
          <p className="hint">
            Appel asynchrone déclenché à la validation du SIRET. Les champs API sont modifiables par le consultant.
          </p>

          <div className="api-grid mt-s">
            {enrichi ? CHAMPS_API(dossier.siret).map(([k, v], i) => (
              <div className="api-cell" key={k} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="dl-k">{k}</div>
                <div className="dl-v">{v}</div>
              </div>
            )) : (
              <div className="ac-load" style={{ gridColumn: "1/-1" }}>
                <Spinner /> Enrichissement en cours…
              </div>
            )}
          </div>

          <Note tone="gold" ico="ⓘ" className="mt">
            L&apos;API ne fournit ni le <b>statut commercial</b>, ni le <b>secteur Alumny</b>, ni de façon fiable
            l&apos;e-mail / téléphone du dirigeant — à compléter à l&apos;étape suivante.
          </Note>

          <div className="row-between mt">
            <button className="btn btn-ghost btn-s" type="button" onClick={onSansDonnees}>
              Aucune donnée publique disponible ?
            </button>
            <button className="btn" type="button" onClick={onSuivant}>Continuer</button>
          </div>
        </div>
      )}
    </Card>
  );
}
