"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IA_MAP } from "@/data/al";
import { COPI_ACTIONS, COPI_QA } from "@/data/copilote";
import { useUser } from "@/context/UserContext";
import { useUi } from "@/context/UiContext";
import Html from "@/components/ui/Html";
import Badge from "@/components/ui/Badge";
import Tabs, { TabPanel } from "@/components/ui/Tabs";
import { IaPhase } from "@/components/ui/Ia";
import { Spinner } from "@/components/ui/Misc";

const MSG_ACCUEIL = {
  id: 0,
  type: "ia",
  html: `Je réponds à partir du dossier ouvert et de la base de connaissance métier Alumny —
    et je peux aussi <b>agir à ta place</b> : générer un rapport, créer un dossier, relancer un client, recalculer un audit.
    <span class="msg-src">RAG · dossier D-2026-041 + base métier</span>`
};

/* Tiroir Copilote — disponible sur toutes les pages de l'application. */
export default function Copilote() {
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState("chat");
  const [messages, setMessages] = useState([MSG_ACCUEIL]);
  const [saisie, setSaisie] = useState("");
  const corps = useRef(null);
  const seq = useRef(1);
  const timers = useRef([]);
  const { user } = useUser();
  const { toast } = useUi();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const differer = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  /* Le fil suit toujours le dernier message. */
  useEffect(() => {
    const el = corps.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, onglet, ouvert]);

  const ajouter = msg => {
    const id = ++seq.current;
    setMessages(list => [...list, { ...msg, id }]);
    return id;
  };
  const majMessage = (id, patch) =>
    setMessages(list => list.map(m => (m.id === id ? { ...m, ...patch } : m)));

  /* ---------- Réponse sourcée ---------- */
  const repondre = useCallback((q, r, s) => {
    ajouter({ type: "me", text: q });
    const id = ajouter({ type: "ia-load" });
    differer(() => majMessage(id, { type: "ia", html: `${r}<span class="msg-src">${s}</span>` }), 900);
  }, []);

  /* ---------- Exécution d'une action ---------- */
  const executer = useCallback(action => {
    ajouter({ type: "me", text: action.nom });
    const id = ajouter({ type: "run", action, etape: 0, fini: false });

    const avancer = i => {
      if (i >= action.etapes.length) {
        majMessage(id, { etape: i, fini: true });
        toast(`Copilote : ${action.nom.toLowerCase()} — terminé.`, "ok");
        return;
      }
      majMessage(id, { etape: i });
      differer(() => avancer(i + 1), 750);
    };
    differer(() => avancer(0), 60);
  }, [toast]);

  /* ---------- Envoi libre : intention d'action, puis question sourcée ---------- */
  const envoyer = () => {
    const txt = saisie.trim();
    if (!txt) return;
    setSaisie("");
    const t = txt.toLowerCase();

    const intention = COPI_ACTIONS.find(a => a.motifs.test(t));
    if (intention) { executer(intention); return; }

    const qa = COPI_QA.find(x =>
      t.split(/\s+/).filter(w => w.length > 4).some(w => x.q.toLowerCase().includes(w)));
    if (qa) { repondre(txt, qa.r, qa.s); return; }

    repondre(
      txt,
      "Je n'ai pas d'élément sourcé pour répondre précisément — plutôt que d'avancer une valeur, je préfère te signaler l'absence de source dans la base indexée. Je peux en revanche exécuter une action : générer un rapport, créer un dossier, relancer un client ou recalculer l'audit.",
      "aucune source pertinente · réponse null assumée"
    );
  };

  const fermer = () => { setOuvert(false); document.body.style.overflow = ""; };

  return (
    <>
      <button
        className="copi-btn"
        type="button"
        onClick={() => {
          setOuvert(true);
          if (window.matchMedia("(max-width: 700px)").matches) document.body.style.overflow = "hidden";
        }}
      >
        <span className="copi-mark">◈</span> <span>Copilote Alumny</span>
      </button>

      <aside className={"copi" + (ouvert ? " is-open" : "")} id="copi" aria-hidden={!ouvert}>
        <div className="copi-head">
          <p className="hand">assistant interne, jamais exposé au client</p>
          <div className="row">
            <h3 className="grow">Copilote Alumny</h3>
            <button className="btn btn-icon" type="button" title="Fermer" onClick={fermer}>✕</button>
          </div>
        </div>

        <div className="copi-body" ref={corps}>
          <Tabs
            items={[{ id: "chat", label: "Conversation" }, { id: "map", label: "Où l'IA agit" }]}
            value={onglet}
            onChange={setOnglet}
          />

          <TabPanel active={onglet === "chat"}>
            <div id="copi-msgs">
              {messages.map(m => <Message key={m.id} msg={m} user={user} onUndo={() =>
                toast("Action annulée — l'état précédent du dossier est restauré.")} />)}
            </div>

            <div className="do-block">
              <div className="row-between">
                <span className="do-title">Faire à ma place</span>
                <Badge tone="gold">agent d&apos;action</Badge>
              </div>
              <p className="hint" style={{ margin: "4px 0 10px" }}>
                Le Copilote exécute la manipulation et te rend la main :
                rien n&apos;est envoyé au client ni remis sans ta validation.
              </p>
              <div className="do-list">
                {COPI_ACTIONS.map(a => (
                  <button key={a.id} className="do-item" type="button" onClick={() => executer(a)}>
                    <span className="do-ico">{a.ico}</span>
                    <span className="grow"><b>{a.nom}</b><span>{a.quoi}</span></span>
                    <span className="do-go">→</span>
                  </button>
                ))}
              </div>
            </div>

            <span className="lbl">Ou simplement poser une question</span>
            <div className="sugg mt-s">
              {COPI_QA.map(x => (
                <button key={x.q} type="button" onClick={() => repondre(x.q, x.r, x.s)}>{x.q}</button>
              ))}
            </div>
          </TabPanel>

          <TabPanel active={onglet === "map"}>
            <p className="small muted">
              Chaque brique IA est intégrée à l&apos;écran qu&apos;elle sert. Le niveau indique sa{" "}
              <b>faisabilité</b> : <IaPhase phase={0} /> dès le lancement,{" "}
              <IaPhase phase={1} /> avec un premier volume de documents,{" "}
              <IaPhase phase={2} /> avec un historique Alumny.
            </p>
            <div className="ia-map mt">
              {IA_MAP.map(g => (
                <Fragment key={g.g}>
                  <div className="ia-map-g">{g.g}</div>
                  {g.items.map(([nom, d, p]) => (
                    <Link key={nom} href={g.href} onClick={fermer}>
                      <IaPhase phase={p} />
                      <span><b>{nom}</b><span>{d}</span></span>
                    </Link>
                  ))}
                </Fragment>
              ))}
            </div>
          </TabPanel>
        </div>

        <div className="copi-foot">
          <div className="row gap-s">
            <input
              type="text"
              placeholder="Demander une réponse ou une action…"
              value={saisie}
              onChange={e => setSaisie(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") envoyer(); }}
            />
            <button className="btn btn-gold btn-s" type="button" onClick={envoyer}>Envoyer</button>
          </div>
          <p className="hint mt-s">
            Réponses sourcées, actions journalisées. Aucune donnée nominative n&apos;est envoyée à un service tiers.
          </p>
        </div>
      </aside>
    </>
  );
}

/* ---------- Un message du fil ---------- */
function Message({ msg, user, onUndo }) {
  if (msg.type === "me") return <div className="msg msg-me">{msg.text}</div>;

  if (msg.type === "ia-load") {
    return <div className="msg msg-ia"><Spinner /> recherche dans la base…</div>;
  }

  if (msg.type === "ia") return <Html as="div" className="msg msg-ia" html={msg.html} />;

  /* Exécution d'une action : étapes qui basculent une à une */
  const { action, etape, fini } = msg;
  return (
    <div className={"msg msg-ia" + (fini ? "" : " run")}>
      <b>{action.nom}</b>
      <span className="run-quoi">{action.quoi}</span>
      <ol className="run-steps">
        {action.etapes.map((e, i) => (
          <li key={e} className={i < etape ? "ok" : i === etape && !fini ? "on" : ""}>{e}</li>
        ))}
      </ol>
      {fini && (
        <>
          <Html as="div" className="run-done" html={action.fait} />
          <div className="row gap-s mt-s wrap">
            {action.lien && (
              <Link className="btn btn-s btn-gold" href={action.lien[1]}>{action.lien[0]}</Link>
            )}
            <button className="btn btn-ghost btn-s" type="button" onClick={onUndo}>Annuler l&apos;action</button>
          </div>
          <span className="msg-src">action journalisée · {user.nom} · via Copilote</span>
        </>
      )}
    </div>
  );
}
