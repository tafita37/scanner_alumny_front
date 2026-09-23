"use client";

import { useState } from "react";
import PageShell from "@/components/shell/PageShell";
import Note from "@/components/ui/Note";
import Badge from "@/components/ui/Badge";
import { CardHead } from "@/components/ui/Card";
import { IaBlock, IaConf, IaOut, IaSrc, IaTag } from "@/components/ui/Ia";
import Scatter from "@/components/intelligence/Scatter";
import Sparkline from "@/components/intelligence/Sparkline";
import { INTEL } from "@/data/intelligence";
import { SECTEURS } from "@/data/al";
import { useAnimatedNumber } from "@/lib/hooks";
import { groupe } from "@/lib/format";
import { useUi } from "@/context/UiContext";

function NombreCluster({ valeur }) {
  const anime = useAnimatedNumber(valeur);
  return <div className="big">{groupe(anime)}</div>;
}

const tonZ = libelle =>
  libelle.includes("élevé") ? "bad" : libelle.includes("faible") ? "ok" : "warn";

export default function IntelligenceView() {
  const [secteur, setSecteur] = useState("BTP");
  const [cle, setCle] = useState(0);
  const { toast } = useUi();
  const d = INTEL[secteur];

  const changerSecteur = valeur => {
    setSecteur(valeur);
    setCle(k => k + 1);
    toast(`Cluster et veille recalculés pour le secteur <b>${valeur}</b>.`, "gold");
  };

  return (
    <PageShell
      section="Intelligence sectorielle"
      title="Benchmark & veille"
      actions={
        <>
          <select
            className="select-auto" value={secteur} aria-label="Secteur analysé"
            onChange={e => changerSecteur(e.target.value)}
          >
            {SECTEURS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button
            className="btn btn-ghost btn-s" type="button"
            onClick={() => {
              setCle(k => k + 1);
              toast("Sources publiques resynchronisées (SIRENE, Pappers, INSEE).", "ok");
            }}
          >
            ↻ Resynchroniser les sources publiques
          </button>
        </>
      }
    >
      <Note tone="gold" ico="◈" className="mb">
        Cette page rassemble les briques d&apos;intelligence <b>transverses</b> — celles qui ne concernent pas
        un dossier en particulier mais le marché. Les briques liées à un audit sont intégrées directement dans
        les écrans concernés (onboarding, analyse documentaire, cockpit, rapport).
      </Note>

      <section className="intel-hero">
        <IaBlock>
          <CardHead>
            <h2>Cluster d&apos;entreprises comparables</h2>
            <IaTag phase={0}>Clustering</IaTag>
          </CardHead>
          <p className="small muted">
            K-means sur données SIRENE / Pappers publiques : effectif, CA, code NAF, ancienneté, zone géographique.
            C&apos;est ce cluster qui alimente le graphique comparatif du rapport client.
          </p>

          <Scatter graine={`${secteur}-${cle}`} />

          <div className="row wrap gap-l mt">
            <div>
              <span className="lbl">Entreprises dans le cluster</span>
              <NombreCluster valeur={d.n} key={`n-${secteur}-${cle}`} />
            </div>
            <div><span className="lbl">Médiane du coût horaire</span><div className="big">{d.med}</div></div>
            <div><span className="lbl">Position du client audité</span><div className="big">{d.pos}</div></div>
          </div>

          <IaSrc>source : SIRENE + Pappers · 1 842 établissements · dernière exécution 12/08/2026</IaSrc>
        </IaBlock>

        <div className="col gap-l">
          <IaBlock>
            <CardHead><h3>Risque de défaillance</h3><IaTag phase={0}>Z-score</IaTag></CardHead>
            <div className="row-between" style={{ alignItems: "flex-end" }}>
              <div>
                <div className="big">{d.z}</div>
                <span className="hint">score Altman calibré secteur</span>
              </div>
              <Badge tone={tonZ(d.zl)}>{d.zl}</Badge>
            </div>
            <IaOut className="mt">
              Modèle académique réutilisé et calibré sur données macro publiques —
              <b> signal indicatif</b>, à interpréter par le consultant, jamais affiché brut au client.
            </IaOut>
            <IaConf value={0.72} className="mt-s" />
          </IaBlock>

          <IaBlock>
            <CardHead><h3>BFR de référence sectoriel</h3><IaTag phase={0}>Série temporelle</IaTag></CardHead>
            <div className="row-between" style={{ alignItems: "flex-end" }}>
              <div>
                <div className="big">{d.bfr}</div>
                <span className="hint">jours de chiffre d&apos;affaires</span>
              </div>
              <Badge tone="sky">{d.trend}</Badge>
            </div>
            <IaSrc>source : statistiques macro-sectorielles publiques (INSEE)</IaSrc>
          </IaBlock>
        </div>
      </section>

      <section className="grid g-2 mt">
        <IaBlock>
          <CardHead>
            <h2>Prix des matières premières</h2>
            <IaTag phase={0}>Prévision de tendance</IaTag>
          </CardHead>
          <p className="small muted">
            Séries temporelles sur indices INSEE / BTP publics. Sert à nuancer un écart de marge :
            une érosion de marge peut venir du prix des matériaux, pas de la facturation.
          </p>
          <div className="spark-list">
            {d.mat.map(([nom, valeur, sens], i) => (
              <div className="spark-row" key={nom}>
                <span>{nom}</span>
                <Sparkline graine={0.6 + i * 0.5} />
                <span className={`spark-val ${sens}`}>{valeur}</span>
              </div>
            ))}
          </div>
          <IaSrc>
            source : indices publics · projection à 6 mois, intervalle de confiance non affiché au client
          </IaSrc>
        </IaBlock>

        <IaBlock>
          <CardHead>
            <h2>Veille réglementaire &amp; fiscale</h2>
            <IaTag phase={0}>Agent RAG</IaTag>
          </CardHead>
          <p className="small muted">
            RAG sur textes légaux et conventions collectives. Les alertes remontent automatiquement
            dans le cockpit du dossier concerné.
          </p>
          <ul className="veille">
            {d.veille.map(([titre, texte, classeBadge]) => (
              <li key={titre}>
                <div className="row-between" style={{ gap: 10 }}>
                  <b>{titre}</b>
                  <span className={`badge ${classeBadge}`}>alerte</span>
                </div>
                <span>{texte}</span>
              </li>
            ))}
          </ul>
          <IaSrc>
            base indexée : Loi LME, conventions collectives BTP, bulletins fiscaux · 12/08/2026
          </IaSrc>
        </IaBlock>
      </section>

      <IaBlock className="mt">
        <CardHead>
          <h2>Benchmark enrichi par les dossiers traités</h2>
          <IaTag phase={1}>Benchmarking sectoriel</IaTag>
          <IaTag phase={1}>Synthèse comparative</IaTag>
        </CardHead>
        <p className="small muted">
          La base vectorielle démarre avec des données publiques (CAPEB, FFB, INSEE) puis s&apos;enrichit
          des devis <b>anonymisés</b> déjà traités — c&apos;est la contrepartie de la séparation
          nominatif / anonyme du modèle de données.
        </p>

        <div className="fill">
          <div className="fill-bar"><i style={{ width: "22%" }} /></div>
          <div className="row-between">
            <span className="hint">8 dossiers anonymisés indexés</span>
            <span className="hint">seuil de fiabilité statistique : ~35 dossiers</span>
          </div>
        </div>

        <IaOut className="mt">
          <b>Synthèse générée :</b> sur les 4 dossiers BTP traités, l&apos;écart de facturation de la
          main-d&apos;œuvre est systématiquement le premier poste de fuite (62 % du score moyen), loin
          devant le risque BFR.
          <IaSrc>généré à la demande · RAG sur la documentation métier interne + dossiers anonymisés</IaSrc>
        </IaOut>

        <button
          className="btn btn-ghost btn-s mt" type="button"
          onClick={() => toast("Synthèse comparative régénérée à partir des 8 dossiers anonymisés indexés.", "gold")}
        >
          Régénérer la synthèse
        </button>
      </IaBlock>
    </PageShell>
  );
}
