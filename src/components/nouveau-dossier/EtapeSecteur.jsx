"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { IaBlock, IaConf, IaSrc, IaTag } from "@/components/ui/Ia";
import { Divider, Field } from "@/components/ui/Misc";
import { useUi } from "@/context/UiContext";

const CARTES_SECTEUR = [
  { id: "BTP", ico: "⛏", desc: "Coût horaire chargé réel, écart de facturation main-d'œuvre, risque BFR" },
  { id: "Services", ico: "✎", desc: "TJM réel vs vendu, taux de facturabilité, scope creep" },
  { id: "Industrie", ico: "⚙", desc: "TRS/OEE, marge sur coûts variables, immobilisation des stocks" }
];

export default function EtapeSecteur({ dossier, onSecteur, onContact, onPrecedent, onSuivant }) {
  const { toast } = useUi();

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
            onClick={() => {
              onSecteur("BTP");
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

      <div className="sect-cards mt">
        {CARTES_SECTEUR.map(s => (
          <button
            key={s.id} type="button"
            className={"sect-card" + (dossier.secteur === s.id ? " is-on" : "")}
            onClick={() => onSecteur(s.id)}
            aria-pressed={dossier.secteur === s.id}
          >
            <span className="sc-ico">{s.ico}</span>
            <b>{s.id}</b>
            <span className="small muted">{s.desc}</span>
          </button>
        ))}
      </div>
      <p className="hint mt-s">
        L&apos;agent orchestrateur multi-secteurs recroisera ce choix avec le contenu réel des devis déposés.
      </p>

      <Divider />
      <h3>Contact dirigeant <Badge tone="gold">donnée nominative</Badge></h3>
      <p className="hint">
        Champs de l&apos;entité Client. Capturés immédiatement, même en cas d&apos;abandon du parcours (fonction lead).
      </p>

      <div className="form-grid mt-s">
        <Field label="Nom du dirigeant">
          <input type="text" placeholder="Marc Duran" onChange={e => onContact("nom", e.target.value)} />
        </Field>
        <Field label="Fonction"><input type="text" placeholder="Gérant" /></Field>
        <Field label="E-mail *">
          <input type="email" placeholder="m.duran@batiduran.fr" onChange={e => onContact("mail", e.target.value)} />
        </Field>
        <Field label="Téléphone *">
          <input type="text" placeholder="06 12 44 87 20" onChange={e => onContact("tel", e.target.value)} />
        </Field>
      </div>

      <div className="row-between mt">
        <button className="btn btn-ghost" type="button" onClick={onPrecedent}>Retour</button>
        <button className="btn" type="button" onClick={onSuivant}>Continuer</button>
      </div>
    </Card>
  );
}
