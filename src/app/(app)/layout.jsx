import AppShell from "@/components/shell/AppShell";

/* Toutes les pages de ce groupe partagent la coquille applicative
   (barre latérale + Copilote). La page de connexion en est exclue. */
export default function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
