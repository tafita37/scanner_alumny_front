"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginArt from "@/components/login/LoginArt";
import Chip from "@/components/ui/Chip";
import { Field } from "@/components/ui/Misc";
import { useUser } from "@/context/UserContext";

const ROLES = [
  { role: "Admin", nom: "Ny Aina R.", init: "NR", mail: "ny-aina@alumny.fr", label: "Admin — Ny Aina" },
  { role: "Consultant", nom: "Tafita A.", init: "TA", mail: "tafita@alumny.fr", label: "Consultant — Tafita" }
];

export default function LoginView() {
  const router = useRouter();
  const { setUser } = useUser();
  const [role, setRole] = useState("Admin");
  const [mail, setMail] = useState(ROLES[0].mail);
  const [pwd, setPwd] = useState("••••••••••");
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const choisirRole = r => {
    setRole(r.role);
    setMail(r.mail);
    setUser({ nom: r.nom, initiales: r.init, role: r.role });
  };

  const soumettre = e => {
    e.preventDefault();
    setEnCours(true);
    setTimeout(() => router.push("/dashboard"), 750);
  };

  return (
    <main className="login">
      <LoginArt />

      <section className="login-form">
        <div className="login-box">
          <p className="hand">Bon retour parmi nous 👋</p>
          <h2>Connexion consultant</h2>
          <p className="muted small">Accès réservé aux collaborateurs Alumny habilités.</p>

          <form className="col" style={{ gap: 16, marginTop: 22 }} onSubmit={soumettre}>
            <Field label="E-mail professionnel" htmlFor="mail">
              <input
                type="email" id="mail" autoComplete="username"
                value={mail} onChange={e => setMail(e.target.value)}
              />
            </Field>

            <Field label="Mot de passe" htmlFor="pwd">
              <div className="pwd-wrap">
                <input
                  type={visible ? "text" : "password"} id="pwd" autoComplete="current-password"
                  value={pwd} onChange={e => setPwd(e.target.value)}
                />
                <button
                  type="button" className="pwd-eye"
                  title={visible ? "Masquer" : "Afficher"}
                  onClick={() => setVisible(v => !v)}
                >
                  {visible ? "◌" : "◉"}
                </button>
              </div>
            </Field>

            <div className="row-between">
              <label className="check">
                <input type="checkbox" defaultChecked /> <span className="small">Rester connecté 7 jours</span>
              </label>
              <a href="#" className="small">Mot de passe oublié ?</a>
            </div>

            <button className={"btn" + (enCours ? " is-loading" : "")} id="submit" type="submit">
              {enCours ? "Vérification des habilitations…" : "Se connecter"}
            </button>
          </form>

          <div className="role-hint">
            <span className="lbl">Se connecter en tant que</span>
            <div className="row gap-s wrap mt-s">
              {ROLES.map(r => (
                <Chip key={r.role} active={role === r.role} onClick={() => choisirRole(r)}>{r.label}</Chip>
              ))}
            </div>
            <p className="hint mt-s">
              Le rôle Consultant n&apos;accède pas à la configuration des formules sectorielles.
            </p>
          </div>
        </div>

        <p className="login-legal tiny faint">
          Traitement de données à caractère personnel — durée de conservation des champs nominatifs :
          3 ans à compter du dernier dossier (politique interne Alumny, inspirée de la recommandation CNIL).
        </p>
      </section>
    </main>
  );
}
