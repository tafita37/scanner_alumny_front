"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/data/al";
import { useUser } from "@/context/UserContext";
import { logout } from "@/lib/api";

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, fermerSession } = useUser();

  /* Révoque le token côté serveur (au mieux) puis vide la session locale,
     même si le backend est injoignable. */
  const seDeconnecter = async () => {
    try { await logout(); } catch { /* token déjà invalide ou serveur injoignable */ }
    fermerSession("volontaire");
    router.replace("/");
  };

  return (
    <aside className="sidebar" id="sidebar">
      <Link className="brand" href="/dashboard">
        <span className="brand-mark">A</span>
        <span className="brand-txt">
          <span className="brand-name">Alumny</span><br />
          <span className="brand-sub">scanner &amp; copilote</span>
        </span>
      </Link>

      <nav className="nav">
        {NAV.map((item, i) => item.g
          ? <div className="nav-group" key={`g-${i}`}>{item.g}</div>
          : (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={pathname === item.href ? "is-active" : undefined}
              onClick={onNavigate}
            >
              <span className="nav-ico">{item.ico}</span>{item.label}
            </Link>
          ))}
      </nav>

      <div className="sidebar-foot">
        <div className="who">
          <span className="avatar">{user.initiales}</span>
          <span className="grow who-txt">
            <span className="who-name">{user.nom}</span><br />
            <span className="who-role">{user.role} · outil interne</span>
          </span>
          <button
            type="button" title="Se déconnecter" aria-label="Se déconnecter" className="who-out"
            style={{ color: "var(--sky)", background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
            onClick={seDeconnecter}
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
