"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Spinner } from "@/components/ui/Misc";
import { getProfile } from "@/lib/api";

/* Garde des pages applicatives.
   Le token vit dans le stockage du navigateur : la vérification se fait donc
   côté client. Tant que la session n'est pas relue (ou si elle est absente),
   rien de la page protégée n'est rendu. */
export default function RequireAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { pret, estConnecte, token, finSession, majProfil } = useUser();

  /* Pas de session → retour à la connexion, en mémorisant la page demandée
     (sauf après une déconnexion volontaire). */
  useEffect(() => {
    if (!pret || estConnecte) return;
    const cible = finSession === "volontaire" ? "/" : `/?next=${encodeURIComponent(pathname)}`;
    router.replace(cible);
  }, [pret, estConnecte, finSession, pathname, router]);

  /* Vérifie une fois par token qu'il est toujours accepté par le backend
     (révoqué, supprimé depuis l'admin…) et rafraîchit le profil au passage.
     Un 401 ferme la session directement dans apiFetch. */
  useEffect(() => {
    if (!token) return;
    let annule = false;
    getProfile()
      .then(u => { if (!annule) majProfil(u); })
      .catch(err => {
        console.log(err);
        
        /* 401 : session déjà fermée par apiFetch ; autre erreur (réseau…) : on garde la session locale */
      });
    return () => { annule = true; };
  }, [token, majProfil]);

  if (!pret || !estConnecte) {
    return (
      <div className="auth-wait" role="status" aria-live="polite">
        <Spinner />
        <span className="muted small">Vérification de la session…</span>
      </div>
    );
  }

  return children;
}
