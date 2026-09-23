"use client";

import { useState } from "react";
import Note from "@/components/ui/Note";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import { Field, Switch, Table, TableWrap } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { useUi } from "@/context/UiContext";

const FAMILLES = ["Communs", "BTP", "Services", "Industrie"];

export default function ParametresSectoriels({ params, onModifier, onBasculer, estAdmin }) {
  const [famille, setFamille] = useState("Communs");
  const { toast, openModal, closeModal } = useUi();

  const liste = params.filter(p => p.fam === famille);
  const desactives = params.filter(p => !p.actif).length;

  const ouvrirEdition = param => {
    let valeur = param.val;
    openModal(
      <>
        <h2>Modifier « {param.nom} »</h2>
        <p className="small muted mono">{param.cle}</p>
        <Field label={`Valeur (${param.unite})`} className="mt">
          <input type="text" defaultValue={param.val} onChange={e => { valeur = e.target.value; }} />
        </Field>
        <Note tone="gold" ico="⚠" className="mt">
          Les dossiers <b>déjà analysés</b> conservent la valeur en vigueur au moment de leur calcul.
          Seuls les futurs calculs utiliseront cette nouvelle valeur.
        </Note>
        <ModalActions>
          <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
          <button
            className="btn" type="button"
            onClick={() => {
              closeModal();
              onModifier(param.cle, valeur);
              toast("Paramètre mis à jour — aucun redéploiement nécessaire.", "ok");
            }}
          >
            Enregistrer
          </button>
        </ModalActions>
      </>
    );
  };

  const ouvrirCreation = () => openModal(
    <>
      <h2>Nouveau paramètre sectoriel</h2>
      <div className="form-grid mt">
        <Field label="Libellé" className="span-2">
          <input type="text" placeholder="Ex. Taux horaire de référence — plomberie" />
        </Field>
        <Field label="Clé technique"><input type="text" placeholder="btp.taux_plomberie" /></Field>
        <Field label="Portée">
          <select>{FAMILLES.map(f => <option key={f}>{f}</option>)}</select>
        </Field>
        <Field label="Valeur"><input type="text" /></Field>
        <Field label="Unité"><input type="text" placeholder="€/h" /></Field>
      </div>
      <p className="hint mt-s">
        Utile notamment si un 4ᵉ secteur est ajouté : aucune migration de base n&apos;est nécessaire.
      </p>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
        <button className="btn" type="button" onClick={() => { closeModal(); toast("Paramètre créé.", "ok"); }}>
          Créer
        </button>
      </ModalActions>
    </>
  );

  return (
    <div>
      <Note tone="blue" ico="⚙" className="mb">
        Ces constantes sont stockées <b>en base</b>, pas codées en dur : modifier un coefficient fait évoluer
        les formules <b>sans redéploiement</b>. La désactivation (soft delete) préserve l&apos;historique
        des calculs déjà réalisés.
      </Note>

      <div className="row gap-s wrap mb">
        {FAMILLES.map(f => (
          <Chip key={f} active={famille === f} onClick={() => setFamille(f)}>{f}</Chip>
        ))}
        <span className="grow" />
        <button className="btn btn-ghost btn-s" type="button" disabled={!estAdmin} onClick={ouvrirCreation}>
          + Nouveau paramètre
        </button>
      </div>

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>Paramètre</th><th>Clé</th><th className="right">Valeur</th>
              <th>Portée</th><th>Dernière modif.</th><th>Actif</th><th />
            </tr>
          </thead>
          <tbody>
            {liste.map(p => (
              <tr key={p.cle} className={p.actif ? undefined : "faint"}>
                <td>
                  {p.nom}
                  {p.fragile && <> <Badge tone="warn">à surveiller</Badge></>}
                </td>
                <td className="mono">{p.cle}</td>
                <td className="right">
                  <span className="val-edit">
                    <span className="val-strong">{p.val}</span> <span className="faint">{p.unite}</span>
                  </span>
                </td>
                <td><Badge tone="sky">{p.fam}</Badge></td>
                <td className="small faint">{p.maj}</td>
                <td>
                  <Switch
                    checked={p.actif}
                    disabled={!estAdmin}
                    aria-label={`Activer ${p.nom}`}
                    onChange={coche => {
                      onBasculer(p.cle, coche);
                      toast(coche
                        ? "Paramètre réactivé."
                        : "Paramètre désactivé (soft delete) — historique conservé.");
                    }}
                  />
                </td>
                <td className="right">
                  <button
                    className="btn btn-ghost btn-s" type="button"
                    disabled={!estAdmin} onClick={() => ouvrirEdition(p)}
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      <p className="hint mt-s">
        {liste.length} paramètre(s) dans « {famille} » · {desactives} désactivé(s) au total
        (soft delete, historique de calcul préservé).
      </p>
    </div>
  );
}
