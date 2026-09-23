"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Field, Table, TableWrap } from "@/components/ui/Misc";
import { ModalActions } from "@/components/ui/Modal";
import { PERMISSIONS, ROLES_FUTURS } from "@/data/parametres";
import { useUi } from "@/context/UiContext";

export default function Utilisateurs({ users, onBasculer, estAdmin }) {
  const { toast, openModal, closeModal } = useUi();

  const desactiver = u => openModal(
    <>
      <h2>Désactiver {u.nom} ?</h2>
      <p>
        Il s&apos;agit d&apos;une <b>désactivation (soft delete)</b>, jamais d&apos;une suppression définitive :
        les {u.dossiers} dossiers traités par ce compte doivent rester traçables.
      </p>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
        <button
          className="btn btn-danger" type="button"
          onClick={() => { closeModal(); onBasculer(u.mail, false); toast("Compte désactivé — traçabilité conservée."); }}
        >
          Désactiver
        </button>
      </ModalActions>
    </>
  );

  const inviter = () => openModal(
    <>
      <h2>Créer un compte interne</h2>
      <p className="small muted">
        Réservé aux collaborateurs Alumny habilités — le client final n&apos;a jamais de compte.
      </p>
      <div className="form-grid mt">
        <Field label="Nom"><input type="text" /></Field>
        <Field label="E-mail professionnel"><input type="email" /></Field>
        <Field label="Rôle"><select><option>Consultant</option><option>Admin</option></select></Field>
        <Field label="Mot de passe provisoire"><input type="text" defaultValue="Alumny-2026!" /></Field>
      </div>
      <ModalActions>
        <button className="btn btn-ghost" type="button" onClick={closeModal}>Annuler</button>
        <button
          className="btn" type="button"
          onClick={() => { closeModal(); toast("Compte créé — invitation envoyée.", "ok"); }}
        >
          Créer
        </button>
      </ModalActions>
    </>
  );

  return (
    <div className="grid g-2">
      <Card>
        <CardHead>
          <h2>Comptes internes</h2>
          <button className="btn btn-s" type="button" disabled={!estAdmin} onClick={inviter}>
            + Créer un compte
          </button>
        </CardHead>

        <ul className="users">
          {users.map(u => (
            <li key={u.mail} className={u.actif ? undefined : "off"}>
              <span
                className="avatar"
                style={{ background: u.role === "Admin" ? "var(--blue)" : "var(--gold)" }}
              >
                {u.ini}
              </span>
              <span className="grow">
                <span className="u-nom">{u.nom}</span><br />
                <span className="u-mail">{u.mail} · {u.dossiers} dossiers traités</span>
              </span>
              <Badge tone={u.role === "Admin" ? "gold" : "sky"}>{u.role}</Badge>
              <button
                className="btn btn-ghost btn-s" type="button"
                onClick={() => {
                  if (u.actif) desactiver(u);
                  else { onBasculer(u.mail, true); toast("Compte réactivé.", "ok"); }
                }}
              >
                {u.actif ? "Désactiver" : "Réactiver"}
              </button>
            </li>
          ))}
        </ul>

        <p className="hint mt-s">
          La suppression est un <b>soft delete</b> (désactivation) : la traçabilité des dossiers traités
          doit être conservée.
        </p>
      </Card>

      <Card>
        <CardHead><h2>Rôles &amp; permissions</h2></CardHead>
        <p className="small muted">
          Deux rôles suffisent au lancement, mais la table Rôle est <b>séparée</b> (permissions associées),
          pas un simple booléen <code>is_admin</code> — pour accueillir de futurs rôles sans refonte.
        </p>

        <TableWrap className="mt">
          <Table>
            <thead>
              <tr><th>Permission</th><th className="center">Admin</th><th className="center">Consultant</th></tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(([titre, admin, consultant]) => (
                <tr key={titre}>
                  <td>{titre}</td>
                  <td className={"center " + (admin ? "perm-ok" : "perm-no")}>{admin ? "✓" : "—"}</td>
                  <td className={"center " + (consultant ? "perm-ok" : "perm-no")}>{consultant ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>

        <h3 className="mt">Rôles envisagés (extensibilité)</h3>
        <ul className="roles-futurs">
          {ROLES_FUTURS.map(([nom, quoi]) => (
            <li key={nom}><b>{nom}</b><span>{quoi}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
