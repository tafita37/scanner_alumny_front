"use client";

import { useState } from "react";
import { CLIENTS, DOSSIERS, STATUT_TON } from "@/data/al";
import { initiales } from "@/lib/format";
import { useUi } from "@/context/UiContext";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { PanneauHistorique, PanneauIdentite, PanneauRgpd } from "@/components/clients/FichePanels";
import { ModaleEdition, ModalePreuve, ModalePurge } from "@/components/clients/ClientModals";

export default function ClientFiche({ siret }) {
  const client = CLIENTS.find(c => c.siret === siret);
  const dossiers = DOSSIERS.filter(d => d.siret === siret);
  const [onglet, setOnglet] = useState("identite");
  const [syncEnCours, setSyncEnCours] = useState(false);
  const { toast, openModal, closeModal } = useUi();

  const action = acte => {
    if (acte === "refresh") {
      setSyncEnCours(true);
      setTimeout(() => {
        setSyncEnCours(false);
        toast("Données publiques resynchronisées (effectif, CA, NAF, dirigeant).", "ok");
      }, 900);
    }
    if (acte === "edit") openModal(
      <ModaleEdition
        client={client}
        onClose={closeModal}
        onValider={() => { closeModal(); toast("Fiche client mise à jour.", "ok"); }}
      />
    );
    if (acte === "secteur") toast(
      "Le secteur par défaut n'affecte que les <b>futurs</b> dossiers : les anciens gardent leur secteur figé.",
      "gold"
    );
    if (acte === "purge") openModal(
      <ModalePurge
        client={client}
        onClose={closeModal}
        onValider={() => { closeModal(); toast("Champs nominatifs supprimés — dossiers et scores intacts."); }}
      />
    );
    if (acte === "compare") toast("Comparaison inter-audits : −24 % de fuite estimée sur 6 mois.", "gold");
    if (acte === "preuve") openModal(<ModalePreuve onClose={closeModal} />);
  };

  return (
    <Card className="fiche">
      <div className="fiche-head">
        <span className="fiche-mark">{initiales(client.nom)}</span>
        <div className="grow">
          <h2>{client.nom}</h2>
          <p className="small muted" style={{ margin: "2px 0 8px" }}>
            SIRET <span className="mono">{client.siret}</span> · NAF {client.naf} ·{" "}
            {client.effectif} salariés · CA {client.ca}
          </p>
          <div className="row gap-s wrap">
            <Badge tone={STATUT_TON[client.statut]} dot>{client.statut}</Badge>
            <Badge tone="sky">Secteur Alumny : {client.secteur}</Badge>
            <Badge tone="ink">{client.dossiers} audit{client.dossiers > 1 ? "s" : ""}</Badge>
          </div>
        </div>
        <div className="crud-row">
          <button className="btn btn-ghost btn-s" type="button" onClick={() => action("refresh")}>
            {syncEnCours ? "Interrogation de l'API…" : "↻ Rafraîchir depuis l'API"}
          </button>
          <button className="btn btn-s" type="button" onClick={() => action("edit")}>Modifier</button>
        </div>
      </div>

      <Tabs
        value={onglet}
        onChange={setOnglet}
        items={[
          { id: "identite", label: "Identité" },
          { id: "historique", label: `Historique des dossiers (${dossiers.length})` },
          { id: "rgpd", label: "Données personnelles & RGPD" }
        ]}
      />

      <TabPanel active={onglet === "identite"}>
        <PanneauIdentite client={client} onAction={action} />
      </TabPanel>
      <TabPanel active={onglet === "historique"}>
        <PanneauHistorique client={client} onAction={action} />
      </TabPanel>
      <TabPanel active={onglet === "rgpd"}>
        <PanneauRgpd client={client} onAction={action} />
      </TabPanel>
    </Card>
  );
}
