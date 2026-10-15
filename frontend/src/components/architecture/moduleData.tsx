import { C } from "./theme";
import type { Tier } from "./ModuleTiers";

// Content for the Level 1 module diagrams. Update this when files move or responsibilities change.

const PUBLIC = { text: "public", color: C.green };
const AUTH = { text: "needs user", color: C.gold };
const PERSIST = { text: "localStorage", color: C.gold };

export const FRONTEND_TIERS: Tier[] = [
  {
    label: "Entry",
    nodes: [{
      title: "main.tsx",
      file: "frontend/src/main.tsx",
      body: <>createRoot → <code>&lt;StrictMode&gt;</code> → <code>&lt;BrowserRouter&gt;</code> → <code>&lt;App/&gt;</code> + sonner <code>&lt;Toaster/&gt;</code>.</>,
    }],
    next: { label: "mounts" },
  },
  {
    label: "App shell",
    nodes: [
      {
        title: "App.tsx",
        file: "frontend/src/App.tsx",
        accent: C.sky,
        body: <>On mount: <b className="text-white/80">verifyUser()</b> (HTTPS) and <b className="text-white/80">connect()</b> (WebSocket). Declares every route and its guard.</>,
      },
      {
        title: "Modal.tsx",
        file: "frontend/src/components/modals/Modal.tsx",
        body: <>One global Radix dialog. Any page calls <code>openModal(&lt;X/&gt;, onClose)</code> from modalStore — used for logout and win/lose.</>,
      },
    ],
    next: { label: "routes to" },
  },
  {
    label: "Pages",
    nodes: [
      { title: "/  Home", file: "pages/Home.tsx", tag: PUBLIC, body: "Login with Google (full-page redirect to the server) or “Let’s play” → /search. Shows a live board preview." },
      { title: "/aibattle  AiBattle", file: "pages/AiBattle.tsx", tag: PUBLIC, body: "Runs entirely in the browser: a local 4×4 Bingo engine and two greedy bots. No server traffic." },
      { title: "/search  Searching", file: "pages/Searching.tsx", tag: AUTH, body: "Sends join_game, shows the radar animation, waits for game_started, then navigates to /game after 2 s." },
      { title: "/game  Game", file: "pages/Game.tsx", tag: { text: "needs game", color: C.gold }, body: "The match: board, turn badge, emoji/chat, win/lose modal. Guard: no game → /search, no user → /." },
    ],
    next: { label: "compose" },
  },
  {
    label: "Components",
    nodes: [
      { title: "CustomBoard + CustomTile", file: "components/CustomBoard.tsx", body: "5×5 board, BINGO letters light up per completed line, strike-through bars for R_i / C_j / D_0 / D_1." },
      { title: "AiBoard · Board", file: "components/AiBoard.tsx", body: "Read-only boards for the AI battle and the Home preview." },
      { title: "ActiveUsers", file: "components/ActiveUsers.tsx", body: "Listens for user_count on the shared socket and shows the green “N Active” dot." },
      { title: "EmojiAttachment · modals", file: "components/EmojiAttachment.tsx", body: "Floating emoji from the opponent; WinnLoosModal and LogoutModal." },
    ],
    next: { label: "read & write state" },
  },
  {
    label: "State · Zustand",
    nodes: [
      { title: "userStore", file: "store/userstore.ts", tag: PERSIST, accent: C.sky, body: <>user · isVerifying · <code>verifyUser()</code> → GET /api/user/profile.</> },
      { title: "gameStore", file: "store/gameStore.ts", tag: PERSIST, body: <>game (boardInfo, cancelInfo, cancelCount, turn, isGameOver) + oponent. Survives a refresh.</> },
      { title: "gameSocketStore", file: "store/gameSocketStore.ts", accent: C.ws, body: <>The ONE WebSocket. Listener <code>Set</code> fan-out, offline send queue, reconnect backoff 1→2→4→8→16 s (max 5).</> },
      { title: "modalStore", file: "store/modalstore.ts", body: "modalContent + onCloseModal callback (used to clear the game after a win/loss)." },
    ],
    next: { label: "talk to the server through", kind: "http" },
  },
  {
    label: "Transport",
    nodes: [
      { title: "axiosInstance", file: "lib/axiosInstance.ts", accent: C.sky, tag: { text: "HTTPS", color: C.sky }, body: <>baseURL = VITE_API_BASE_URL or the Render URL · <code>withCredentials</code> so the token cookie travels · 401 → clears user-store.</> },
      { title: "WebSocket", file: "store/gameSocketStore.ts", accent: C.ws, tag: { text: "WSS", color: C.ws }, body: <>wss://bingo-master-ts.onrender.com — the browser attaches the token cookie to the upgrade request automatically.</> },
      { title: "bingo-master · aimodels", file: "lib/aimodels.ts", accent: C.gold, tag: { text: "local", color: C.gold }, body: "Engine + bingoBot used offline by /aibattle and the Home preview." },
    ],
  },
];

export const BACKEND_TIERS: Tier[] = [
  {
    label: "Entry",
    nodes: [{
      title: "index.ts — one http.Server on :8080",
      file: "server/src/index.ts",
      body: <>Express handles plain HTTP; <code>new WebSocketServer({"{ server }"})</code> handles the <code>Upgrade</code> on the same port. dotenv loads JWT_SECRET, POSTGRES_URL, GOOGLE_*, CLIENT_URL, SERVER_URL.</>,
    }],
    next: { label: "every request / upgrade" },
  },
  {
    label: "Two lanes",
    lanes: [
      {
        title: "HTTP lane · Express",
        kind: "http",
        nodes: [
          { title: "Middleware", accent: C.sky, body: <>express.json → cookieParser → cors(CLIENT_URL, <code>credentials: true</code>).</> },
          { title: "routes/auth.ts  /auth/*", file: "server/src/routes/auth.ts", tag: PUBLIC, accent: C.cyan, body: <>/google · /google/callback (sets JWT cookie) · /login · /logout · /guest-login (stub).</> },
          { title: "authenticateJWT", file: "server/src/index.ts", accent: C.red, body: <>Reads <code>req.cookies.token</code> → isValidJWT. Missing / invalid → 302 /auth/login.</> },
          { title: "routes/user.ts  /api/user/profile", file: "server/src/routes/user.ts", accent: C.sky, body: "decryptJWT(token) → { user: { id, name, email, profile_img } }. This is what verifyUser() calls." },
        ],
      },
      {
        title: "WebSocket lane · ws",
        kind: "ws",
        nodes: [
          { title: "wss.on('connection')", file: "server/src/index.ts", accent: C.ws, body: "Broadcasts user_count to every client, then authenticates the handshake from the token cookie (decryptJWT). Fail → {type:'error'}." },
          { title: "User  (one per socket)", file: "server/src/User.ts", accent: C.ws, body: <>intialHandeler(): resumes a running game if this userId reconnects, then a <code>switch</code> on message.type: join_game · cancle_number · surrender · send_message · send_emoji.</> },
          { title: "GameManager  (singleton)", file: "server/src/GameManager.ts", accent: C.navyblue, body: "games Map · users Map · waiting slot. createNewGame(), cancleNumber(), brodcast() to the other player, removeGame()." },
          { title: "Game  (one per match)", file: "server/src/Game.ts", accent: C.gold, body: "uuid · players[2] · bingo-master Bingo · 60 s disconnect timer. Validates the turn, applies the cancel, emits caceled / winner / looser." },
        ],
      },
    ],
    next: { label: "both lanes use" },
  },
  {
    label: "Shared",
    nodes: [
      { title: "utils/auth.ts", file: "server/src/utils/auth.ts", accent: C.red, body: "generateJWT · isValidJWT · decryptJWT (jsonwebtoken + JWT_SECRET). Payload = { id, name, email, profile_img }." },
      { title: "db/db.ts", file: "server/src/db/db.ts", accent: C.gold, body: <>pg Pool. <b className="text-white/80">createUser</b> is used on first login. createGame / updateWinner are ready but <i>not called yet</i>.</> },
      { title: "bingo-master", file: "npm: bingo-master", accent: C.gold, body: "Rules engine: Bingo(size = 5, players = 2). Pure, synchronous, in memory." },
    ],
    next: { label: "network", kind: "sql" },
  },
  {
    label: "External",
    nodes: [
      { title: "PostgreSQL", accent: C.gold, tag: { text: "SQL", color: C.gold }, body: "users (written today) · games · game_players (schema exists, history not written yet)." },
      { title: "Google OAuth 2.0", accent: C.cyan, tag: { text: "OAuth", color: C.cyan }, body: "Consent screen + profile API used by passport-google-oauth20." },
    ],
  },
];

export const DB_TABLES: { name: string; cols: string[]; status: "live" | "pending"; note: string }[] = [
  { name: "users", cols: ["id (uuid)", "name", "email", "password", "profile_img"], status: "live", note: "INSERT on first Google login (createUser). SELECT by email in the passport strategy." },
  { name: "games", cols: ["id (uuid)", "state", "winner"], status: "pending", note: "createGame() inserts state='running'; updateWinner() sets 'over' / 'tied'. Not called from Game.ts yet." },
  { name: "game_players", cols: ["game_id → games.id", "user_id → users.id"], status: "pending", note: "Join table written inside the same transaction as games (BEGIN / COMMIT / ROLLBACK)." },
];
