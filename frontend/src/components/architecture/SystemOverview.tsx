import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { C, FlowKind, KIND } from "./theme";
import { FileRef, GlowCard } from "./primitives";

// ---- isometric projection -------------------------------------------------
// Ground plane is (X, Y), Z is height. Larger X+Y is closer to the viewer.
const W = 1200;
const H = 740;
const S = 46;
const OX = 600;
const OY = 150;
type Pt = [number, number];
const p = (X: number, Y: number, Z = 0): Pt => [OX + (X - Y) * 0.866 * S, OY + (X + Y) * 0.5 * S - Z * S];
const poly = (a: Pt[]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const pct = ([x, y]: Pt) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

type NodeId = "vercel" | "browser" | "express" | "ws" | "gm" | "engine" | "db" | "google";

const NODES: Record<NodeId, { title: string; sub: string; accent: string; files: string[]; body: string }> = {
  vercel: {
    title: "Vercel",
    sub: "static host",
    accent: "#8A8CC4",
    files: ["frontend/vercel.json", "frontend/vite.config.ts"],
    body: "Serves the Vite build of the React app. vercel.json rewrites every path to index.html, so client routes like /game or /architecture survive a page refresh.",
  },
  browser: {
    title: "Browser · React SPA",
    sub: "React 19 · Router 7 · Zustand",
    accent: C.sky,
    files: ["frontend/src/App.tsx", "frontend/src/store/gameSocketStore.ts", "frontend/src/lib/axiosInstance.ts"],
    body: "On first render App.tsx fires two things: verifyUser() over HTTPS (who am I?) and connect() which opens the single WebSocket. Every game event after that arrives on the socket. User and game state are persisted in localStorage.",
  },
  express: {
    title: "Express · HTTP layer",
    sub: "auth + profile",
    accent: C.sky,
    files: ["server/src/index.ts", "server/src/routes/auth.ts", "server/src/routes/user.ts"],
    body: "Handles Google login, sets the JWT cookie, and serves /api/user/profile. /auth/* is public; everything registered after it goes through the authenticateJWT middleware.",
  },
  ws: {
    title: "WebSocketServer · ws",
    sub: "same port as Express",
    accent: C.ws,
    files: ["server/src/index.ts", "server/src/User.ts"],
    body: "new WebSocketServer({ server }) piggybacks on the Express http.Server, so HTTP and WS share :8080. Each connection is authenticated from the token cookie, wrapped in a User, and the live user_count is broadcast to everyone.",
  },
  gm: {
    title: "GameManager · in memory",
    sub: "singleton",
    accent: C.navyblue,
    files: ["server/src/GameManager.ts", "server/src/Game.ts"],
    body: "Holds games: Map<gameId, Game>, users: Map<userId, User> and one waiting slot used for matchmaking. Nothing here is persisted — a server restart drops running games.",
  },
  engine: {
    title: "bingo-master",
    sub: "rules engine (npm)",
    accent: C.gold,
    files: ["npm: bingo-master", "server/src/Game.ts", "frontend/src/pages/AiBattle.tsx"],
    body: "Owns the rules: two random 5×5 boards, ONE shared set of called numbers, turn = called.size % 2, first to 5 completed lines wins. The same package runs in the browser for the AI battle and the Home board preview.",
  },
  db: {
    title: "PostgreSQL",
    sub: "users · games · game_players",
    accent: C.gold,
    files: ["server/src/db/db.ts"],
    body: "Accessed through a pg Pool (POSTGRES_URL). Today only users is written — on first Google login. createGame() / updateWinner() exist for match history but are not called yet.",
  },
  google: {
    title: "Google OAuth 2.0",
    sub: "passport strategy",
    accent: C.cyan,
    files: ["server/src/routes/auth.ts"],
    body: "passport-google-oauth20 exchanges the callback code for the user's profile + email. The server then finds-or-creates the user row and signs a JWT.",
  },
};

// ---- geometry -------------------------------------------------------------
type Box = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };
const BOXES: Partial<Record<NodeId, Box>> = {
  vercel: { x0: -5, x1: -2.6, y0: 4.8, y1: 7.2, z0: 0, z1: 0.9 },
  browser: { x0: -0.6, x1: 2.2, y0: 4.6, y1: 7.4, z0: 0, z1: 2.1 },
  express: { x0: 7, x1: 10, y0: 4.5, y1: 7.5, z0: 0, z1: 0.85 },
  ws: { x0: 7, x1: 10, y0: 4.5, y1: 7.5, z0: 1.05, z1: 1.9 },
  gm: { x0: 7, x1: 10, y0: 4.5, y1: 7.5, z0: 2.1, z1: 2.95 },
  engine: { x0: 7.7, x1: 9.3, y0: 5.2, y1: 6.8, z0: 3.15, z1: 3.65 },
  google: { x0: 14.5, x1: 16.5, y0: 5, y1: 7, z0: 0, z1: 1.2 },
};
const DB = { cx: 8.5, cy: -2.2, r: 1.3, z1: 2.3 };

type Beam = { id: string; kind: FlowKind; from: Pt; to: Pt; label: string; both?: boolean; angle: number; dy?: number; t?: number };
const BEAMS: Beam[] = [
  { id: "b-vercel", kind: "http", from: p(-2.6, 6, 0.45), to: p(-0.6, 6, 0.45), label: "JS bundle", angle: 30 },
  { id: "b-https", kind: "http", from: p(2.2, 6, 0.4), to: p(7, 6, 0.4), label: "HTTPS  login · profile", both: true, angle: 30, dy: 24, t: 0.3 },
  { id: "b-wss", kind: "ws", from: p(2.2, 6, 1.5), to: p(7, 6, 1.5), label: "WSS  game events", both: true, angle: 30, t: 0.42 },
  { id: "b-sql", kind: "sql", from: p(8.5, 4.5, 0.45), to: p(8.5, DB.cy + DB.r, 0.45), label: "SQL  pg Pool", both: true, angle: -30 },
  { id: "b-oauth", kind: "oauth", from: p(10, 6, 0.45), to: p(14.5, 6, 0.45), label: "OAuth 2.0 code → profile", both: true, angle: 30 },
];

function IsoBox({ box, accent, active, onSelect, label }: {
  box: Box; accent: string; active: boolean; onSelect: () => void; label: string;
}) {
  const { x0, x1, y0, y1, z0, z1 } = box;
  const top = [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)];
  const right = [p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)];
  const left = [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)];
  const stroke = active ? accent : `${accent}99`;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      className="cursor-pointer outline-none"
      style={{ filter: active ? `drop-shadow(0 0 14px ${accent})` : undefined }}
    >
      <polygon points={poly(left)} fill="#1a1630" stroke={stroke} strokeWidth={1.2} />
      <polygon points={poly(right)} fill="#110e20" stroke={stroke} strokeWidth={1.2} />
      <polygon points={poly(top)} fill={`${accent}${active ? "55" : "2a"}`} stroke={stroke} strokeWidth={1.4} />
      {/* panel "rack lines" on the front faces, like the server tower in the reference */}
      {[0.3, 0.55, 0.8].map((t) => {
        const z = z0 + (z1 - z0) * 0.5;
        const a = p(x1, y0 + (y1 - y0) * t, z);
        const b = p(x1, y0 + (y1 - y0) * (t + 0.12), z);
        return <line key={t} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={`${accent}aa`} strokeWidth={2} />;
      })}
    </g>
  );
}

function Cylinder({ active, onSelect }: { active: boolean; onSelect: () => void }) {
  const rx = DB.r * S * 1.2247;
  const ry = DB.r * S * 0.7071;
  const disks = [0, 0.8, 1.6];
  const accent = NODES.db.accent;
  return (
    <g role="button" tabIndex={0} aria-label="PostgreSQL" onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      className="cursor-pointer outline-none" style={{ filter: active ? `drop-shadow(0 0 14px ${accent})` : undefined }}>
      {disks.map((z) => {
        const [bx, by] = p(DB.cx, DB.cy, z);
        const [tx, ty] = p(DB.cx, DB.cy, z + 0.65);
        return (
          <g key={z}>
            <path d={`M${bx - rx},${ty} L${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx + rx},${by} L${bx + rx},${ty}`} fill="#15111f" stroke={`${accent}${active ? "ff" : "99"}`} strokeWidth={1.3} />
            <ellipse cx={tx} cy={ty} rx={rx} ry={ry} fill={`${accent}${active ? "44" : "22"}`} stroke={`${accent}${active ? "ff" : "99"}`} strokeWidth={1.3} />
            <line x1={bx + rx * 0.35} y1={by + ry * 0.55} x2={bx + rx * 0.65} y2={by + ry * 0.35} stroke={accent} strokeWidth={2} opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
}

function BeamPath({ beam, reduce }: { beam: Beam; reduce: boolean | null }) {
  const color = KIND[beam.kind].color;
  const d = `M${beam.from[0]},${beam.from[1]} L${beam.to[0]},${beam.to[1]}`;
  const t = beam.t ?? 0.5;
  const mid: Pt = [beam.from[0] + (beam.to[0] - beam.from[0]) * t, beam.from[1] + (beam.to[1] - beam.from[1]) * t];
  const dur = beam.id === "b-vercel" ? 1.4 : 2.4;
  return (
    <g>
      <path d={d} stroke={color} strokeWidth={16} opacity={0.12} strokeLinecap="round" filter="url(#arch-blur)" />
      <path d={d} stroke={color} strokeWidth={6} opacity={0.18} strokeLinecap="round" />
      <path d={d} stroke={color} strokeWidth={1.6} opacity={0.9} strokeLinecap="round" />
      {!reduce && (
        <>
          <path d={d} stroke="#fff" strokeWidth={2.4} strokeDasharray="26 220" strokeLinecap="round" opacity={0.9}>
            <animate attributeName="stroke-dashoffset" from="246" to="0" dur={`${dur}s`} repeatCount="indefinite" />
          </path>
          <circle r={4.5} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} />
          </circle>
          {beam.both && (
            <circle r={3.5} fill="#fff" opacity={0.85}>
              <animateMotion dur={`${dur * 1.3}s`} repeatCount="indefinite" path={d} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
            </circle>
          )}
        </>
      )}
      <text
        x={mid[0]} y={mid[1]} dy={beam.dy ?? -14}
        transform={`rotate(${beam.angle} ${mid[0]} ${mid[1]})`}
        textAnchor="middle" fill={color} fontSize={13} fontFamily="ui-monospace, monospace" letterSpacing={1}
      >
        {beam.label}
      </text>
    </g>
  );
}

// A red spur off the WSS beam: requests the engine rejects never reach game state.
const BRANCH_FROM = p(6.1, 6, 1.5);
const BRANCH_TO = p(6.1, 8.7, 1.5);
function BlockedBranch({ reduce }: { reduce: boolean | null }) {
  const d = `M${BRANCH_FROM[0]},${BRANCH_FROM[1]} L${BRANCH_TO[0]},${BRANCH_TO[1]}`;
  const [x, y] = BRANCH_TO;
  return (
    <g>
      <path d={d} stroke={C.red} strokeWidth={10} opacity={0.12} strokeLinecap="round" />
      <path d={d} stroke={C.red} strokeWidth={1.6} strokeDasharray="6 5" />
      {!reduce && (
        <circle r={3.5} fill={C.red} style={{ filter: `drop-shadow(0 0 6px ${C.red})` }}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={d} />
        </circle>
      )}
      <g stroke={C.red} strokeWidth={2.4} strokeLinecap="round">
        <line x1={x - 7} y1={y - 7} x2={x + 7} y2={y + 7} />
        <line x1={x + 7} y1={y - 7} x2={x - 7} y2={y + 7} />
      </g>
    </g>
  );
}

function IsoGrid() {
  const lines = [];
  for (let i = -6; i <= 18; i += 1) {
    const a = p(i, -5), b = p(i, 13);
    const c = p(-6, i - 1), d = p(18, i - 1);
    lines.push(<line key={`x${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
    lines.push(<line key={`y${i}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />);
  }
  return <g stroke={C.navyblue} strokeWidth={0.6} opacity={0.13}>{lines}</g>;
}

const LABEL_AT: Record<NodeId, Pt> = {
  vercel: p(-3.8, 6, 2.2),
  browser: p(0.8, 6, 3.6),
  engine: [556, 478],
  gm: [556, 524],
  ws: [556, 570],
  express: [556, 616],
  db: p(DB.cx, DB.cy, 4.05),
  google: p(15.5, 6, 2.6),
};

export default function SystemOverview() {
  const [selected, setSelected] = useState<NodeId>("ws");
  const reduce = useReducedMotion();
  const node = NODES[selected];
  const select = (id: NodeId) => () => setSelected(id);
  const order: NodeId[] = ["express", "ws", "gm", "engine"];

  // The diagram is authored on a fixed W×H stage and scaled as one unit,
  // so SVG geometry and the HTML labels on top of it always stay aligned.
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <div className="relative -mx-4 md:mx-0 overflow-x-auto scrollbar-hide">
        <div ref={stageRef} className="relative min-w-[880px] aspect-[1200/740] rounded-3xl border border-white/5 bg-[radial-gradient(circle_at_50%_55%,#3d49eb26,transparent_60%)] overflow-hidden">
          <div className="absolute top-0 left-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="absolute inset-0" fill="none">
            <defs>
              <filter id="arch-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
            </defs>
            <IsoGrid />
            <Cylinder active={selected === "db"} onSelect={select("db")} />
            <BeamPath beam={BEAMS[3]} reduce={reduce} />
            <IsoBox box={BOXES.vercel!} accent={NODES.vercel.accent} active={selected === "vercel"} onSelect={select("vercel")} label="Vercel" />
            <BeamPath beam={BEAMS[0]} reduce={reduce} />
            <IsoBox box={BOXES.browser!} accent={NODES.browser.accent} active={selected === "browser"} onSelect={select("browser")} label="Browser" />
            <BeamPath beam={BEAMS[1]} reduce={reduce} />
            <BeamPath beam={BEAMS[2]} reduce={reduce} />
            <BlockedBranch reduce={reduce} />
            {order.map((id) => (
              <IsoBox key={id} box={BOXES[id]!} accent={NODES[id].accent} active={selected === id} onSelect={select(id)} label={NODES[id].title} />
            ))}
            {/* leader lines from the tower slabs to their labels */}
            {order.map((id) => {
              const b = BOXES[id]!;
              const from = p(b.x0 + 0.5, b.y1, (b.z0 + b.z1) / 2);
              const to = LABEL_AT[id];
              return (
                <g key={id} stroke={`${NODES[id].accent}99`}>
                  <path d={`M${from[0]},${from[1]} L${to[0] + 4},${to[1]}`} strokeDasharray="3 4" />
                  <circle cx={from[0]} cy={from[1]} r={2.5} fill={NODES[id].accent} />
                </g>
              );
            })}
            <BeamPath beam={BEAMS[4]} reduce={reduce} />
            <IsoBox box={BOXES.google!} accent={NODES.google.accent} active={selected === "google"} onSelect={select("google")} label="Google OAuth" />
          </svg>

          {/* HTML overlays: node labels */}
          {(Object.keys(LABEL_AT) as NodeId[]).map((id) => {
            const isTower = order.includes(id);
            return (
              <button
                key={id}
                onClick={select(id)}
                className={`absolute -translate-y-1/2 ${isTower ? "-translate-x-full" : "-translate-x-1/2"} text-left px-2.5 py-1 rounded-lg border backdrop-blur-sm transition-colors cursor-pointer whitespace-nowrap`}
                style={{
                  ...pct(LABEL_AT[id]),
                  borderColor: selected === id ? NODES[id].accent : "#ffffff1a",
                  background: selected === id ? `${NODES[id].accent}26` : "#0c0813cc",
                }}
              >
                <span className="block text-[12px] font-semibold text-white leading-tight">{NODES[id].title}</span>
                <span className="block text-[10px] text-white/50 font-mono leading-tight">{NODES[id].sub}</span>
              </button>
            );
          })}

          <div className="absolute text-[10px] font-mono tracking-[0.25em] text-white/40" style={pct(p(8.5, 6, 5.1))}>
            <span className="-translate-x-1/2 inline-block">RENDER · NODE :8080</span>
          </div>

          {/* floating payload panels */}
          <motion.div
            className="absolute w-[230px]"
            style={{ left: "44%", top: "3%" }}
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <div className="rounded-xl border border-[#6F7BFF66] bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-white/80 shadow-[0_0_30px_-10px_#6F7BFF]">
              <div className="text-[#6F7BFF] text-[10px] tracking-widest mb-1">WS FRAME → SERVER</div>
              {"{"}<br />
              &nbsp;&nbsp;"type": "cancle_number",<br />
              &nbsp;&nbsp;"payload": {"{"} "number": <span className="px-1 rounded border border-[#FFC300] text-[#FFC300]">"17"</span> {"}"}<br />
              {"}"}
            </div>
          </motion.div>
          <motion.div
            className="absolute w-[250px]"
            style={{ left: "2%", top: "70%" }}
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <div className="rounded-xl border border-[#1E90FF66] bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-white/80">
              <div className="text-[#1E90FF] text-[10px] tracking-widest mb-1">SET-COOKIE (after login)</div>
              token=<span className="px-1 rounded border border-[#FFC300] text-[#FFC300]">eyJhbGciOi…</span>;<br />HttpOnly; Secure; SameSite=None;<br />Max-Age=86400
            </div>
          </motion.div>
          <div className="absolute -translate-x-full -translate-y-1/2 pr-4" style={pct(BRANCH_TO)}>
            <motion.div
              className="flex items-center gap-2 px-2.5 py-1 rounded-md border font-mono text-[10.5px] tracking-wider whitespace-nowrap"
              style={{ borderColor: `${C.red}88`, color: C.red, background: "#0c0813dd" }}
              animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              DUPLICATE NUMBER · NOT YOUR TURN → BLOCKED
            </motion.div>
          </div>
          </div>
        </div>
      </div>
      <p className="md:hidden text-center text-xs text-white/40 mt-2">← swipe the diagram · tap any block →</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          <GlowCard accent={node.accent} active>
            <div className="p-5 md:p-6 grid md:grid-cols-[1fr_auto] gap-4 items-start">
              <div>
                <p className="font-mono text-[11px] tracking-widest uppercase text-white/40 mb-1">Selected block</p>
                <h4 className="text-xl font-semibold text-white mb-2">{node.title}</h4>
                <p className="text-white/70 leading-relaxed">{node.body}</p>
              </div>
              <div className="flex flex-wrap md:flex-col gap-1.5 md:items-end">
                {node.files.map((f) => <FileRef key={f} path={f} />)}
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
