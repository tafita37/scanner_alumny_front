"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginArt from "@/components/login/LoginArt";
import Chip from "@/components/ui/Chip";
import { Field, Spinner } from "@/components/ui/Misc";
import Note from "@/components/ui/Note";
import { useUser } from "@/context/UserContext";
import { login } from "@/lib/api";

/* Page demandée avant la redirection vers la connexion (?next=/clients).
   Seuls les chemins internes sont acceptés, pour éviter une redirection
   vers un site externe (//exemple.com, https://…). */
function destination() {
  try {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) return next;
  } catch { /* URL illisible */ }
  return "/nouveau-dossier";
  // return "/dashboard";
}

export default function LoginView() {
  const router = useRouter();
  const { ouvrirSession, pret, estConnecte, finSession } = useUser();
  const [role, setRole] = useState("Admin");
  const [mail, setMail] = useState("");
  const [pwd, setPwd] = useState("");
  const [visible, setVisible] = useState(false);
  const [resterConnecte, setResterConnecte] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  /* Déjà connecté → inutile de rester sur la page de connexion */
  useEffect(() => {
    if (pret && estConnecte && !enCours) router.replace(destination());
  }, [pret, estConnecte, enCours, router]);

  /* Raccourci de démo : pré-remplit l'e-mail. Le rôle réel est
     désormais déterminé par le backend (is_staff → Admin). */
  const choisirRole = r => {
    setRole(r.role);
    setMail(r.mail);
    setErreur("");
  };

  const soumettre = async e => {
    e.preventDefault();
    if (enCours) return;
    setErreur("");
    setEnCours(true);
    try {
      const reponse = await login(mail.trim(), pwd);
      ouvrirSession(reponse, resterConnecte);
      router.replace(destination());
    } catch (err) {
      setErreur(err.message || "Connexion impossible.");
      setEnCours(false);
    }
  };

  /* Session pas encore relue, ou déjà connecté (redirection en cours) :
     le formulaire n'apparaît pas, pour ne pas le montrer à un utilisateur connecté. */
  if (!pret || (estConnecte && !enCours)) {
    return (
      <div className="auth-wait" role="status" aria-live="polite">
        <Spinner />
        <span className="muted small">Vérification de la session…</span>
      </div>
    );
  }

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
                required disabled={enCours}
                value={mail} onChange={e => setMail(e.target.value)}
              />
            </Field>

            <Field label="Mot de passe" htmlFor="pwd">
              <div className="pwd-wrap">
                <input
                  type={visible ? "text" : "password"} id="pwd" autoComplete="current-password"
                  required disabled={enCours}
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
              <a href="#" className="small">Mot de passe oublié ?</a>
            </div>

            {!erreur && finSession === "expiree" && (
              <Note tone="gold" ico="⏱">Votre session a expiré. Merci de vous reconnecter.</Note>
            )}
            {erreur && <Note tone="bad" ico="⚠">{erreur}</Note>}

            <button
              className={"btn" + (enCours ? " is-loading" : "")} id="submit" type="submit"
              disabled={enCours}
            >
              {enCours ? "Vérification des habilitations…" : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="login-legal tiny faint">
          Traitement de données à caractère personnel — durée de conservation des champs nominatifs :
          3 ans à compter du dernier dossier (politique interne Alumny, inspirée de la recommandation CNIL).
        </p>
      </section>
    </main>
  );
}
