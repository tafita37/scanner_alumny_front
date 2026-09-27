import AppShell from "@/components/shell/AppShell";
import RequireAuth from "@/components/auth/RequireAuth";

/* Toutes les pages de ce groupe sont protégées (session requise) et partagent
   la coquille applicative (barre latérale + Copilote). La page de connexion
   en est exclue. */
export default function AppLayout({ children }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
