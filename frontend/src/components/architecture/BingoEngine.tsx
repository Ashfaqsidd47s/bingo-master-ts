import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { C } from "./theme";
import { FileRef, GlowCard, Pill } from "./primitives";

// ---------------------------------------------------------------------------
// A tiny, deterministic re-implementation of the bingo-master rules, only for
// this animation. The real engine lives in the `bingo-master` npm package.
// ---------------------------------------------------------------------------
const N = 5;

function seededBoard(seed: number): number[][] {
  let s = seed;
  const rand = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const nums = Array.from({ length: N * N }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return Array.from({ length: N }, (_, r) => nums.slice(r * N, r * N + N));
}

type LineId = string; // R_i | C_j | D_0 | D_1
const LINES: { id: LineId; cells: [number, number][] }[] = [
  ...Array.from({ length: N }, (_, i) => ({ id: `R_${i}`, cells: Array.from({ length: N }, (_, j) => [i, j] as [number, number]) })),
  ...Array.from({ length: N }, (_, j) => ({ id: `C_${j}`, cells: Array.from({ length: N }, (_, i) => [i, j] as [number, number]) })),
  { id: "D_0", cells: Array.from({ length: N }, (_, i) => [i, i] as [number, number]) },
  { id: "D_1", cells: Array.from({ length: N }, (_, i) => [i, N - 1 - i] as [number, number]) },
];

function completedLines(board: number[][], called: Set<number>): LineId[] {
  return LINES.filter((l) => l.cells.every(([r, c]) => called.has(board[r][c]))).map((l) => l.id);
}

function greedyPick(board: number[][], called: Set<number>): number {
  let best = -1;
  let bestScore = -1;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = board[r][c];
      if (called.has(v)) continue;
      let score = 0;
      for (const l of LINES) {
        if (!l.cells.some(([a, b]) => a === r && b === c)) continue;
        const done = l.cells.filter(([a, b]) => called.has(board[a][b])).length;
        score += done === N - 1 ? 100 : done * done;
      }
      if (score > bestScore) { bestScore = score; best = v; }
    }
  }
  return best;
}

type Step =
  | { kind: "call"; player: 0 | 1; number: number }
  | { kind: "dup"; player: 0 | 1; number: number }
  | { kind: "turn"; player: 0 | 1; number: number };

function buildScript(boards: number[][][]) {
  const called = new Set<number>();
  const steps: Step[] = [];
  let winner: 0 | 1 | null = null;
  while (winner === null && called.size < N * N) {
    const turn = (called.size % 2) as 0 | 1;
    const num = greedyPick(boards[turn], called);
    called.add(num);
    steps.push({ kind: "call", player: turn, number: num });
    const counts = boards.map((b) => completedLines(b, called).length);
    // same order of checks as Bingo.cancelNumber()
    if (counts[turn] >= N) winner = turn;
    counts.forEach((cnt, i) => { if (cnt >= N) winner = i as 0 | 1; });
    // inject two rejected moves so the guards are visible in the loop
    if (steps.length === 3) steps.push({ kind: "dup", player: (called.size % 2) as 0 | 1, number: [...called][0] });
    if (steps.length === 8) steps.push({ kind: "turn", player: ((called.size + 1) % 2) as 0 | 1, number: greedyPick(boards[0], called) });
  }
  return { steps, winner };
}

const BOARDS = [seededBoard(7), seededBoard(42)];
const SCRIPT = buildScript(BOARDS);

function MiniBoard({ board, called, last, lines, label, active, color }: {
  board: number[][]; called: Set<number>; last: number | null; lines: LineId[]; label: string; active: boolean; color: string;
}) {
  const count = Math.min(lines.length, N);
  return (
    <GlowCard accent={color} active={active} className="w-full max-w-[340px] mx-auto">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">{label}</span>
          {active ? <Pill color={C.green}>turn</Pill> : <Pill color="#8a8cc4">waiting</Pill>}
        </div>
        <div className="grid grid-cols-5 gap-1 mb-1.5">
          {"BINGO".split("").map((ch, i) => (
            <div key={i} className={`aspect-square rounded-md center text-sm font-bold transition-colors duration-500 ${i < count ? "bg-navyblue text-white shadow-[0_0_12px_#3D4AEB]" : "bg-gray-900 text-white/40"}`}>{ch}</div>
          ))}
        </div>
        <div className="relative grid grid-cols-5 gap-1">
          {board.flat().map((v) => {
            const isCalled = called.has(v);
            const isLast = v === last;
            return (
              <motion.div
                key={v}
                animate={{ scale: isLast ? [1, 1.18, 1] : 1, backgroundColor: isCalled ? "#3D4AEB" : "#101828" }}
                transition={{ duration: isLast ? 0.6 : 0.3 }}
                className="aspect-square rounded-md center text-xs sm:text-sm font-semibold text-white"
                style={{ boxShadow: isLast ? `0 0 0 2px ${C.cyan}, 0 0 16px ${C.cyan}` : undefined }}
              >
                {v}
              </motion.div>
            );
          })}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
            {lines.map((id) => {
              const [t, n] = id.split("_");
              const k = (Number(n) + 0.5) * 20;
              const pts = t === "R" ? [3, k, 97, k] : t === "C" ? [k, 3, k, 97] : n === "0" ? [4, 4, 96, 96] : [96, 4, 4, 96];
              return (
                <motion.line key={id} x1={pts[0]} y1={pts[1]} x2={pts[2]} y2={pts[3]}
                  stroke="white" strokeOpacity={0.6} strokeWidth={3.2} vectorEffect="non-scaling-stroke" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
              );
            })}
          </svg>
        </div>
        <div className="mt-2 font-mono text-[10.5px] text-white/50 truncate">
          lines: {lines.length ? lines.join(" · ") : "—"} <span className="text-white/80">({lines.length}/5)</span>
        </div>
      </div>
    </GlowCard>
  );
}

export function BingoEngineDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-120px" });
  const reduce = useReducedMotion();
  const [i, setI] = useState(reduce ? SCRIPT.steps.length : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const done = i >= SCRIPT.steps.length;
    const t = setTimeout(() => setI(done ? 0 : i + 1), done ? 4500 : 1300);
    return () => clearTimeout(t);
  }, [i, inView, reduce]);

  const state = useMemo(() => {
    const called = new Set<number>();
    const order: number[] = [];
    for (const s of SCRIPT.steps.slice(0, i)) if (s.kind === "call") { called.add(s.number); order.push(s.number); }
    const current = i > 0 ? SCRIPT.steps[i - 1] : null;
    return { called, order, current, lines: BOARDS.map((b) => completedLines(b, called)) };
  }, [i]);

  const turn = state.called.size % 2;
  const finished = i >= SCRIPT.steps.length;
  const cur = state.current;
  const last = cur?.kind === "call" ? cur.number : null;

  return (
    <div ref={ref} className="grid lg:grid-cols-[1fr_300px_1fr] gap-4 items-start">
      <MiniBoard board={BOARDS[0]} called={state.called} last={last} lines={state.lines[0]} label="Player 0 · board A" active={!finished && turn === 0} color={C.sky} />

      <div className="flex flex-col gap-3 order-first lg:order-none">
        <GlowCard accent={C.gold}>
          <div className="p-4 font-mono text-[12px] leading-relaxed">
            <div className="text-[10px] tracking-widest text-[#FFC300] mb-2">ENGINE STATE (shared)</div>
            <div className="text-white/70">canceled = Set(<span className="text-white">{state.called.size}</span>)</div>
            <div className="text-white/70">turn = size % 2 = <span className="text-white">{turn}</span></div>
            <div className="text-white/70">winner = <span className={SCRIPT.winner !== null && finished ? "text-[#22C55E]" : "text-white"}>{finished ? `Player ${SCRIPT.winner}` : "null"}</span></div>
            <div className="mt-2 flex flex-wrap items-start content-start gap-1 min-h-[44px]">
              {state.order.map((n, k) => (
                <motion.span key={n} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={`px-1.5 py-0.5 leading-none rounded text-[11px] ${k % 2 === 0 ? "bg-[#1E90FF33] text-[#8cc6ff]" : "bg-[#6F7BFF33] text-[#b5bbff]"}`}>{n}</motion.span>
              ))}
            </div>
          </div>
        </GlowCard>
        <div className="min-h-[74px]">
          <AnimatePresence mode="wait">
            {cur && (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                className="rounded-xl border px-3 py-2.5 text-sm"
                style={cur.kind === "call"
                  ? { borderColor: `${C.cyan}55`, background: `${C.cyan}0d`, color: "#d7ffff" }
                  : { borderColor: `${C.red}88`, background: `${C.red}14`, color: C.red }}>
                {cur.kind === "call" && <>Player {cur.player} calls <b>{cur.number}</b> → struck on <b>both</b> boards.</>}
                {cur.kind === "dup" && <><b>✕ BLOCKED</b> — Player {cur.player} sends {cur.number} again: “Number already canceled”.</>}
                {cur.kind === "turn" && <><b>✕ BLOCKED</b> — Player {cur.player} clicks out of turn: “Not your turn”.</>}
              </motion.div>
            )}
            {finished && SCRIPT.winner !== null && (
              <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: `${C.green}88`, color: C.green, background: `${C.green}14` }}>
                ✓ Player {SCRIPT.winner} completes 5 lines → <b>winner</b> / <b>looser</b> sent, game removed.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <MiniBoard board={BOARDS[1]} called={state.called} last={last} lines={state.lines[1]} label="Player 1 · board B" active={!finished && turn === 1} color={C.ws} />
    </div>
  );
}

// In-memory structures held by the GameManager singleton.
export function GameMemory() {
  const reduce = useReducedMotion();
  const panels = [
    {
      title: "games",
      type: "Map<gameId, Game>",
      color: C.gold,
      rows: [
        ["\"a91f…\"", "Game { players: [\"u_7\", \"u_3\"], bingo, isGameOver: false, timer: null }"],
        ["\"c02b…\"", "Game { players: [\"u_5\", \"u_8\"], bingo, isGameOver: false, timer: ⏱ 60s }"],
      ],
      note: "Added by createNewGame(), deleted by removeGame() on win, surrender or forfeit.",
    },
    {
      title: "users",
      type: "Map<userId, User>",
      color: C.ws,
      rows: [
        ["\"u_7\"", "User { ws: OPEN, gameId: \"a91f…\" }"],
        ["\"u_3\"", "User { ws: OPEN, gameId: \"a91f…\" }"],
        ["\"u_9\"", "User { ws: OPEN, gameId: \"\" }"],
      ],
      note: "Keyed by the JWT user id — a second tab with the same account replaces (and closes) the older socket.",
    },
    {
      title: "waiting slot",
      type: "waitingId · waitingUser",
      color: C.green,
      rows: [["waitingId", "\"u_9\""], ["waitingUser", "User u_9"]],
      note: "Exactly one seat. The next join_game from someone else pairs with it; closing the socket clears it.",
    },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {panels.map((p, k) => (
        <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.1 }}>
          <GlowCard accent={p.color} className="h-full">
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white">{p.title}</span>
                <span className="font-mono text-[10.5px]" style={{ color: p.color }}>{p.type}</span>
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                {p.rows.map(([k2, v], r) => (
                  <motion.div key={k2}
                    className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-white/75 break-words"
                    animate={reduce || p.title !== "waiting slot" ? undefined : { borderColor: ["#ffffff1a", `${C.green}aa`, "#ffffff1a"] }}
                    transition={{ duration: 2, repeat: Infinity, delay: r * 0.3 }}>
                    <span style={{ color: p.color }}>{k2}</span> → {v}
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-white/55 mt-auto">{p.note}</p>
            </div>
          </GlowCard>
        </motion.div>
      ))}
      <div className="md:col-span-3 flex flex-wrap gap-2 items-center text-sm text-white/50">
        Source: <FileRef path="server/src/GameManager.ts" /> <FileRef path="server/src/Game.ts" /> <FileRef path="server/src/User.ts" />
      </div>
    </div>
  );
}
