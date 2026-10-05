"use client";

import { UserProvider } from "@/context/UserContext";
import { UiProvider } from "@/context/UiContext";
import { DossiersProvider } from "@/context/DossiersContext";

export default function Providers({ children }) {
  return (
    <UserProvider>
      <UiProvider>
        <DossiersProvider>{children}</DossiersProvider>
      </UiProvider>
    </UserProvider>
  );
}
