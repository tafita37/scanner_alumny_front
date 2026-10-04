"use client";

import { useEffect, useRef, useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Note from "@/components/ui/Note";
import { Divider, Spinner } from "@/components/ui/Misc";
import { useUi } from "@/context/UiContext";
import { rechercherEntreprises } from "@/lib/api";
import { nomDirigeant } from "@/lib/format";

const INDICE_VIDE = "Tape au moins 3 chiffres du SIRET…";

/* « 356000935 » → « 356 000 935 » */
const fmtSiren = siren => siren ? siren.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3") : null;

/* « 1991-01-01 » → « 01/01/1991 » */
const fmtDate = iso => iso ? iso.split("-").reverse().join("/") : null;

/* « BOULOGNE-BILLANCOURT (92) » */
const fmtVille = e => e.city_name ? e.city_name + (e.department_code ? ` (${e.department_code})` : "") : null;

const CHAMPS_API = e => [
  ["SIREN", fmtSiren(e.siren_number)],
  ["Raison sociale", e.company_name],
  ["Code NAF", e.naf_code],
  ["Date de création", fmtDate(e.creation_date)],
  ["Dirigeant (API)", nomDirigeant(e)],
  ["Fonction du dirigeant", e.ceo_job_title],
  ["Forme juridique", e.company_type_label],
  ["Ville", fmtVille(e)],
  ["Code commune INSEE", e.city_code_insee]
];

export default function EtapeEntreprise({ dossier, onChoisir, onSuivant, onSansDonnees }) {
  const [saisie, setSaisie] = useState(dossier.siret || "");
  const [resultats, setResultats] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [indice, setIndice] = useState(dossier.siret ? "Entreprise sélectionnée." : INDICE_VIDE);
  const timer = useRef(null);
  /* Numéro de la dernière recherche : une réponse plus ancienne arrivée en retard est ignorée. */
  const derniere = useRef(0);
  const { toast } = useUi();

  useEffect(() => () => clearTimeout(timer.current), []);

  const surSaisie = valeur => {
    setSaisie(valeur);
    clearTimeout(timer.current);
    const id = ++derniere.current;
    const q = valeur.replace(/\s+/g, "");
    if (q && !/^\d+$/.test(q)) {
      setResultats(null);
      setChargement(false);
      setIndice("Le SIRET ne doit contenir que des chiffres.");
      return;
    }
    if (q.length < 3 || q.length > 14) {
      setResultats(null);
      setChargement(false);
      setIndice(q.length > 14 ? "Un SIRET compte 14 chiffres au maximum." : INDICE_VIDE);
      return;
    }
    setChargement(true);
    setIndice("Recherche en cours…");
    timer.current = setTimeout(async () => {
      try {
        const liste = await rechercherEntreprises(q);
        if (id !== derniere.current) return;
        setResultats(liste);
        setIndice(liste.length
          ? `${liste.length} entreprise(s) dont le SIREN commence par ${q.slice(0, 9)}.`
          : "Aucune entreprise trouvée pour ce numéro.");
      } catch (err) {
        if (id !== derniere.current) return;
        setResultats(null);
        setIndice(err.message);
      } finally {
        if (id === derniere.current) setChargement(false);
      }
    }, 300);
  };

  const choisir = entreprise => {
    clearTimeout(timer.current);
    derniere.current++;
    setSaisie(entreprise.siren_number);
    setResultats(null);
    setChargement(false);
    setIndice("Entreprise sélectionnée.");
    onChoisir(entreprise);
    toast("Entreprise enrichie via l'annuaire des entreprises.", "ok");
  };

  /* Relance la recherche sur le SIREN retenu pour récupérer les données à jour. */
  const rafraichir = async () => {
    setRafraichissement(true);
    try {
      const liste = await rechercherEntreprises(dossier.siret);
      const maj = liste.find(e => e.siren_number === dossier.siret);
      if (maj) {
        onChoisir(maj);
        toast("Données publiques resynchronisées.", "ok");
      } else {
        toast("Entreprise introuvable dans l'annuaire.", "gold");
      }
    } catch (err) {
      toast(err.message, "gold");
    } finally {
      setRafraichissement(false);
    }
  };

  const entreprise = dossier.entreprise;
  const zoneOuverte = Boolean(entreprise);

  return (
    <Card>
      <CardHead><h2>Identifier l&apos;entreprise</h2><span className="hand">on part du SIRET 🔎</span></CardHead>
      <p className="muted small">
        Saisis le SIRET (ou au moins ses 3 premiers chiffres) — l&apos;autocomplétion interroge l&apos;annuaire
        des entreprises pendant la frappe et propose celles dont le SIREN commence par ta saisie.
      </p>

      <div className="field mt" style={{ position: "relative" }}>
        <label htmlFor="siret">SIRET</label>
        <input
          type="text" id="siret" autoComplete="off" inputMode="numeric"
          placeholder="Ex. 81245678900023"
          value={saisie}
          onChange={e => surSaisie(e.target.value)}
        />
        <div className={"ac" + (chargement || resultats?.length ? " is-open" : "")}>
          {chargement ? (
            <div className="ac-load"><Spinner /> Interrogation de l&apos;annuaire des entreprises…</div>
          ) : resultats?.map(e => (
            <div className="ac-item" key={e.siren_number} role="button" tabIndex={0}
              onClick={() => choisir(e)}
              onKeyDown={ev => { if (ev.key === "Enter") choisir(e); }}
            >
              <b>{e.company_name}</b>
              <span>{[fmtSiren(e.siren_number), fmtVille(e), e.naf_code].filter(Boolean).join(" · ")}</span>
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
              disabled={rafraichissement}
              onClick={rafraichir}
            >
              ↻ Rafraîchir
            </button>
          </div>
          <p className="hint">
            Données issues de l&apos;annuaire des entreprises. Les champs API sont modifiables par le consultant.
          </p>

          <div className="api-grid mt-s">
            {rafraichissement ? (
              <div className="ac-load" style={{ gridColumn: "1/-1" }}>
                <Spinner /> Enrichissement en cours…
              </div>
            ) : CHAMPS_API(entreprise).map(([k, v], i) => (
              <div className="api-cell" key={k} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="dl-k">{k}</div>
                <div className="dl-v">{v || "—"}</div>
              </div>
            ))}
          </div>

          <Note tone="gold" ico="ⓘ" className="mt">
            L&apos;API ne fournit ni le <b>statut commercial</b>, ni le <b>secteur Alumny</b>, ni de façon fiable
            l&apos;e-mail / téléphone du dirigeant — à compléter à l&apos;étape suivante.
            {nomDirigeant(entreprise) && <> Le nom du dirigeant y sera <b>pré-rempli</b>.</>}
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
