import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "../../lib/sadcn";
import { C, FlowKind, KIND } from "./theme";

export function Section({ id, level, title, intro, children }: {
  id: string;
  level: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 w-full max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-8 md:mb-10"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-navyblue uppercase mb-3">{level}</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h2>
        <div className="text-white/60 max-w-3xl leading-relaxed">{intro}</div>
      </motion.div>
      {children}
    </section>
  );
}

export function SubHeading({ index, title, children }: { index: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-5 mt-12 first:mt-0">
      <h3 className="text-xl md:text-2xl font-semibold text-white flex items-center gap-3">
        <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-navyblue/20 text-navyblue border border-navyblue/40">{index}</span>
        {title}
      </h3>
      {children && <p className="text-white/55 mt-2 max-w-3xl leading-relaxed">{children}</p>}
    </div>
  );
}

// Glassy card with the rotating conic border used by the game boards.
export function GlowCard({ children, className, accent = C.navyblue, active = false }: {
  children: ReactNode;
  className?: string;
  accent?: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn("relative rounded-2xl p-[1px] transition-shadow duration-300", className)}
      style={{
        background: `linear-gradient(135deg, ${accent}${active ? "ff" : "88"}, ${C.deep}55 45%, ${accent}${active ? "aa" : "33"})`,
        boxShadow: active ? `0 0 32px -6px ${accent}aa` : `0 0 24px -12px ${accent}66`,
      }}
    >
      <div className="h-full rounded-[15px] bg-[#13101f]/95 backdrop-blur-sm">{children}</div>
    </div>
  );
}

export function KindDot({ kind, className }: { kind: FlowKind; className?: string }) {
  return (
    <span
      className={cn("inline-block w-2.5 h-2.5 rounded-full shrink-0", className)}
      style={{ background: KIND[kind].color, boxShadow: `0 0 10px ${KIND[kind].color}` }}
    />
  );
}

export function FileRef({ path }: { path: string }) {
  return (
    <code className="inline-flex items-center font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 break-all">
      {path}
    </code>
  );
}

// Floating code panel, like the JSON callouts in the motion graphics.
export function CodeCard({ title, code, accent = C.gold, className }: {
  title?: string;
  code: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-black/50 backdrop-blur-sm overflow-hidden", className)} style={{ borderColor: `${accent}55` }}>
      {title && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b text-[11px] font-mono uppercase tracking-wider" style={{ borderColor: `${accent}33`, color: accent }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          {title}
        </div>
      )}
      <pre className="p-3 text-[11.5px] leading-relaxed font-mono text-white/80 whitespace-pre-wrap break-words">{code}</pre>
    </div>
  );
}

// Vertical beam between two tiers: a dim rail with glowing packets falling down it.
export function TierConnector({ label, kind = "internal" }: { label?: string; kind?: FlowKind }) {
  const reduce = useReducedMotion();
  const color = KIND[kind].color;
  return (
    <div className="relative h-14 flex items-center justify-center" aria-hidden={!label}>
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px]" style={{ background: `linear-gradient(${color}10, ${color}70, ${color}10)` }} />
      {!reduce && [0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 -translate-x-1/2 w-[6px] h-4 rounded-full"
          style={{ background: color, boxShadow: `0 0 12px 2px ${color}` }}
          initial={{ top: "-10%", opacity: 0 }}
          animate={{ top: ["-10%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: "easeIn" }}
        />
      ))}
      {label && (
        <span className="relative ml-28 md:ml-36 font-mono text-[11px] uppercase tracking-wider text-white/45 bg-navy px-2">
          {label}
        </span>
      )}
    </div>
  );
}

export function Pill({ children, color = C.navyblue, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-[10.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border", className)}
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      {children}
    </span>
  );
}
