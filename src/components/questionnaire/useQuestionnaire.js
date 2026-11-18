"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { genererQuestionnaire, listerDocuments, listerQuestionnaires, repondreQuestion } from "@/lib/api";

/* Intervalle de relecture d'un tour généré ailleurs (autre onglet, visite précédente). */
const POLL_MS = 5000;

const remplacerTour = (tours, tour) =>
  tours.some(t => t.id === tour.id) ? tours.map(t => (t.id === tour.id ? tour : t)) : [...tours, tour];

const remplacerQuestion = (tours, question) => tours.map(t => (
  t.questions.some(q => q.id === question.id)
    ? { ...t, questions: t.questions.map(q => (q.id === question.id ? question : q)) }
    : t
));

/* Questionnaire adaptatif d'un audit : tours de questions générés par l'agent et réponses du dirigeant.
   - le premier tour est généré automatiquement s'il n'en existe aucun ;
   - un tour « en_cours » côté serveur (génération lancée hors de cette page) est relu jusqu'à sa fin ;
   - le tour suivant n'est généré qu'à la demande (genererSuite), une fois toutes les questions traitées. */
export function useQuestionnaire({ auditId, toast }) {
  const [tours, setTours] = useState([]);
  const [termine, setTermine] = useState(false);
  const [chargement, setChargement] = useState({ encours: true, erreur: null });
  /* Génération lancée depuis cette page : erreur = message (requête refusée ou tour en erreur), errors = détail du back */
  const [generation, setGeneration] = useState({ encours: false, erreur: null, errors: [] });
  /* tool_calls des tours générés pendant cette visite (non enregistrés en base) : { [idTour]: [...] } */
  const [enquetes, setEnquetes] = useState({});
  const [documents, setDocuments] = useState({});
  const [envois, setEnvois] = useState({});
  const [tentative, setTentative] = useState(0);
  const ctrlGeneration = useRef(null);
  const autoLance = useRef(false);

  useEffect(() => () => ctrlGeneration.current?.abort(), []);

  const appliquerListe = useCallback(res => {
    setTours(Array.isArray(res?.questionnaires) ? res.questionnaires : []);
    setTermine(Boolean(res?.finished));
  }, []);

  /* Chargement initial (et sur « Réessayer ») */
  useEffect(() => {
    if (!auditId) return;
    const ctrl = new AbortController();
    setChargement({ encours: true, erreur: null });
    listerQuestionnaires(auditId, { signal: ctrl.signal })
      .then(res => {
        appliquerListe(res);
        setChargement({ encours: false, erreur: null });
      })
      .catch(e => {
        if (e.name === "AbortError") return;
        setChargement({ encours: false, erreur: e.message });
      });
    return () => ctrl.abort();
  }, [auditId, tentative, appliquerListe]);

  /* Noms des documents, pour citer ceux qui ont motivé chaque question */
  useEffect(() => {
    if (!auditId) return;
    const ctrl = new AbortController();
    listerDocuments(auditId, { signal: ctrl.signal })
      .then(rows => setDocuments(Object.fromEntries((rows ?? []).map(r => [r.id, r.original_name]))))
      .catch(() => {});
    return () => ctrl.abort();
  }, [auditId]);

  const recharger = useCallback(() => setTentative(t => t + 1), []);

  /* Relecture silencieuse (après un conflit ou pendant une génération faite ailleurs) */
  const resynchroniser = useCallback(async signal => {
    try {
      appliquerListe(await listerQuestionnaires(auditId, { signal }));
    } catch (e) {
      if (e.name !== "AbortError") console.log("Relecture du questionnaire impossible :", e);
    }
  }, [auditId, appliquerListe]);

  const generer = useCallback(async () => {
    ctrlGeneration.current?.abort();
    const ctrl = new AbortController();
    ctrlGeneration.current = ctrl;
    setGeneration({ encours: true, erreur: null, errors: [] });
    try {
      const res = await genererQuestionnaire(auditId, { signal: ctrl.signal });
      const { finished, errors = [], tool_calls: toolCalls = [], ...tour } = res;
      setTours(t => remplacerTour(t, tour));
      setTermine(Boolean(finished));
      setEnquetes(e => ({ ...e, [tour.id]: toolCalls }));
      if (tour.status === "erreur") {
        setGeneration({ encours: false, erreur: "La génération du tour a échoué.", errors });
        return;
      }
      setGeneration({ encours: false, erreur: null, errors: [] });
      toast?.(finished
        ? "Questionnaire terminé : l'agent n'a plus de question."
        : `Tour ${tour.round_number} généré : ${tour.questions.length} question${tour.questions.length > 1 ? "s" : ""}.`,
      "ok");
    } catch (e) {
      if (e.name === "AbortError") return;
      setGeneration({ encours: false, erreur: e.message, errors: [] });
      /* L'état côté serveur a pu changer (tour en cours ailleurs, tour passé en erreur…) */
      resynchroniser(ctrl.signal);
    }
  }, [auditId, toast, resynchroniser]);

  /* Premier tour : généré automatiquement quand l'audit n'en a encore aucun */
  useEffect(() => {
    if (chargement.encours || chargement.erreur || tours.length || autoLance.current) return;
    autoLance.current = true;
    generer();
  }, [chargement, tours.length, generer]);

  /* Tour en cours de génération côté serveur, hors de cette page : relu jusqu'à ce qu'il aboutisse */
  const enCoursAilleurs = !generation.encours && tours.at(-1)?.status === "en_cours";
  useEffect(() => {
    if (!enCoursAilleurs) return;
    /* Le refus éventuel (« tour déjà en cours ») est dépassé : c'est ce tour qu'on suit désormais */
    setGeneration(g => (g.erreur ? { encours: false, erreur: null, errors: [] } : g));
    const ctrl = new AbortController();
    const t = setTimeout(() => resynchroniser(ctrl.signal), POLL_MS);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [enCoursAilleurs, tours, resynchroniser]);

  /* Envoie la réponse d'une question. body : { status, answer? }.
     Renvoie null si c'est enregistré, sinon le message d'erreur à afficher sous la question. */
  const repondre = useCallback(async (questionId, body) => {
    setEnvois(e => ({ ...e, [questionId]: true }));
    try {
      const question = await repondreQuestion(questionId, body);
      setTours(t => remplacerQuestion(t, question));
      return null;
    } catch (e) {
      if (e.status === 409 || e.status === 404) {
        toast?.(e.message, "gold");
        resynchroniser();
      }
      return e.message;
    } finally {
      setEnvois(e => ({ ...e, [questionId]: false }));
    }
  }, [toast, resynchroniser]);

  return {
    tours, termine, chargement, generation, enCoursAilleurs, enquetes, documents, envois,
    recharger, generer, repondre
  };
}
