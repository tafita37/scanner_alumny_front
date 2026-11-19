"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { genererRapport, getCockpit, getRapport, getRapportPdf, listerQuestionnaires } from "@/lib/api";

/* Intervalle de relecture d'une génération lancée ailleurs (autre onglet, visite précédente). */
const POLL_MS = 5000;

const echapper = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

/* Rapport PDF d'un audit (une seule version, remplacée à chaque génération).
   - termine : questionnaire terminé (null si inconnu : on laisse alors le back trancher) ;
   - une génération « en_cours » côté serveur, lancée hors de cette page, est relue jusqu'à sa fin ;
   - pdf.url : URL locale (blob) du PDF actuel, pour l'aperçu et le téléchargement. */
export function useRapport({ auditId, toast, onGenere }) {
  const [rapport, setRapport] = useState(null);
  const [termine, setTermine] = useState(null);
  const [indicateurs, setIndicateurs] = useState({});
  const [chargement, setChargement] = useState({ encours: true, erreur: null });
  const [generation, setGeneration] = useState({ encours: false, erreur: null });
  const [pdf, setPdf] = useState({ url: null, encours: false, erreur: null });
  const [tentative, setTentative] = useState(0);
  const [tentativePdf, setTentativePdf] = useState(0);
  const ctrlGeneration = useRef(null);
  const refOnGenere = useRef(onGenere);
  refOnGenere.current = onGenere;

  /* Fin d'une génération (lancée ici ou ailleurs) : message et statut du dossier. */
  const annoncer = useCallback(r => {
    if (r?.status === "ok") {
      toast(`Rapport généré${r.page_count ? ` : <b>${r.page_count} pages</b>` : ""}, prêt à relire.`, "ok");
      refOnGenere.current?.();
    } else if (r?.status === "erreur") {
      toast("La génération du rapport a échoué : voir le détail en haut de page.", "bad");
    }
  }, [toast]);

  /* ---------- Chargement ---------- */
  useEffect(() => {
    if (!auditId) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;
    setChargement({ encours: true, erreur: null });

    Promise.all([
      getRapport(auditId, { signal }),
      listerQuestionnaires(auditId, { signal }).catch(e => {
        if (e.name === "AbortError") throw e;
        console.log("Lecture du questionnaire impossible :", e);
        return null;
      })
    ])
      .then(([r, q]) => {
        setRapport(r);
        setTermine(q ? Boolean(q.finished) : null);
        setChargement({ encours: false, erreur: null });
      })
      .catch(e => {
        if (e.name === "AbortError") return;
        setChargement({ encours: false, erreur: e.message });
      });

    /* Noms des indicateurs, pour les commentaires rédigés (qui ne portent que la clé). */
    getCockpit(auditId, { signal })
      .then(c => setIndicateurs(Object.fromEntries((c?.indicateurs ?? []).map(i => [i.cle, i.nom]))))
      .catch(e => { if (e.name !== "AbortError") console.log("Lecture du cockpit impossible :", e); });

    return () => ctrl.abort();
  }, [auditId, tentative]);

  const recharger = useCallback(() => setTentative(t => t + 1), []);

  /* ---------- Génération lancée ailleurs : relecture jusqu'à la fin ---------- */
  const enCoursAilleurs = rapport?.status === "en_cours" && !generation.encours;

  useEffect(() => {
    if (!enCoursAilleurs || !auditId) return;
    setGeneration(g => (g.erreur ? { ...g, erreur: null } : g));
    const ctrl = new AbortController();
    const t = setInterval(() => {
      getRapport(auditId, { signal: ctrl.signal })
        .then(r => {
          if (r.status === "en_cours") return;
          setRapport(r);
          annoncer(r);
        })
        .catch(e => { if (e.name !== "AbortError") console.log("Relecture du rapport impossible :", e); });
    }, POLL_MS);
    return () => { clearInterval(t); ctrl.abort(); };
  }, [enCoursAilleurs, auditId, annoncer]);

  /* ---------- PDF actuel (rechargé à chaque nouvelle version) ---------- */
  const versionPdf = rapport?.pdf_available ? (rapport.generated_at ?? "pdf") : null;

  useEffect(() => {
    if (!auditId || !versionPdf) {
      setPdf({ url: null, encours: false, erreur: null });
      return;
    }
    const ctrl = new AbortController();
    let url = null;
    setPdf({ url: null, encours: true, erreur: null });
    getRapportPdf(auditId, { signal: ctrl.signal })
      .then(blob => {
        url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        setPdf({ url, encours: false, erreur: null });
      })
      .catch(e => {
        if (e.name === "AbortError") return;
        setPdf({ url: null, encours: false, erreur: e.message });
      });
    return () => {
      ctrl.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [auditId, versionPdf, tentativePdf]);

  const rechargerPdf = useCallback(() => setTentativePdf(t => t + 1), []);

  /* Après un refus du back : l'état réel (génération en cours ailleurs, questionnaire rouvert…) */
  const resynchroniser = useCallback(() => {
    getRapport(auditId).then(setRapport).catch(e => console.log("Relecture du rapport impossible :", e));
    listerQuestionnaires(auditId)
      .then(q => setTermine(Boolean(q?.finished)))
      .catch(e => console.log("Lecture du questionnaire impossible :", e));
  }, [auditId]);

  /* ---------- Génération (une à deux minutes) ---------- */
  const generer = useCallback(async () => {
    ctrlGeneration.current?.abort();
    const ctrl = new AbortController();
    ctrlGeneration.current = ctrl;
    setGeneration({ encours: true, erreur: null });
    try {
      const r = await genererRapport(auditId, { signal: ctrl.signal });
      setRapport(r);
      setGeneration({ encours: false, erreur: null });
      annoncer(r);
    } catch (e) {
      if (e.name === "AbortError") return;
      setGeneration({ encours: false, erreur: e.message });
      toast(`Génération impossible : ${echapper(e.message)}`, "bad");
      resynchroniser();
    }
  }, [auditId, annoncer, resynchroniser, toast]);

  /* La requête est abandonnée en quittant la page ; le back termine la génération,
     relue au retour (statut « en_cours »). */
  useEffect(() => () => ctrlGeneration.current?.abort(), []);

  return {
    rapport, termine, indicateurs, chargement, generation, enCoursAilleurs, pdf,
    recharger, rechargerPdf, generer
  };
}
