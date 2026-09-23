"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell from "@/components/shell/PageShell";
import ClientList from "@/components/clients/ClientList";
import ClientFiche from "@/components/clients/ClientFiche";
import Note from "@/components/ui/Note";
import { CardHead } from "@/components/ui/Card";
import { IaBlock, IaOut, IaPhase, IaSrc } from "@/components/ui/Ia";
import { CLIENTS } from "@/data/al";
import { useUi } from "@/context/UiContext";

const SIGNAUX_COMMERCIAUX = [
  ["Probabilité de conversion", "3 clients à > 70 %", "classification supervisée · churn / conversion"],
  ["Risque d'impayé", "1 client signalé", "scoring propre à la clientèle Alumny"],
  ["Copilote post-audit", "non activé", "RAG sur le rapport et les documents du client"]
];

export default function ClientsView() {
  const [statut, setStatut] = useState("tous");
  const [q, setQ] = useState("");
  const [courant, setCourant] = useState(CLIENTS[0].siret);
  const { toast } = useUi();

  return (
    <PageShell
      section="Pilotage"
      title="Clients / Entreprises"
      actions={
        <>
          <button
            className="btn btn-ghost btn-s" type="button"
            onClick={() => toast("Export CSV du portefeuille (données anonymisées) généré.")}
          >
            Exporter la liste
          </button>
          <Link className="btn" href="/nouveau-dossier">+ Nouvel audit</Link>
        </>
      }
    >
      <Note tone="blue" ico="◍" className="mb">
        La fiche <b>Client</b> est pérenne et indépendante des audits : un même SIRET peut porter plusieurs{" "}
        <b>Dossiers</b> dans le temps (audit initial, puis audit de suivi). Le SIRET est unique sur le Client,
        pas sur le Dossier.
      </Note>

      <div className="clients-cols">
        <ClientList
          statut={statut} onStatut={setStatut}
          q={q} onQ={setQ}
          courant={courant} onSelect={setCourant}
        />
        <ClientFiche siret={courant} />
      </div>

      <IaBlock className="mt">
        <CardHead>
          <h2>Signaux commerciaux sur le portefeuille</h2>
          <IaPhase phase={2} />
        </CardHead>
        <p className="small muted">
          Ces trois briques nécessitent l&apos;historique commercial d&apos;Alumny — conversions, impayés,
          dossiers de suivi. Elles sont maquettées ici avec des valeurs illustratives pour montrer où elles
          s&apos;insèrent, et restées volontairement inactives au lancement.
        </p>
        <div className="grid g-3 mt">
          {SIGNAUX_COMMERCIAUX.map(([titre, valeur, source]) => (
            <IaOut key={titre}>
              <span className="lbl">{titre}</span>
              <div className="ia-big">{valeur}</div>
              <IaSrc>{source}</IaSrc>
            </IaOut>
          ))}
        </div>
      </IaBlock>
    </PageShell>
  );
}
