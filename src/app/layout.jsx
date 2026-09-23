import { Josefin_Sans, Handlee } from "next/font/google";
import Providers from "@/app/providers";
import "@/styles/globals.css";

/* « Glacial Indifference » n'est pas distribuée par Google Fonts :
   la maquette prévoyait déjà Josefin Sans comme substitut de titrage. */
const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-josefin",
  display: "swap"
});

const handlee = Handlee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-handlee",
  display: "swap"
});

export const metadata = {
  title: {
    default: "Alumny Scanner",
    template: "%s · Alumny Scanner"
  },
  description: "Alumny — Scanner & Copilote : outil interne des consultants Alumny."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2550A2"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${josefin.variable} ${handlee.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
