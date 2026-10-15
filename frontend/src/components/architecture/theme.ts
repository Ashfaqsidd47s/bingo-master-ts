// Colour tokens for the architecture page.
// Base colours mirror the @theme block in index.css; accents come from the
// conic gradients used on tiles (.playing-player / .last-canceled) and the confetti.
export const C = {
  navy: "#0C0813",
  charcoal: "#373855",
  navyblue: "#3D4AEB",
  deep: "#1E246A",
  spicered: "#B15653",
  red: "#E0716D",
  cyan: "#00FFFF",
  sky: "#1E90FF",
  gold: "#FFC300",
  green: "#22C55E",
  ws: "#6F7BFF",
} as const;

// Every arrow / beam on the page belongs to one of these kinds, so the
// legend at the top explains every colour you see further down.
export type FlowKind = "http" | "ws" | "sql" | "oauth" | "internal" | "blocked";

export const KIND: Record<FlowKind, { color: string; label: string; hint: string }> = {
  http: { color: C.sky, label: "HTTPS", hint: "REST calls & redirects (axios / browser)" },
  ws: { color: C.ws, label: "WebSocket", hint: "real-time game messages (JSON)" },
  sql: { color: C.gold, label: "SQL", hint: "pg Pool → PostgreSQL" },
  oauth: { color: C.cyan, label: "OAuth 2.0", hint: "Google sign-in via passport" },
  internal: { color: "#C9CBE8", label: "In-process", hint: "plain function call inside one runtime" },
  blocked: { color: C.red, label: "Blocked", hint: "request rejected by a guard" },
};
