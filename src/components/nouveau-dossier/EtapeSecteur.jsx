"use client";

import { useEffect, useState } from "react";
import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { IaBlock, IaConf, IaSrc, IaTag } from "@/components/ui/Ia";
import { Divider, Field, Spinner } from "@/components/ui/Misc";
import { useUi } from "@/context/UiContext";
import { getSecteurs } from "@/lib/api";
import { nomDirigeant } from "@/lib/format";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Champs manquants ou invalides de l'étape : { champ: message } (vide si tout est bon).
   Tout est obligatoire : le backend exige le dirigeant complet et le secteur d'une nouvelle entreprise. */
export function erreursSecteur(dossier, contact) {
  const e = {};
  const vide = v => !v || !v.trim();
  if (!dossier.secteurId) e.secteur = "Choisis le secteur d'activité.";
  if (vide(contact.prenom)) e.prenom = "Prénom obligatoire.";
  if (vide(contact.nom)) e.nom = "Nom obligatoire.";
  if (vide(contact.mail)) e.mail = "E-mail obligatoire.";
  else if (!EMAIL.test(contact.mail.trim())) e.mail = "E-mail invalide.";
  else if (contact.mail.trim().length > 50) e.mail = "50 caractères au maximum.";
  if (vide(contact.tel)) e.tel = "Téléphone obligatoire.";
  if (vide(contact.fonction)) e.fonction = "Fonction obligatoire.";
  else if (contact.fonction.trim().length > 50) e.fonction = "50 caractères au maximum.";
  return e;
}

/* La liste ne change pas d'un dossier à l'autre : chargée une fois, gardée entre les allers-retours d'étapes. */
let secteursEnCache = null;

export default function EtapeSecteur({ dossier, contact, onSecteur, onContact, onPrecedent, onSuivant }) {
  const { toast } = useUi();
  const dirigeantApi = nomDirigeant(dossier.entreprise);
  const [secteurs, setSecteurs] = useState(secteursEnCache);
  const [erreur, setErreur] = useState(null);
  const [essai, setEssai] = useState(0);
  /* Les erreurs ne s'affichent qu'après une première tentative de passer à l'étape suivante. */
  const [tente, setTente] = useState(false);
  const erreurs = tente ? erreursSecteur(dossier, contact) : {};

  const continuer = () => {
    if (Object.keys(erreursSecteur(dossier, contact)).length) {
      setTente(true);
      toast("Complète les champs obligatoires avant de continuer.", "gold");
      return;
    }
    onSuivant();
  };

  useEffect(() => {
    if (secteursEnCache) return;
    let annule = false;
    setErreur(null);
    getSecteurs()
      .then(liste => {
        secteursEnCache = liste;
        if (!annule) setSecteurs(liste);
      })
      .catch(err => { if (!annule) setErreur(err.message); });
    return () => { annule = true; };
  }, [essai]);

  /* Secteur suggéré par l'IA (encore statique) : retrouvé dans la liste de l'API par son nom. */
  const suggestion = secteurs?.find(s => s.name === "BTP");

  return (
    <Card>
      <CardHead>
        <h2>Secteur d&apos;activité &amp; contact dirigeant</h2>
        <IaTag phase={1}>Classification du secteur réel</IaTag>
      </CardHead>

      <IaBlock className="mb">
        <div className="row-between" style={{ gap: 12 }}>
          <span className="small">
            <b>Suggestion :</b> secteur <b>BTP</b> — code NAF 43.99C et libellé d&apos;activité
            « autres travaux spécialisés de construction ».
            <IaConf value={0.91} className="ml-s" />
          </span>
          <button
            className="btn btn-s btn-gold" type="button"
            disabled={!suggestion}
            onClick={() => {
              onSecteur(suggestion);
              toast("Secteur suggéré appliqué — modifiable jusqu'à la création du dossier.", "ok");
            }}
          >
            Appliquer
          </button>
        </div>
        <IaSrc>
          LLM zero-shot au lancement, fine-tuning une fois un corpus étiqueté accumulé · le consultant tranche toujours
        </IaSrc>
      </IaBlock>

      <p className="muted small">
        Le secteur choisi <b>pilote le moteur de calcul</b> du module 3 et sera figé sur le dossier
        (snapshot) : corriger plus tard le secteur du client ne modifiera pas cet audit.
      </p>

      {erreur ? (
        <div className="row-between mt" style={{ gap: 12 }}>
          <span className="hint">{erreur}</span>
          <button className="btn btn-ghost btn-s" type="button" onClick={() => setEssai(n => n + 1)}>
            Réessayer
          </button>
        </div>
      ) : !secteurs ? (
        <div className="ac-load mt"><Spinner /> Chargement des secteurs…</div>
      ) : (
        <div className="sect-cards mt">
          {secteurs.map(s => (
            <button
              key={s.id} type="button"
              className={"sect-card" + (dossier.secteurId === s.id ? " is-on" : "")}
              onClick={() => onSecteur(s)}
              aria-pressed={dossier.secteurId === s.id}
            >
              <b>{s.name}</b>
              <span className="small muted">{s.description}</span>
            </button>
          ))}
        </div>
      )}
      {erreurs.secteur && <p className="hint hint-err mt-s">{erreurs.secteur}</p>}
      <p className="hint mt-s">
        L&apos;agent orchestrateur multi-secteurs recroisera ce choix avec le contenu réel des devis déposés.
      </p>

      <Divider />
      <h3>Contact dirigeant <Badge tone="gold">donnée nominative</Badge></h3>
      <p className="hint">
        Champs de l&apos;entité Client. Capturés immédiatement, même en cas d&apos;abandon du parcours (fonction lead).
      </p>

      {dirigeantApi && (
        <p className="hint">
          Dirigeant <b>pré-rempli</b> depuis l&apos;annuaire des entreprises — modifiable si besoin.
        </p>
      )}

      <div className="form-grid mt-s">
        <Field label="Prénom du dirigeant *" error={erreurs.prenom}>
          <input type="text" placeholder="Marc" value={contact.prenom}
            onChange={e => onContact("prenom", e.target.value)} />
        </Field>
        <Field label="Nom du dirigeant *" error={erreurs.nom}>
          <input type="text" placeholder="Duran" value={contact.nom}
            onChange={e => onContact("nom", e.target.value)} />
        </Field>
        <Field label="E-mail *" error={erreurs.mail}>
          <input type="email" placeholder="m.duran@batiduran.fr" value={contact.mail}
            onChange={e => onContact("mail", e.target.value)} />
        </Field>
        <Field label="Téléphone *" error={erreurs.tel}>
          <input type="text" placeholder="06 12 44 87 20" value={contact.tel}
            onChange={e => onContact("tel", e.target.value)} />
        </Field>
        <Field label="Fonction *" className="span-2" error={erreurs.fonction}>
          <input type="text" placeholder="Gérant" value={contact.fonction}
            onChange={e => onContact("fonction", e.target.value)} />
        </Field>
      </div>

      <div className="row-between mt">
        <button className="btn btn-ghost" type="button" onClick={onPrecedent}>Retour</button>
        <button className="btn" type="button" onClick={continuer}>Continuer</button>
      </div>
    </Card>
  );
}
