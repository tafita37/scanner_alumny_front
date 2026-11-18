"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { extraireDocument, listerDocuments, supprimerDocument, uploaderDocuments } from "@/lib/api";
import { heureCourante } from "@/lib/format";
import {
  estPdf, etapesTerminees, etapesVierges, formatTaille, titreDocument, typeFichier, validerFichier
} from "@/lib/extraction";

let seq = 0;

/* Durée minimale de la barre d'envoi, pour qu'elle reste lisible sur un petit fichier. */
const DUREE_MIN_UPLOAD = 700;

/* Les toasts sont rendus en HTML : on échappe les noms de fichiers. */
const echapper = s => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

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

/* Document déjà enregistré côté serveur (GET …/documents/). La liste ne donne pas son extraction :
   il repasse dans la file, et l'API renvoie directement la dernière extraction « ok »
   (celles à vérifier ou jamais faites sont relancées). */
function docDepuisServeur(row) {
  const type = typeFichier({ name: row.original_name });
  const mimeImage = type === "?" && row.mime_type?.startsWith("image/");
  const pdf = estPdf(type, row.mime_type);
  return {
    id: `srv-${row.id}`,
    url: null,
    nom: row.original_name,
    type: mimeImage ? row.mime_type.slice(6).toUpperCase() : type,
    pdf,
    octets: row.size,
    taille: formatTaille(row.size),
    statut: pdf ? "attente" : "non_extractible",
    televerse: true,
    progression: 100,
    serveur: { id: row.id, nomStocke: row.stored_name, creeLe: row.created_at },
    etapes: etapesVierges(),
    resultat: null,
    corrections: {}
  };
}

/* File de traitement des pièces déposées, un document à la fois, avec journal horodaté :
   téléversement (POST …/documents/upload/) puis extraction (POST …/documents/<id>/extract/).
   statut : attente → upload → analyse → extrait | non_extractible | erreur.
   Un document « extrait » porte la réponse de l'API dans `resultat` (status ok ou a_verifier). */
export function useExtractionDocuments({ auditId, toast }) {
  const [docs, setDocs] = useState([]);
  const [journal, setJournal] = useState([]);
  const [actifId, setActifId] = useState(null);
  const [chargement, setChargement] = useState({ encours: Boolean(auditId), erreur: null });
  const [tentative, setTentative] = useState(0);
  // Indicateurs de l'audit, recalculés par le back à chaque extraction (destinés au cockpit)
  const [indicateurs, setIndicateurs] = useState(null);
  const controleur = useRef(null);
  const urls = useRef(new Map());
  const auditRef = useRef(auditId);
  const docsRef = useRef(docs);

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
        if (existants.length) {
          log(`${pluriel(existants.length, "document")} récupéré${existants.length > 1 ? "s" : ""} depuis le serveur — reprise des extractions`);
        }
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
      const type = typeFichier(file);
      urls.current.set(id, url);
      acceptes.push({
        id, url, file, type,
        nom: file.name,
        pdf: estPdf(type, file.type),
        octets: file.size,
        taille: formatTaille(file.size),
        statut: "attente",
        televerse: false,
        progression: 0,
        etapes: etapesVierges(),
        resultat: null,
        corrections: {}
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

    // Toasts réservés aux actions de l'utilisateur : la reprise des pièces au chargement reste dans le journal.
    const notifier = doc.file || doc.forcer ? toast : () => {};
    let idServeur = doc.serveur?.id;
    let phase = "upload";
    try {
      if (!doc.televerse) {
        maj(doc.id, { statut: "upload", progression: 0, erreur: null });
        log(`Téléversement de ${doc.nom}…`);
        /* fetch ne remonte pas l'avancement de l'envoi : la barre progresse seule
           jusqu'à 90 % puis se complète à la réponse. */
        const tic = setInterval(() => maj(doc.id, d => ({
          progression: Math.min(90, d.progression + Math.max(1, Math.round((90 - d.progression) / 6)))
        })), 150);
        let enregistre;
        try {
          [[enregistre]] = await Promise.all([
            uploaderDocuments(auditRef.current, [doc.file], { signal: ctrl.signal }),
            attendre(DUREE_MIN_UPLOAD, ctrl.signal)
          ]);
        } finally {
          clearInterval(tic);
        }
        idServeur = enregistre.id;
        maj(doc.id, {
          televerse: true,
          progression: 100,
          octets: enregistre.size,
          taille: formatTaille(enregistre.size),
          serveur: { id: enregistre.id, nomStocke: enregistre.stored_name, creeLe: enregistre.created_at }
        });
        log(`${doc.nom} enregistré sur le serveur — document #${enregistre.id}`, "ok");
      }

      if (!doc.pdf) {
        maj(doc.id, { statut: "non_extractible" });
        log(`${doc.nom} : conservé dans le dossier, l'extraction automatique est réservée aux PDF`, "gold");
        return;
      }
      phase = "analyse";

      maj(doc.id, { statut: "analyse", etapes: etapesVierges("run"), erreur: null });
      log(`${doc.nom} : ${doc.forcer ? "relance de l'extraction" : "extraction"} sur le serveur…`);
      const { indicateurs: nouveaux, ...resultat } = await extraireDocument(idServeur, { force: doc.forcer, signal: ctrl.signal });

      maj(doc.id, { statut: "extrait", forcer: false, etapes: etapesTerminees(resultat), resultat, corrections: {} });
      setIndicateurs(nouveaux);
      const titre = titreDocument(resultat);
      if (resultat.status === "ok") {
        log(`${doc.nom} extrait — ${titre}`, "ok");
        notifier(`${echapper(doc.nom)} extrait — ${echapper(titre)}.`, "ok");
      } else {
        const points = resultat.errors.length ? ` (${pluriel(resultat.errors.length, "point")})` : "";
        log(`${doc.nom} extrait — ${titre}, à vérifier${points}`, "gold");
        notifier(`${echapper(doc.nom)} : extraction à vérifier${points}.`, "gold");
      }
    } catch (e) {
      if (e.name === "AbortError") return;
      if (e.status === 415) {
        maj(doc.id, { statut: "non_extractible", etapes: etapesVierges(), forcer: false });
        log(`${doc.nom} : ${e.message}`, "gold");
        return;
      }
      const quoi = phase === "upload" ? "du téléversement" : "de l'extraction";
      maj(doc.id, {
        statut: "erreur",
        erreur: e.message,
        forcer: false,
        etapes: etapesVierges(),
        ...(phase === "upload" ? { progression: 0 } : {})
      });
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

  /* Relance forcée : sans ?force=true, l'API renverrait l'extraction « ok » déjà enregistrée. */
  const relancer = useCallback(id => {
    const d = docsRef.current.find(x => x.id === id);
    if (!d || !["extrait", "erreur"].includes(d.statut)) return;
    log(`Relance du pipeline sur ${d.nom}`);
    maj(id, { statut: "attente", etapes: etapesVierges(), erreur: null, forcer: true });
  }, [log, maj]);

  /* Correction locale d'un champ (chemin : « pied.total_ht », « variables.delai_reglement_jours »…).
     Pas encore d'API : elle n'est ni enregistrée ni reprise dans les indicateurs. */
  const corriger = useCallback((id, chemin, valeur) => {
    maj(id, d => ({ corrections: { ...d.corrections, [chemin]: valeur } }));
    const d = docsRef.current.find(x => x.id === id);
    if (d) log(`Correction locale sur ${d.nom} — non enregistrée sur le serveur`, "gold");
  }, [log, maj]);

  return { docs, journal, actifId, chargement, indicateurs, recharger, ajouter, supprimer, relancer, corriger };
}
