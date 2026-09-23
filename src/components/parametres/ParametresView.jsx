"use client";

import { useState } from "react";
import PageShell from "@/components/shell/PageShell";
import Badge from "@/components/ui/Badge";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import ParametresSectoriels from "@/components/parametres/ParametresSectoriels";
import Utilisateurs from "@/components/parametres/Utilisateurs";
import { PanneauRgpd, PanneauSecurite } from "@/components/parametres/RgpdEtSecurite";
import { PARAMS, UTILISATEURS } from "@/data/parametres";
import { useUser } from "@/context/UserContext";

const ONGLETS = [
  { id: "sectoriels", label: "Paramètres sectoriels" },
  { id: "users", label: "Utilisateurs & rôles" },
  { id: "rgpd", label: "RGPD & conservation" },
  { id: "secu", label: "Sécurité & prompts" }
];

export default function ParametresView() {
  const [onglet, setOnglet] = useState("sectoriels");
  const [params, setParams] = useState(PARAMS);
  const [users, setUsers] = useState(UTILISATEURS);
  const { estAdmin } = useUser();

  const modifierParam = (cle, valeur) =>
    setParams(list => list.map(p => (p.cle === cle ? { ...p, val: valeur, maj: "12/08/2026" } : p)));

  const basculerParam = (cle, actif) =>
    setParams(list => list.map(p => (p.cle === cle ? { ...p, actif } : p)));

  const basculerUser = (mail, actif) =>
    setUsers(list => list.map(u => (u.mail === mail ? { ...u, actif } : u)));

  return (
    <PageShell
      section="Configuration"
      title="Paramètres & administration"
      actions={
        estAdmin
          ? <Badge tone="gold">Accès Admin</Badge>
          : <Badge tone="ink">Accès Consultant — configuration en lecture seule</Badge>
      }
    >
      <Tabs items={ONGLETS} value={onglet} onChange={setOnglet} />

      <TabPanel active={onglet === "sectoriels"}>
        <ParametresSectoriels
          params={params}
          onModifier={modifierParam}
          onBasculer={basculerParam}
          estAdmin={estAdmin}
        />
      </TabPanel>

      <TabPanel active={onglet === "users"}>
        <Utilisateurs users={users} onBasculer={basculerUser} estAdmin={estAdmin} />
      </TabPanel>

      <TabPanel active={onglet === "rgpd"}><PanneauRgpd /></TabPanel>

      <TabPanel active={onglet === "secu"}><PanneauSecurite /></TabPanel>
    </PageShell>
  );
}
