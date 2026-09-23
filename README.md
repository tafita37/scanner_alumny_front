# Alumny — Scanner & Copilote (Next.js)

Portage fidèle de la maquette `../maquette_html` en application Next.js (App Router, JSX).
Le design, la charte et les contenus sont repris à l'identique ; la logique des scripts de la
maquette est convertie en état React.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de production
npm start
```

## Routes

| Route              | Maquette d'origine     | Écran                                    |
| ------------------ | ---------------------- | ---------------------------------------- |
| `/`                | `index.html`           | Connexion consultant (sans coquille)     |
| `/dashboard`       | `dashboard.html`       | Tableau de bord                          |
| `/clients`         | `clients.html`         | Portefeuille & fiche client              |
| `/nouveau-dossier` | `nouveau-dossier.html` | Onboarding (assistant 4 étapes)          |
| `/documents`       | `documents.html`       | Analyse documentaire (OCR & IA)          |
| `/cockpit`         | `cockpit.html`         | Cockpit consultant (3 moteurs)           |
| `/rapports`        | `rapports.html`        | Restitution & rapport PDF                |
| `/intelligence`    | `intelligence.html`    | Benchmark & veille                       |
| `/parametres`      | `parametres.html`      | Paramètres & administration              |

Toutes les routes sauf `/` sont regroupées dans `src/app/(app)/` et partagent la coquille
applicative (barre latérale, topbar, Copilote).

## Organisation

```
src/
  app/
    layout.jsx              polices next/font + providers + styles
    page.jsx                connexion
    (app)/layout.jsx        coquille applicative
    (app)/<route>/page.jsx  une page par écran (métadonnées + vue)
  components/
    shell/                  AppShell, Sidebar, Topbar, PageShell, Copilote
    ui/                     briques réutilisées partout (Badge, Card, Note, Chip,
                            Tabs, Modal, ToastZone, KpiCard, Ia*, Misc…)
    login/ dashboard/ clients/ nouveau-dossier/ documents/
    cockpit/ rapports/ intelligence/ parametres/
                            composants propres à chaque écran
  context/
    UserContext.jsx         profil consultant (mémorisé en localStorage)
    UiContext.jsx           toasts + modales, disponibles depuis n'importe où
  data/                     jeux de données de démonstration (ex-`AL` de common.js)
  lib/                      formatage FR et hooks (compteur animé, media query)
  styles/                   feuilles de la maquette + couche responsive
```

### Points de factorisation

- `PageShell` porte la topbar (section, titre, actions) de chaque écran ;
  `AppShell` porte la barre latérale, le voile mobile et le Copilote.
- `useUi()` expose `toast()` et `openModal()` : plus aucune manipulation du DOM,
  les modales sont des composants React.
- `Badge` / `StatusBadge`, `Card`/`CardHead`, `Note`, `Chip`/`ChipFilter`, `Tabs`/`TabPanel`,
  `Table`/`TableWrap`, `Steps`, `Switch`, `Field`, `Bar`, `Placeholder`, `Spinner`,
  `IaTag`/`IaBlock`/`IaOut`/`IaSrc`/`IaConf` couvrent toute la charte.
- Les jeux de données sont sortis des composants (`src/data`), prêts à être remplacés
  par des appels d'API.

## Styles

`src/styles/globals.css` importe, dans l'ordre : `common.css`, les feuilles de page, puis
`responsive-extra.css`. Les feuilles de la maquette sont reprises telles quelles (seules les
variables de police pointent vers `next/font`).

`responsive-extra.css` ne modifie pas le design : il complète l'adaptatif là où la maquette
avait encore des largeurs en dur ou des débordements — champs de recherche et filtres des
en-têtes de carte, libellés du détail de calcul, titres d'indicateurs, montant « perte sèche »
sur très petits écrans, jauge sous 380 px, coupure des identifiants longs, pieds de modale
empilés, téléphones en paysage, écrans ≤ 360 px et respect de `prefers-reduced-motion`.
Deux tableaux qui débordaient de leur carte sur mobile (champs extraits, anonymisation) sont
désormais dans un conteneur défilant.

## Notes

- Les données sont fictives et vivent en mémoire : aucune persistance hors du profil consultant.
- « Glacial Indifference » n'étant pas sur Google Fonts, le titrage utilise Josefin Sans,
  le substitut déjà prévu par la maquette.
