"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listerDocuments, supprimerDocument, uploaderDocuments } from "@/lib/api";
import { heureCourante } from "@/lib/format";
import {
  SEUIL_CONFIANCE, devinerCategorie, etapesVierges, extraireDocument,
  formatTaille, generateur, typeFichier, validerFichier
} from "@/lib/extractionSimulee";

let seq = 0;

/* Les toasts sont rendus en HTML : on échappe les noms de fichiers. */
const echapper = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

/* Pause annulable : rejette avec une AbortError si le document est supprimé entre-temps. */
function attendre(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Traitement annulé", "AbortError"));
    }, { once: true });
  });
}

/* Patch d'état d'un document une fois son extraction (simulée) terminée. */
function etatExtrait(res, image) {
  return {
    statut: "extrait",
    mode: image ? "OCR" : "natif",
    cat: res.categorie,
    categorie: res.categorie,
    numero: res.numero,
    champs: res.champs,
    entites: res.entites,
    texte: res.texte,
    ecartTotal: res.ecartTotal
  };
}

const plurielChamps = n => `${n} champ${n > 1 ? "s" : ""}`;
const msgCheck = faibles => (faibles ? `${plurielChamps(faibles)} sous le seuil` : "tous les champs conformes");

/* Document déjà enregistré côté serveur (GET …/documents/). Pas encore d'extraction
   persistée : on rejoue la simulation, déterministe, donc identique à celle du dépôt. */
function docDepuisServeur(row) {
  const type = typeFichier({ name: row.original_name });
  const image = type !== "PDF";
  const res = extraireDocument({ nom: row.original_name, taille: row.size, type, cat: devinerCategorie(row.original_name) });
  const faibles = res.champs.filter(c => c.conf < SEUIL_CONFIANCE).length;
  return {
    id: `srv-${row.id}`,
    url: null,
    nom: row.original_name,
    type: type === "?" && row.mime_type?.startsWith("image/") ? row.mime_type.slice(6).toUpperCase() : type,
    octets: row.size,
    taille: formatTaille(row.size),
    televerse: true,
    progression: 100,
    serveur: { id: row.id, nomStocke: row.stored_name, creeLe: row.created_at },
    etapes: [
      image ? { k: "natif", statut: "skip", msg: "aucune couche texte" } : { k: "natif", statut: "ok", msg: `texte natif · ${res.pages} p.` },
      image ? { k: "ocr", statut: "ok", msg: `vision locale · ${res.pages} p.` } : { k: "ocr", statut: "skip", msg: "non nécessaire" },
      { k: "anon", statut: "ok", msg: `${Object.keys(res.entites).length} entités masquées` },
      { k: "llm", statut: "ok", msg: `${plurielChamps(res.champs.length)} · schéma valide` },
      { k: "check", statut: faibles ? "warn" : "ok", msg: msgCheck(faibles) }
    ],
    ...etatExtrait(res, image)
  };
}

/* File de traitement des pièces déposées, un document à la fois, avec journal horodaté :
   téléversement réel (POST /api/companies/documents/upload/) puis pipeline d'extraction
   encore simulé, à remplacer par le suivi de job quand le back le proposera. */
export function useExtractionDocuments({ auditId, moteur, toast }) {
  const [docs, setDocs] = useState([]);
  const [journal, setJournal] = useState([]);
  const [actifId, setActifId] = useState(null);
  const [chargement, setChargement] = useState({ encours: Boolean(auditId), erreur: null });
  const [tentative, setTentative] = useState(0);
  const controleur = useRef(null);
  const urls = useRef(new Map());
  const moteurRef = useRef(moteur);
  const auditRef = useRef(auditId);
  const docsRef = useRef(docs);

  useEffect(() => { moteurRef.current = moteur; }, [moteur]);
  useEffect(() => { auditRef.current = auditId; }, [auditId]);
  useEffect(() => { docsRef.current = docs; }, [docs]);

  useEffect(() => {
    const liens = urls.current;
    return () => {
      controleur.current?.ctrl.abort();
      liens.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const log = useCallback((texte, ton = "") => {
    setJournal(j => [{ id: ++seq, heure: heureCourante(), texte, ton }, ...j].slice(0, 60));
  }, []);

  const maj = useCallback((id, patch) => {
    setDocs(list => list.map(d => (d.id === id ? { ...d, ...(typeof patch === "function" ? patch(d) : patch) } : d)));
  }, []);

  /* Pièces déjà rattachées à l'audit. Les documents déposés pendant le chargement
     sont conservés ; un document déjà présent (même id serveur) n'est pas dupliqué. */
  useEffect(() => {
    if (!auditId) return;
    const ctrl = new AbortController();
    setChargement({ encours: true, erreur: null });
    listerDocuments(auditId, { signal: ctrl.signal })
      .then(rows => {
        const connus = new Set(docsRef.current.map(d => d.serveur?.id).filter(Boolean));
        const existants = rows.filter(row => !connus.has(row.id)).map(docDepuisServeur);
        setDocs(list => [...existants, ...list]);
        setChargement({ encours: false, erreur: null });
        if (existants.length) log(`${existants.length} document${existants.length > 1 ? "s" : ""} récupéré${existants.length > 1 ? "s" : ""} depuis le serveur`);
      })
      .catch(e => {
        if (e.name === "AbortError") return;
        setChargement({ encours: false, erreur: e.message });
      });
    return () => ctrl.abort();
  }, [auditId, tentative, log]);

  const recharger = useCallback(() => setTentative(t => t + 1), []);

  const ajouter = useCallback(files => {
    const acceptes = [];
    Array.from(files).forEach(file => {
      const erreur = validerFichier(file);
      if (erreur) {
        toast(echapper(erreur), "bad");
        log(erreur, "bad");
        return;
      }
      const id = `doc-${++seq}`;
      const url = URL.createObjectURL(file);
      urls.current.set(id, url);
      acceptes.push({
        id, url, file,
        nom: file.name,
        type: typeFichier(file),
        octets: file.size,
        taille: formatTaille(file.size),
        cat: devinerCategorie(file.name),
        statut: "attente",
        televerse: false,
        progression: 0,
        etapes: etapesVierges(),
        champs: []
      });
    });
    if (!acceptes.length) return;

    setDocs(list => [...list, ...acceptes]);
    acceptes.forEach(d => log(`${d.nom} ajouté à la file (${d.taille})`));
    toast(acceptes.length > 1
      ? `${acceptes.length} documents ajoutés — traitement en file d'attente.`
      : `${echapper(acceptes[0].nom)} ajouté — lancement du pipeline.`);
  }, [log, toast]);

  const traiter = useCallback(async doc => {
    const ctrl = new AbortController();
    controleur.current = { id: doc.id, ctrl };
    setActifId(doc.id);

    const pause = ms => attendre(ms, ctrl.signal);
    const r = generateur(`${doc.id}|${Date.now()}`);
    const etape = (k, statut, msg = "") =>
      maj(doc.id, d => ({ etapes: d.etapes.map(e => (e.k === k ? { ...e, statut, msg } : e)) }));

    let phase = "upload";
    try {
      if (!doc.televerse) {
        maj(doc.id, { statut: "upload", progression: 0, erreur: null });
        log(`Téléversement de ${doc.nom}…`);
        /* fetch ne remonte pas l'avancement de l'envoi : la barre progresse seule
           jusqu'à 90 % puis se complète à la réponse (durée minimale pour rester lisible). */
        const tic = setInterval(() => maj(doc.id, d => ({
          progression: Math.min(90, d.progression + Math.max(1, Math.round((90 - d.progression) / 6)))
        })), 150);
        let enregistre;
        try {
          [[enregistre]] = await Promise.all([
            uploaderDocuments(auditRef.current, [doc.file], { signal: ctrl.signal }),
            pause(r.entier(600, 1000))
          ]);
        } finally {
          clearInterval(tic);
        }
        maj(doc.id, {
          televerse: true,
          progression: 100,
          octets: enregistre.size,
          taille: formatTaille(enregistre.size),
          serveur: { id: enregistre.id, nomStocke: enregistre.stored_name, creeLe: enregistre.created_at }
        });
        log(`${doc.nom} enregistré sur le serveur — document #${enregistre.id}`, "ok");
      }
      phase = "analyse";

      maj(doc.id, { statut: "analyse", etapes: etapesVierges(), erreur: null });
      const image = doc.type !== "PDF";
      const externe = moteurRef.current === "externe";
      const res = extraireDocument({ nom: doc.nom, taille: doc.octets, type: doc.type, cat: doc.cat });

      /* 1. Couche texte native */
      etape("natif", "run");
      await pause(r.entier(500, 900));
      if (doc.octets === 0) {
        etape("natif", "err", "fichier vide");
        throw new Error("fichier vide ou corrompu");
      }
      if (image) {
        etape("natif", "skip", "aucune couche texte");
        log(`${doc.nom} : image sans couche texte → bascule OCR`, "gold");
      } else {
        etape("natif", "ok", `texte natif · ${res.pages} p.`);
      }

      /* 2. OCR / Vision LLM (images uniquement) */
      if (image) {
        etape("ocr", "run", externe ? "API externe" : "Qwen 2.5 VL local");
        await pause(r.entier(1500, 2400));
        etape("ocr", "ok", `${externe ? "API externe" : "vision locale"} · ${res.pages} p.`);
      } else {
        etape("ocr", "skip", "non nécessaire");
      }

      /* 3. Anonymisation */
      etape("anon", "run");
      await pause(r.entier(700, 1100));
      const nbEntites = Object.keys(res.entites).length;
      etape("anon", "ok", `${nbEntites} entités masquées`);
      log(`${doc.nom} : ${nbEntites} entités personnelles remplacées par des jetons`);

      /* 4. Extraction structurée */
      etape("llm", "run");
      if (!doc.cat) log(`Orchestrateur : ${doc.nom} classé en « ${res.categorie} »`, "gold");
      await pause(r.entier(1000, 1700));
      etape("llm", "ok", `${plurielChamps(res.champs.length)} · schéma valide`);

      /* 5. Auto-évaluation */
      etape("check", "run");
      await pause(r.entier(600, 950));
      const faibles = res.champs.filter(c => c.conf < SEUIL_CONFIANCE).length;
      etape("check", faibles ? "warn" : "ok", msgCheck(faibles));

      maj(doc.id, etatExtrait(res, image));
      log(`${doc.nom} extrait — ${res.champs.length} champs${faibles ? `, ${faibles} à valider` : ""}`, faibles ? "gold" : "ok");
      toast(
        faibles
          ? `Extraction terminée — ${faibles} champ${faibles > 1 ? "s" : ""} à valider manuellement.`
          : `${echapper(doc.nom)} extrait — tous les champs sont conformes.`,
        faibles ? "gold" : "ok"
      );
    } catch (e) {
      if (e.name === "AbortError") return;
      const quoi = phase === "upload" ? "du téléversement" : "de l'extraction";
      maj(doc.id, { statut: "erreur", erreur: e.message, progression: 0 });
      log(`${doc.nom} : échec ${quoi} — ${e.message}`, "bad");
      toast(`Échec ${quoi} de ${echapper(doc.nom)} : ${echapper(e.message)}`, "bad");
    } finally {
      if (controleur.current?.ctrl === ctrl) {
        controleur.current = null;
        setActifId(null);
      }
    }
  }, [log, maj, toast]);

  /* Ordonnanceur : dès que rien ne tourne, on prend le prochain document en attente. */
  useEffect(() => {
    if (actifId || controleur.current) return;
    const suivant = docs.find(d => d.statut === "attente");
    if (suivant) traiter(suivant);
  }, [docs, actifId, traiter]);

  /* Supprime le document côté serveur s'il y a été enregistré, puis le retire de l'écran.
     Renvoie true si le document a bien disparu. */
  const supprimer = useCallback(async id => {
    const d = docsRef.current.find(x => x.id === id);
    if (!d || d.suppression) return false;

    if (d.serveur) {
      maj(id, { suppression: true });
      try {
        await supprimerDocument(d.serveur.id);
      } catch (e) {
        // 404 : déjà supprimé côté serveur, il ne reste qu'à le retirer de l'écran.
        if (e.status !== 404) {
          maj(id, { suppression: false });
          log(`${d.nom} : échec de la suppression — ${e.message}`, "bad");
          toast(`Suppression impossible : ${echapper(e.message)}`, "bad");
          return false;
        }
      }
    }

    if (controleur.current?.id === id) controleur.current.ctrl.abort();
    const url = urls.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urls.current.delete(id);
    }
    setDocs(list => list.filter(x => x.id !== id));
    log(d.serveur
      ? `${d.nom} supprimé (fichier + référence, document #${d.serveur.id}) — recalcul du dossier`
      : `${d.nom} retiré du dossier`);
    toast(d.serveur ? "Document supprimé — recalcul du dossier déclenché." : "Document retiré du dossier.");
    return true;
  }, [log, maj, toast]);

  const relancer = useCallback(id => {
    const d = docsRef.current.find(x => x.id === id);
    if (!d || d.statut === "upload" || d.statut === "analyse") return;
    log(`Relance du pipeline sur ${d.nom}`);
    maj(id, { statut: "attente", etapes: etapesVierges(), erreur: null });
  }, [log, maj]);

  const corriger = useCallback((id, k, valeur) => {
    const nombre = Number(valeur.replace(/[^\d,.-]/g, "").replace(",", "."));
    maj(id, d => ({
      champs: d.champs.map(c => (c.k === k
        ? { ...c, val: valeur, brut: typeof c.brut === "number" && Number.isFinite(nombre) && valeur.trim() ? nombre : valeur, conf: 1, corrige: true }
        : c))
    }));
    const d = docsRef.current.find(x => x.id === id);
    if (d) log(`Correction manuelle sur ${d.nom} — recalcul en cascade`, "ok");
  }, [log, maj]);

  return { docs, journal, actifId, chargement, recharger, ajouter, supprimer, relancer, corriger };
}
