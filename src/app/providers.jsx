"use client";

import { UserProvider } from "@/context/UserContext";
import { UiProvider } from "@/context/UiContext";

export default function Providers({ children }) {
  return (
    <UserProvider>
      <UiProvider>{children}</UiProvider>
    </UserProvider>
  );
}
