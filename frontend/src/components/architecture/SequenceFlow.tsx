import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Flow, FLOWS, FlowStep, LANES } from "./flows";
import { C, KIND } from "./theme";
import { CodeCard, FileRef, GlowCard, KindDot } from "./primitives";

const STEP_MS = 2800;
const ROW_H = 56;

function laneCenter(i: number, n: number) {
  return ((i + 0.5) / n) * 100;
}

function Arrow({ step, lanes, state, reduce }: {
  step: FlowStep; lanes: string[]; state: "past" | "active" | "future"; reduce: boolean | null;
}) {
  const n = lanes.length;
  const a = lanes.indexOf(step.from);
  const b = lanes.indexOf(step.to);
  const color = KIND[step.kind].color;
  const blocked = step.kind === "blocked";
  const opacity = state === "active" ? 1 : state === "past" ? 0.5 : 0.16;

  if (a === b) {
    // keep pills on the outer lanes inside the diagram
    const shift = a === 0 ? "translateX(-18px)" : a === n - 1 ? "translateX(calc(-100% + 18px))" : "translateX(-50%)";
    return (
      <div className="absolute top-1/2 transition-opacity duration-300" style={{ left: `${laneCenter(a, n)}%`, opacity, transform: `${shift} translateY(-50%)` }}>
        <span
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-mono bg-navy"
          style={{ borderColor: `${color}${state === "active" ? "ff" : "66"}`, color: state === "active" ? "#fff" : "#ffffffcc", boxShadow: state === "active" ? `0 0 18px -2px ${color}` : undefined }}
        >
          <RotateCcw className="w-3 h-3" style={{ color }} /> {step.label}
        </span>
      </div>
    );
  }

  const left = laneCenter(Math.min(a, b), n);
  const width = laneCenter(Math.max(a, b), n) - left;
  const rightward = b > a;
  return (
    <div className="absolute top-0 h-full transition-opacity duration-300" style={{ left: `${left}%`, width: `${width}%`, opacity }}>
      <span
        className="absolute left-1/2 -translate-x-1/2 bottom-[54%] whitespace-nowrap text-[11.5px] font-mono px-1.5 rounded bg-navy/80"
        style={{ color: state === "active" ? "#fff" : "#ffffffd0" }}
      >
        {step.label}
      </span>
      <div
        className="absolute top-[62%] left-0 right-0 h-[2px] -translate-y-1/2"
        style={blocked
          ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 11px)` }
          : { background: color, boxShadow: state === "active" ? `0 0 12px ${color}` : undefined }}
      />
      {/* arrow head, or ✕ for blocked */}
      <span
        className="absolute top-[62%] -translate-y-1/2 leading-none"
        style={{ [rightward ? "right" : "left"]: -2, color } as CSSProperties}
      >
        {blocked ? <b className="text-[13px] block -translate-y-[1px]">✕</b> : (
          <span className="block w-0 h-0 border-y-[5px] border-y-transparent"
            style={rightward ? { borderLeft: `8px solid ${color}` } : { borderRight: `8px solid ${color}` }} />
        )}
      </span>
      {state === "active" && !reduce && (
        <motion.span
          className="absolute top-[62%] w-2.5 h-2.5 -mt-[5px] -ml-[5px] rounded-full"
          style={{ background: "#fff", boxShadow: `0 0 12px 3px ${color}` }}
          initial={{ left: rightward ? "0%" : "100%" }}
          animate={{ left: blocked ? (rightward ? ["0%", "70%"] : ["100%", "30%"]) : (rightward ? ["0%", "100%"] : ["100%", "0%"]), opacity: blocked ? [1, 1, 0] : 1 }}
          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.35, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

function SequencePlayer({ flow }: { flow: Flow }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-100px" });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const last = flow.steps.length - 1;

  useEffect(() => {
    if (!playing || !inView) return;
    if (active >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setActive((x) => Math.min(x + 1, last)), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, inView, active, last]);

  const step = flow.steps[active];
  const n = flow.lanes.length;
  const go = (i: number) => { setActive(Math.max(0, Math.min(last, i))); setPlaying(false); };

  return (
    <div ref={ref} className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <div className={`relative ${n >= 5 ? "min-w-[720px]" : "min-w-[560px]"} px-2 pb-3`}>
            {/* lane headers */}
            <div className="grid sticky top-0 z-10 py-3 bg-navy/90 backdrop-blur-sm border-b border-white/5" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {flow.lanes.map((id) => {
                const lane = LANES[id];
                const involved = step.from === id || step.to === id;
                return (
                  <div key={id} className="flex justify-center">
                    <div className="text-center px-2.5 py-1.5 rounded-xl border transition-all duration-300"
                      style={{ borderColor: involved ? lane.color : "#ffffff1a", background: involved ? `${lane.color}22` : "transparent", boxShadow: involved ? `0 0 20px -6px ${lane.color}` : undefined }}>
                      <div className="text-[12.5px] font-semibold text-white leading-tight">{lane.title}</div>
                      <div className="text-[10px] font-mono text-white/45 leading-tight">{lane.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* lifelines + rows */}
            <div className="relative">
              {flow.lanes.map((id, i) => (
                <div key={id} className="absolute top-0 bottom-0 w-px" style={{ left: `${laneCenter(i, n)}%`, backgroundImage: `linear-gradient(${LANES[id].color}55 50%, transparent 50%)`, backgroundSize: "1px 8px" }} />
              ))}
              {flow.steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`relative block w-full text-left cursor-pointer rounded-lg transition-colors ${i === active ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"}`}
                  style={{ height: ROW_H }}
                  aria-label={`Step ${i + 1}: ${s.label}`}
                >
                  <span className={`absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full center text-[10px] font-mono ${i === active ? "bg-navyblue text-white" : "bg-white/5 text-white/40"}`}>{i + 1}</span>
                  <Arrow step={s} lanes={flow.lanes} state={i < active ? "past" : i === active ? "active" : "future"} reduce={reduce} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-20">
        <GlowCard accent={KIND[step.kind].color} active>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] tracking-widest text-white/45">STEP {active + 1} / {flow.steps.length}</span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: KIND[step.kind].color }}>
                <KindDot kind={step.kind} /> {KIND[step.kind].label}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/10 mb-4 overflow-hidden">
              <motion.div className="h-full bg-navyblue" animate={{ width: `${((active + 1) / flow.steps.length) * 100}%` }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={`${flow.id}-${active}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                <p className="text-[12px] font-mono text-white/45 mb-1">{LANES[step.from].title} → {LANES[step.to].title}</p>
                <h4 className="text-lg font-semibold text-white mb-2 break-words">{step.label}</h4>
                <p className="text-sm text-white/70 leading-relaxed mb-3">{step.detail}</p>
                {step.file && <div className="mb-3"><FileRef path={step.file} /></div>}
                {step.payload && <CodeCard title="payload" code={step.payload} accent={KIND[step.kind].color} />}
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-2 mt-5">
              <button onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous step" className="w-10 h-10 rounded-full bg-charcoal/70 hover:bg-charcoal center disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
              <button
                onClick={() => { if (active >= last) { setActive(0); setPlaying(true); } else setPlaying((p) => !p); }}
                className="h-10 px-4 rounded-full bg-navyblue hover:bg-navyblue/85 flex items-center gap-2 text-sm font-semibold cursor-pointer"
              >
                {active >= last ? <><RotateCcw className="w-4 h-4" /> Replay</> : playing ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play</>}
              </button>
              <button onClick={() => go(active + 1)} disabled={active === last} aria-label="Next step" className="w-10 h-10 rounded-full bg-charcoal/70 hover:bg-charcoal center disabled:opacity-30 cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}

export default function FlowExplorer() {
  const [idx, setIdx] = useState(0);
  const flow = FLOWS[idx];
  return (
    <div>
      {/* story order: each flow builds on the previous one */}
      <div className="relative mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          {FLOWS.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setIdx(i)}
              className={`shrink-0 flex items-center gap-2 rounded-full border pl-1.5 pr-3.5 py-1.5 text-sm transition-all cursor-pointer ${i === idx ? "border-navyblue bg-navyblue/25 text-white shadow-[0_0_20px_-6px_#3D4AEB]" : "border-white/10 text-white/60 hover:text-white hover:border-white/25"}`}
            >
              <span className={`w-6 h-6 rounded-full center text-[11px] font-mono ${i === idx ? "bg-navyblue" : "bg-white/10"}`}>{i + 1}</span>
              {f.title}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <h4 className="text-2xl font-semibold text-white">{idx + 1}. {flow.title}</h4>
          <p className="text-white/60 mt-1 max-w-2xl">{flow.summary}</p>
        </div>
        {idx < FLOWS.length - 1 && (
          <button onClick={() => setIdx(idx + 1)} className="self-start md:self-auto shrink-0 flex items-center gap-1 text-sm text-white/60 hover:text-white cursor-pointer">
            Next: {FLOWS[idx + 1].title} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <SequencePlayer key={flow.id} flow={flow} />
      <p className="text-xs text-white/35 mt-3">Click any row to jump to it. The player auto-advances while it is on screen{` `}<span style={{ color: C.navyblue }}>·</span> swipe the diagram sideways on small screens.</p>
    </div>
  );
}
