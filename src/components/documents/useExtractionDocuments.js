"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/* File de traitement simulée des pièces déposées : téléversement puis pipeline
   d'extraction, un document à la fois, avec journal horodaté.
   À remplacer par les appels API (upload + suivi de job) quand le back sera prêt. */
export function useExtractionDocuments({ moteur, toast }) {
  const [docs, setDocs] = useState([]);
  const [journal, setJournal] = useState([]);
  const [actifId, setActifId] = useState(null);
  const controleur = useRef(null);
  const urls = useRef(new Map());
  const moteurRef = useRef(moteur);
  const docsRef = useRef(docs);

  useEffect(() => { moteurRef.current = moteur; }, [moteur]);
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
        id, url,
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

    try {
      if (!doc.televerse) {
        maj(doc.id, { statut: "upload", progression: 0 });
        log(`Téléversement de ${doc.nom}…`);
        const pas = Math.min(16, Math.max(5, Math.round(doc.octets / 120000)));
        for (let i = 1; i <= pas; i++) {
          await pause(r.entier(80, 220));
          maj(doc.id, { progression: Math.round(i / pas * 100) });
        }
        maj(doc.id, { televerse: true });
        log(`${doc.nom} stocké sur le serveur (chiffré au repos)`, "ok");
      }

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
      etape("llm", "ok", `${res.champs.length} champs · schéma valide`);

      /* 5. Auto-évaluation */
      etape("check", "run");
      await pause(r.entier(600, 950));
      const faibles = res.champs.filter(c => c.conf < SEUIL_CONFIANCE).length;
      etape("check", faibles ? "warn" : "ok", faibles
        ? `${faibles} champ${faibles > 1 ? "s" : ""} sous le seuil`
        : "tous les champs conformes");

      maj(doc.id, {
        statut: "extrait",
        mode: image ? "OCR" : "natif",
        cat: res.categorie,
        categorie: res.categorie,
        numero: res.numero,
        champs: res.champs,
        entites: res.entites,
        texte: res.texte,
        ecartTotal: res.ecartTotal
      });
      log(`${doc.nom} extrait — ${res.champs.length} champs${faibles ? `, ${faibles} à valider` : ""}`, faibles ? "gold" : "ok");
      toast(
        faibles
          ? `Extraction terminée — ${faibles} champ${faibles > 1 ? "s" : ""} à valider manuellement.`
          : `${echapper(doc.nom)} extrait — tous les champs sont conformes.`,
        faibles ? "gold" : "ok"
      );
    } catch (e) {
      if (e.name === "AbortError") return;
      maj(doc.id, { statut: "erreur", erreur: e.message });
      log(`${doc.nom} : échec — ${e.message}`, "bad");
      toast(`Échec de l'extraction de ${echapper(doc.nom)} : ${e.message}.`, "bad");
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

  const supprimer = useCallback(id => {
    if (controleur.current?.id === id) controleur.current.ctrl.abort();
    const url = urls.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urls.current.delete(id);
    }
    const d = docsRef.current.find(x => x.id === id);
    if (d) log(`${d.nom} supprimé (fichier + référence) — recalcul du dossier`);
    setDocs(list => list.filter(x => x.id !== id));
  }, [log]);

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

  return { docs, journal, actifId, ajouter, supprimer, relancer, corriger };
}
