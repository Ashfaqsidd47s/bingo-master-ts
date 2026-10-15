import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import ActiveUsers from "../components/ActiveUsers";
import SystemOverview from "../components/architecture/SystemOverview";
import { TierDiagram } from "../components/architecture/ModuleTiers";
import { BACKEND_TIERS, DB_TABLES, FRONTEND_TIERS } from "../components/architecture/moduleData";
import { BingoEngineDemo, GameMemory } from "../components/architecture/BingoEngine";
import FlowExplorer from "../components/architecture/SequenceFlow";
import { FileRef, GlowCard, KindDot, Pill, Section, SubHeading } from "../components/architecture/primitives";
import { C, FlowKind, KIND } from "../components/architecture/theme";

const NAV = [
  { id: "system", label: "L0 · System" },
  { id: "modules", label: "L1 · Modules" },
  { id: "engine", label: "L2 · Game server" },
  { id: "flows", label: "L3 · Flows" },
  { id: "protocol", label: "Protocol" },
  { id: "start", label: "Start here" },
];

const CLIENT_TO_SERVER = [
  { type: "join_game", payload: "—", from: "pages/Searching.tsx", effect: "Wait in the seat, or start a game with whoever is in it." },
  { type: "cancle_number", payload: "{ number: string }", from: "pages/Game.tsx", effect: "Call a number on your turn." },
  { type: "send_emoji", payload: "{ text }", from: "pages/Game.tsx", effect: "Relayed to the opponent as emoji." },
  { type: "send_message", payload: "{ text }", from: "pages/Game.tsx", effect: "Relayed to the opponent as normal." },
  { type: "surrender", payload: "—", from: "(no UI yet)", effect: "Opponent receives winner, game removed." },
];

const SERVER_TO_CLIENT: { type: string; when: string; handled: string; kind: FlowKind }[] = [
  { type: "user_count", when: "any socket connects or closes (to everyone)", handled: "ActiveUsers.tsx", kind: "ws" },
  { type: "waiting", when: "you took the empty seat", handled: "Searching.tsx", kind: "ws" },
  { type: "game_started", when: "match created, re-join, or reconnect", handled: "Searching.tsx · Game.tsx", kind: "ws" },
  { type: "caceled", when: "a number was called (to both players)", handled: "Game.tsx", kind: "ws" },
  { type: "winner / looser", when: "5 lines, surrender, or 60 s forfeit", handled: "Game.tsx", kind: "ws" },
  { type: "emoji / normal", when: "opponent sent emoji / message", handled: "Game.tsx (emoji only)", kind: "ws" },
  { type: "offline / online", when: "opponent disconnected / came back", handled: "Game.tsx", kind: "ws" },
  { type: "error / errer", when: "guard rejected the request", handled: "logged only", kind: "blocked" },
];

const HTTP_ROUTES = [
  { route: "GET /auth/google", auth: "public", note: "Start Google OAuth" },
  { route: "GET /auth/google/callback", auth: "public", note: "Find-or-create user, set token cookie, redirect to CLIENT_URL" },
  { route: "GET /auth/login", auth: "public", note: "Minimal fallback login page (redirect target of the JWT guard)" },
  { route: "GET /auth/logout", auth: "public", note: "Clears the token cookie" },
  { route: "GET /api/user/profile", auth: "JWT cookie", note: "Returns { user } from the token — used by verifyUser()" },
  { route: "GET /", auth: "JWT cookie", note: "Health check: { message: 'server working fine' }" },
];

const READING_ORDER = [
  { file: "server/src/index.ts", why: "Boot: Express middleware, routes, and the WebSocket connection handler." },
  { file: "server/src/User.ts", why: "Every client message is routed by the switch in intialHandeler()." },
  { file: "server/src/GameManager.ts", why: "Where games, users and the waiting seat live." },
  { file: "server/src/Game.ts", why: "Turn checks and the caceled / winner / looser messages." },
  { file: "frontend/src/App.tsx", why: "Routes, guards, and the two calls made on load." },
  { file: "frontend/src/store/gameSocketStore.ts", why: "The single socket every page subscribes to." },
  { file: "frontend/src/pages/Searching.tsx", why: "join_game → game_started → /game." },
  { file: "frontend/src/pages/Game.tsx", why: "Handles every in-game server message." },
];

const GOTCHAS = [
  { title: "Protocol spellings are load-bearing", body: <>cancle_number, caceled, errer, looser, oponent are the real message names on both sides. Rename them on server and client together, or not at all.</> },
  { title: "Games live only in memory", body: <>GameManager is a plain object in the Node process. A redeploy or crash on Render ends every running match; db.createGame / updateWinner exist but are not called yet.</> },
  { title: "Two socket layers exist — one is live", body: <>The app uses <code>store/gameSocketStore.ts</code>. <code>socket/GameSocket.ts</code> and <code>hooks/userGameSocket.ts</code> are an older, unused version pointing at localhost.</> },
  { title: "Side effect when db.ts is imported", body: <>db.ts calls updateWinner(…) with a hard-coded id at import time — a leftover debug line that runs a query on every server start.</> },
  { title: "Cookies must cross sites", body: <>The SPA (Vercel) and API (Render) are different sites, so the cookie is SameSite=None; Secure and every request uses credentials. CORS origin must match CLIENT_URL exactly.</> },
  { title: "The AI bot isn't really greedy yet", body: <>In lib/aimodels.ts the line counters start as <code>new Array(size)</code> (undefined), so the scores are NaN and the bot simply picks the first open cell.</> },
];

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {(Object.keys(KIND) as FlowKind[]).map((k) => (
        <span key={k} className="flex items-center gap-2 text-sm text-white/70">
          <KindDot kind={k} /> <b className="text-white/90 font-medium">{KIND[k].label}</b>
          <span className="text-white/40 hidden sm:inline">— {KIND[k].hint}</span>
        </span>
      ))}
    </div>
  );
}

function useActiveSection() {
  const [active, setActive] = useState(NAV[0].id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    NAV.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  return active;
}

export default function Architecture() {
  const reduce = useReducedMotion();
  const active = useActiveSection();

  return (
    <div className="min-h-[100svh] w-full bg-navy text-white overflow-x-hidden">
      {/* sticky level navigation */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <NavLink to="/" aria-label="Back to home" className="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 center"><ArrowLeft className="w-5 h-5" /></NavLink>
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] transition-colors ${active === n.id ? "bg-navyblue text-white" : "text-white/55 hover:text-white"}`}>
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* hero */}
      <div className="relative bg-radial-[at_35%_20%] from-navyblue/40 via-navy to-transparent">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: `linear-gradient(${C.navyblue} 1px, transparent 1px), linear-gradient(90deg, ${C.navyblue} 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <Pill color={C.navyblue}>Bingo Master</Pill>
            <ActiveUsers />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-5"
          >
            How Bingo Master<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${C.navyblue}, ${C.cyan} 60%, ${C.gold})` }}>works, end to end.</span>
          </motion.h1>
          <p className="text-white/60 text-lg max-w-2xl mb-8">
            A visual tour from the 10,000-ft view down to a single WebSocket frame. Read top to bottom: every level zooms into the one above it.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            {[
              ["L0", "The whole system", "Browser, server, database, Google."],
              ["L1", "Modules", "Frontend and backend, layer by layer."],
              ["L2", "Game server", "In-memory state and the rules engine."],
              ["L3", "Flows", "Animated, step-by-step message traces."],
            ].map(([lvl, t, d], i) => (
              <motion.a key={lvl} href={`#${NAV[i].id}`}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                className="group rounded-2xl border border-white/10 bg-charcoal/20 hover:border-navyblue/70 hover:bg-navyblue/10 transition-colors p-4">
                <span className="font-mono text-xs text-navyblue">{lvl}</span>
                <div className="font-semibold mt-1">{t}</div>
                <div className="text-sm text-white/50">{d}</div>
                {!reduce && i < 3 && <div className="hidden lg:block text-white/20 text-xs mt-2 group-hover:text-navyblue">↓ zooms into</div>}
              </motion.a>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="font-mono text-[11px] tracking-widest text-white/40 mb-3">HOW TO READ THE COLOURS</p>
            <Legend />
          </div>
        </div>
      </div>

      <Section id="system" level="Level 0 · The whole system" title="Four boxes and three wires"
        intro={<>The React app is served by Vercel and talks to a single Node process on Render over two channels: <b className="text-white/80">HTTPS</b> for login and profile, and one long-lived <b className="text-white/80">WebSocket</b> for everything in a game. Postgres stores users; Google proves who they are. <span className="text-white/80">Click any block.</span></>}>
        <SystemOverview />
      </Section>

      <Section id="modules" level="Level 1 · Major modules" title="Inside each side"
        intro="Both halves are drawn top-down in the order code actually runs: from the entry file to the wire.">
        <SubHeading index="1.1" title="Frontend · frontend/src">
          A Vite + React 19 SPA. Pages never open sockets or call fetch directly — they go through the Zustand stores.
        </SubHeading>
        <TierDiagram tiers={FRONTEND_TIERS} />

        <SubHeading index="1.2" title="Backend · server/src">
          One process, two lanes sharing port 8080. The HTTP lane only does identity; the WebSocket lane runs the game.
        </SubHeading>
        <TierDiagram tiers={BACKEND_TIERS} />

        <SubHeading index="1.3" title="Data · PostgreSQL">
          Three tables. Only users is written today; the game tables are ready for match history.
        </SubHeading>
        <div className="grid md:grid-cols-3 gap-4">
          {DB_TABLES.map((t) => (
            <GlowCard key={t.name} accent={C.gold} className="h-full">
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-semibold text-white">{t.name}</span>
                  {t.status === "live" ? <Pill color={C.green}>written today</Pill> : <Pill color={C.red}>not wired yet</Pill>}
                </div>
                <div className="rounded-lg border border-white/10 overflow-hidden mb-3">
                  {t.cols.map((c) => <div key={c} className="px-3 py-1.5 font-mono text-[12px] text-white/75 border-b border-white/5 last:border-0">{c}</div>)}
                </div>
                <p className="text-sm text-white/55 mt-auto">{t.note}</p>
              </div>
            </GlowCard>
          ))}
        </div>
      </Section>

      <Section id="engine" level="Level 2 · The game server" title="Where a match actually lives"
        intro="No Redis, no game rows: a running match is three in-memory structures plus one bingo-master instance.">
        <SubHeading index="2.1" title="GameManager memory" />
        <GameMemory />
        <SubHeading index="2.2" title="The rule that makes it strategic">
          Each player has a different board, but there is only <b className="text-white/80">one</b> set of called numbers. Every call strikes the same number on both boards — so you're always helping (or hurting) your opponent too. Watch two greedy players, including the two guards that reject bad moves.
        </SubHeading>
        <BingoEngineDemo />
      </Section>

      <Section id="flows" level="Level 3 · Flows" title="Follow a message"
        intro="Each flow is an animated sequence diagram. Columns are the actors, rows are messages in time order. They're ordered like a real session: sign in → connect → match → play → finish → reconnect.">
        <FlowExplorer />
      </Section>

      <Section id="protocol" level="Reference" title="The wire protocol"
        intro={<>Every WebSocket frame is JSON shaped like <code className="text-white/80">{"{ type, payload }"}</code>. Types live in <FileRef path="server/src/Types.ts" /> and <FileRef path="frontend/src/Types.ts" />.</>}>
        <div className="grid lg:grid-cols-2 gap-5">
          <GlowCard accent={C.ws}>
            <div className="p-4 md:p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2"><KindDot kind="ws" /> Client → server</h4>
              <div className="flex flex-col divide-y divide-white/5">
                {CLIENT_TO_SERVER.map((m) => (
                  <div key={m.type} className="py-2.5 grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] gap-3 text-sm">
                    <code className="font-mono text-[#b5bbff] break-words">{m.type}</code>
                    <div>
                      <div className="text-white/75">{m.effect}</div>
                      <div className="text-[11px] font-mono text-white/40 mt-0.5">payload {m.payload} · {m.from}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
          <GlowCard accent={C.ws}>
            <div className="p-4 md:p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2"><KindDot kind="ws" /> Server → client</h4>
              <div className="flex flex-col divide-y divide-white/5">
                {SERVER_TO_CLIENT.map((m) => (
                  <div key={m.type} className="py-2.5 grid grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] gap-3 text-sm">
                    <code className="font-mono break-words" style={{ color: m.kind === "blocked" ? C.red : "#b5bbff" }}>{m.type}</code>
                    <div>
                      <div className="text-white/75">{m.when}</div>
                      <div className="text-[11px] font-mono text-white/40 mt-0.5">handled in {m.handled}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
          <GlowCard accent={C.sky} className="lg:col-span-2">
            <div className="p-4 md:p-5">
              <h4 className="font-semibold mb-3 flex items-center gap-2"><KindDot kind="http" /> HTTP routes</h4>
              <div className="grid md:grid-cols-2 gap-x-8 divide-y divide-white/5 md:divide-y-0">
                {HTTP_ROUTES.map((r) => (
                  <div key={r.route} className="py-2.5 md:border-b md:border-white/5 flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono text-[#8cc6ff]">{r.route}</code>
                      <Pill color={r.auth === "public" ? C.green : C.gold}>{r.auth}</Pill>
                    </div>
                    <div className="text-white/60">{r.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
        </div>
      </Section>

      <Section id="start" level="New here?" title="Start here"
        intro="Read the code in this order, then keep these in mind before changing anything.">
        <div className="grid lg:grid-cols-2 gap-6">
          <ol className="relative flex flex-col gap-3">
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-navyblue via-navyblue/40 to-transparent" />
            {READING_ORDER.map((r, i) => (
              <motion.li key={r.file} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="relative flex gap-3 items-start">
                <span className="relative z-10 shrink-0 w-8 h-8 rounded-full bg-navy border border-navyblue center text-xs font-mono">{i + 1}</span>
                <div className="pt-1">
                  <FileRef path={r.file} />
                  <p className="text-sm text-white/60 mt-1">{r.why}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <div className="flex flex-col gap-3">
            {GOTCHAS.map((g) => (
              <div key={g.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="font-semibold text-white mb-1 flex items-center gap-2"><span style={{ color: C.gold }}>!</span>{g.title}</div>
                <p className="text-sm text-white/60 leading-relaxed">{g.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div>
            <div className="font-semibold">Run it locally</div>
            <p className="text-sm text-white/55">Copy <code>server/.env.sample</code> to <code>.env</code>, then start both halves. Set <code>VITE_API_BASE_URL</code> for local API calls; the socket URL is hard-coded in <code>gameSocketStore.ts</code>, so point it at <code>ws://localhost:8080</code> too.</p>
          </div>
          <pre className="font-mono text-[12px] text-white/80 bg-black/40 rounded-lg p-3 overflow-x-auto">{`cd server && npm i && npm run dev   # :8080
cd frontend && npm i && npm run dev # :5173`}</pre>
        </div>
      </Section>

      <footer className="text-center text-xs text-white/30 pb-10">
        Diagrams are data-driven — edit <code>components/architecture/flows.ts</code> and <code>moduleData.tsx</code> when the code changes.
      </footer>
    </div>
  );
}
