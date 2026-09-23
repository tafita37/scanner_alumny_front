"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import { Divider, Field, Switch } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { ARBITRAGES, PROMPT_SYSTEME } from "@/data/parametres";
import { useUi } from "@/context/UiContext";

const JOB = [
  ["Dernière exécution", "12/08/2026 · 03:00"],
  ["Clients analysés", "7"],
  ["Fiches purgées", "0"],
  ["Prochaine échéance", "Plasturgie Rhône — 22/07/2029"]
];

export function PanneauRgpd() {
  const { toast } = useUi();

  return (
    <div className="grid g-2">
      <Card>
        <CardHead><h2>Politique de conservation</h2></CardHead>
        <Field label="Durée de conservation des champs nominatifs">
          <div className="row wrap">
            <input
              type="number" defaultValue={3} style={{ width: 90 }}
              onChange={e => toast(
                `Durée de conservation portée à ${e.target.value} ans — à documenter comme politique interne.`,
                "gold"
              )}
            />
            <span>ans à compter du <b>dernier dossier créé</b></span>
          </div>
        </Field>

        <Note tone="gold" ico="§" className="mt">
          Le RGPD ne fixe <b>aucune durée précise</b> (art. 5§1.e — conservation limitée à la finalité).
          Le repère de 3 ans vient d&apos;une <b>recommandation CNIL</b> (ex-norme simplifiée NS-056),
          non contraignante, applicable à la prospection commerciale. À documenter comme
          <b> politique interne Alumny</b>, pas comme obligation légale.
        </Note>

        <Divider />
        <h3>Déclenchement du décompte</h3>
        <div className="col gap-s mt-s">
          <label className="check">
            <input type="radio" name="trig" defaultChecked />
            <span>
              Date du <b>dernier dossier créé</b>{" "}
              <span className="hint">(recommandé — un client fidèle ne perd pas ses coordonnées à tort)</span>
            </span>
          </label>
          <label className="check">
            <input type="radio" name="trig" />
            <span>Date de création de la fiche Client <span className="hint">(déconseillé)</span></span>
          </label>
        </div>
      </Card>

      <Card>
        <CardHead><h2>Job de purge automatisée</h2><Badge tone="ok" dot>actif</Badge></CardHead>
        <p className="small muted">
          Tâche planifiée quotidienne (03:00). Pour chaque Client, si le dernier Dossier remonte à plus de
          3 ans, exécute un <b>Update</b> qui vide uniquement les champs nominatifs.
        </p>

        <div className="job mt">
          {JOB.map(([k, v]) => (
            <div className="job-row" key={k}><span>{k}</span><b>{v}</b></div>
          ))}
        </div>

        <button
          className="btn btn-ghost mt" type="button"
          onClick={() => toast(
            "Dry-run : 7 clients analysés, 0 fiche à purger (le plus ancien dossier date de juillet 2026).",
            "ok"
          )}
        >
          Simuler l&apos;exécution (dry-run)
        </button>

        <Note ico="✓" className="mt">
          Ce qui est <b>conservé</b> : SIRET, secteur, montants, ratios, scores et historique de dossiers —
          matière première du futur benchmark sectoriel anonymisé.
        </Note>
      </Card>
    </div>
  );
}

export function PanneauSecurite() {
  const { toast, openModal, closeModal } = useUi();

  const testerPrompt = () => openModal(
    <>
      <h2>Test du prompt système</h2>
      <p className="small muted">Extrait envoyé : devis anonymisé sans montant de fournitures.</p>
      <pre className="json mt-s">{`{
  "taux_horaire_mo": 42.0,
  "montant_fournitures": null,
  "conditions_paiement_jours": 75
}`}</pre>
      <Note ico="✓" className="mt">
        Le modèle renvoie bien <code>null</code> pour la valeur absente au lieu de l&apos;halluciner.
      </Note>
      <ModalActions><button className="btn" type="button" onClick={closeModal}>Fermer</button></ModalActions>
    </>
  );

  return (
    <div className="grid g-2">
      <Card>
        <CardHead><h2>Chiffrement</h2></CardHead>
        <div className="col gap-s">
          <label className="check">
            <input type="radio" name="chiff" defaultChecked />
            <span>
              <b>Chiffrement natif du stockage cloud (SSE)</b>{" "}
              <span className="hint">recommandé — inclus sans surcoût</span>
            </span>
          </label>
          <label className="check">
            <input type="radio" name="chiff" />
            <span>Chiffrement applicatif orchestré par un KMS</span>
          </label>
          <label className="check">
            <input type="radio" name="chiff" disabled />
            <span className="faint">
              Chiffrement applicatif maison{" "}
              <span className="hint">
                — à proscrire : la gestion de clé (rotation, stockage, migration) est une source d&apos;erreurs
                fréquente
              </span>
            </span>
          </label>
        </div>

        <Divider />
        <div className="row-between">
          <span>
            <b>TLS sur tous les transferts</b><br />
            <span className="hint">upload, consultation, téléchargement de rapport</span>
          </span>
          <Switch checked disabled aria-label="TLS sur tous les transferts" />
        </div>
      </Card>

      <Card>
        <CardHead><h2>Prompt système (JSON Mode strict)</h2></CardHead>
        <pre className="json">{PROMPT_SYSTEME}</pre>

        <div className="row gap-s mt wrap">
          <button className="btn btn-ghost btn-s" type="button" onClick={testerPrompt}>Tester le prompt</button>
          <button
            className="btn btn-s" type="button"
            onClick={() => toast("Prompt système enregistré (version 4).", "ok")}
          >
            Enregistrer
          </button>
        </div>

        <Divider />
        <h3>Points à trancher avec la direction</h3>
        <ul className="arbitrages">
          {ARBITRAGES.map(([titre, detail]) => (
            <li key={titre}>{titre}<span>{detail}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
