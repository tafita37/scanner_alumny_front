"use client";

import Card, { CardHead } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import { Divider, Spinner } from "@/components/ui/Misc";
import { useUi } from "@/context/UiContext";

export const ETAPES_PIPELINE = [
  { k: "natif", n: 1, titre: "Extraction native du texte", desc: "rapide, gratuite — si le PDF contient une vraie couche de texte", msg: "texte natif détecté", duree: 700 },
  { k: "ocr", n: 2, titre: "Bascule OCR / Vision LLM", desc: "Qwen 2.5 VL 7B en local via Ollama — image → JSON en un appel", msg: "non nécessaire", duree: 500 },
  { k: "anon", n: 3, titre: "Anonymisation locale", desc: "regex (e-mail, téléphone) + NER Presidio/spaCy (nom, adresse)", msg: "4 entités masquées", duree: 900 },
  { k: "llm", n: 4, titre: "Extraction structurée JSON strict", desc: null, msg: "12 champs · schéma valide", duree: 1100 },
  { k: "check", n: 5, titre: "Auto-évaluation qualité", desc: "bornes min/max par secteur — re-extraction ou alerte humaine", msg: "1 champ sous le seuil", duree: 800 }
];

const HINTS = {
  local: "Auto-hébergé, ~8-12 Go de VRAM. Aucune donnée ne quitte l'infrastructure Alumny ; fiabilité légèrement inférieure sur les documents très dégradés.",
  externe: "Meilleure qualité sur écriture manuscrite et photos dégradées, mais l'image brute part chez un tiers : exige une anonymisation en amont ou un DPA / Zero Data Retention."
};

/* etat : { encours: bool, index: number } — index = étape en cours d'exécution */
export default function PipelineExtraction({ etat, moteur, onMoteur, onRelancer }) {
  const { toast } = useUi();

  const classe = i => {
    if (etat.encours && i === etat.index) return "is-run";
    if (etat.encours && i > etat.index) return "";
    return ETAPES_PIPELINE[i].msg === "non nécessaire" ? "is-skip" : "is-ok";
  };

  const choisirMoteur = m => {
    onMoteur(m);
    if (m === "externe") toast("Attention : garanties contractuelles requises (DPA / Zero Data Retention).", "gold");
  };

  return (
    <Card>
      <CardHead>
        <h2>Pipeline d&apos;extraction</h2>
        <Badge tone={etat.encours ? "warn" : "ok"}>{etat.encours ? "en cours" : "terminé"}</Badge>
      </CardHead>

      <ol className="pipe">
        {ETAPES_PIPELINE.map((e, i) => (
          <li key={e.k} className={classe(i)}>
            <span className="pipe-n">{e.n}</span>
            <div>
              <b>{e.titre}</b>
              <span>
                {e.k === "llm"
                  ? <>schéma imposé, <code>null</code> plutôt qu&apos;une valeur hallucinée</>
                  : e.desc}
              </span>
            </div>
            <span className="pipe-s">
              {etat.encours && i === etat.index
                ? <Spinner style={{ display: "inline-block", verticalAlign: -2 }} />
                : etat.encours && i > etat.index ? "" : e.msg}
            </span>
          </li>
        ))}
      </ol>

      <Divider />

      <div className="row wrap row-between" style={{ gap: 14 }}>
        <div>
          <span className="lbl">Moteur d&apos;extraction</span>
          <div className="row gap-s mt-s wrap">
            <Chip active={moteur === "local"} onClick={() => choisirMoteur("local")}>Vision LLM local (RGPD ✓)</Chip>
            <Chip active={moteur === "externe"} onClick={() => choisirMoteur("externe")}>API externe (qualité +)</Chip>
          </div>
        </div>
        <button className="btn btn-ghost btn-s" type="button" onClick={onRelancer}>Relancer le pipeline</button>
      </div>

      <p className="hint mt-s">{HINTS[moteur]}</p>
    </Card>
  );
}
