import { motion } from "framer-motion";
import { ReactNode } from "react";
import { C, FlowKind } from "./theme";
import { FileRef, GlowCard, Pill, TierConnector } from "./primitives";

export type TierNode = {
  title: string;
  file?: string;
  body: ReactNode;
  tag?: { text: string; color: string };
  accent?: string;
};
export type Lane = { title: string; kind: FlowKind; nodes: TierNode[] };
export type Tier = {
  label: string;
  nodes?: TierNode[];
  lanes?: Lane[];
  // label on the beam that leads into the NEXT tier
  next?: { label: string; kind?: FlowKind };
};

function NodeCard({ node, index }: { node: TierNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="h-full"
    >
      <GlowCard accent={node.accent ?? C.navyblue} className="h-full">
        <div className="p-4 flex flex-col gap-2 h-full">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-semibold text-white leading-snug">{node.title}</h5>
            {node.tag && <Pill color={node.tag.color} className="shrink-0">{node.tag.text}</Pill>}
          </div>
          <div className="text-sm text-white/60 leading-relaxed grow">{node.body}</div>
          {node.file && <div><FileRef path={node.file} /></div>}
        </div>
      </GlowCard>
    </motion.div>
  );
}

function TierRow({ tier }: { tier: Tier }) {
  return (
    <div className="relative grid md:grid-cols-[120px_1fr] gap-3 md:gap-5 items-stretch">
      <div className="md:pt-4">
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/40">{tier.label}</span>
      </div>
      {tier.nodes && (
        <div className={`grid gap-3 ${tier.nodes.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : tier.nodes.length === 3 ? "sm:grid-cols-3" : tier.nodes.length === 2 ? "sm:grid-cols-2" : ""}`}>
          {tier.nodes.map((n, i) => <NodeCard key={n.title} node={n} index={i} />)}
        </div>
      )}
      {tier.lanes && (
        <div className="grid lg:grid-cols-2 gap-4">
          {tier.lanes.map((lane) => (
            <div key={lane.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Pill color={lane.kind === "ws" ? C.ws : C.sky}>{lane.title}</Pill>
              </div>
              {lane.nodes.map((n, i) => (
                <div key={n.title}>
                  {i > 0 && <TierConnector kind={lane.kind} />}
                  {i === 0 && <div className="h-3" />}
                  <NodeCard node={n} index={i} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TierDiagram({ tiers }: { tiers: Tier[] }) {
  return (
    <div>
      {tiers.map((tier) => (
        <div key={tier.label}>
          <TierRow tier={tier} />
          {tier.next && (
            <div className="md:pl-[140px]">
              <TierConnector label={tier.next.label} kind={tier.next.kind} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
