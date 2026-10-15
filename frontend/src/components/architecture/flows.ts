import { C, FlowKind } from "./theme";

// Data for the animated sequence diagrams on /architecture.
// To document a new flow, add an entry to FLOWS — the player renders it automatically.

export type LaneId =
  | "browser" | "opp" | "express" | "google" | "db"
  | "wss" | "user" | "gm" | "game"
  | "aipage" | "aibot" | "aiengine";

export const LANES: Record<LaneId, { title: string; sub: string; color: string }> = {
  browser: { title: "Your browser", sub: "React SPA", color: C.sky },
  opp: { title: "Opponent", sub: "React SPA", color: C.sky },
  express: { title: "Express", sub: "HTTP :8080", color: C.sky },
  google: { title: "Google", sub: "OAuth 2.0", color: C.cyan },
  db: { title: "PostgreSQL", sub: "pg Pool", color: C.gold },
  wss: { title: "WS server", sub: "index.ts", color: C.ws },
  user: { title: "User", sub: "User.ts", color: C.ws },
  gm: { title: "GameManager", sub: "singleton", color: C.navyblue },
  game: { title: "Game", sub: "Game.ts + Bingo", color: C.gold },
  aipage: { title: "AiBattle", sub: "page", color: C.sky },
  aibot: { title: "bingoBot", sub: "lib/aimodels.ts", color: C.green },
  aiengine: { title: "Bingo(4, 2)", sub: "local engine", color: C.gold },
};

export type FlowStep = {
  from: LaneId;
  to: LaneId;
  kind: FlowKind;
  label: string;
  detail: string;
  file?: string;
  payload?: string;
};

export type Flow = {
  id: string;
  title: string;
  summary: string;
  lanes: LaneId[];
  steps: FlowStep[];
};

export const FLOWS: Flow[] = [
  {
    id: "login",
    title: "Sign in with Google",
    summary: "How a visitor becomes a user: OAuth on the server, a JWT in an HttpOnly cookie, then the SPA asks “who am I?”.",
    lanes: ["browser", "express", "google", "db"],
    steps: [
      { from: "browser", to: "express", kind: "http", label: "GET /auth/google", file: "frontend/src/pages/Home.tsx", detail: "“Login With Google” sets window.location.href to the server — a full page navigation, not an axios call, because OAuth needs real redirects." },
      { from: "express", to: "browser", kind: "http", label: "302 → Google consent", file: "server/src/routes/auth.ts", detail: "passport.authenticate('google', { scope: ['profile', 'email'] }) redirects the browser to Google." },
      { from: "browser", to: "google", kind: "oauth", label: "user picks an account", detail: "Happens entirely on Google's pages." },
      { from: "google", to: "express", kind: "oauth", label: "GET /auth/google/callback?code=…", file: "server/src/routes/auth.ts", detail: "Google redirects back to SERVER_URL + /auth/google/callback with a one-time code." },
      { from: "express", to: "google", kind: "oauth", label: "code → profile + email", detail: "passport-google-oauth20 exchanges the code and fetches the userinfo profile (server to server)." },
      { from: "express", to: "db", kind: "sql", label: "SELECT … WHERE email = $1", file: "server/src/routes/auth.ts", detail: "Look up an existing user by email.", payload: `SELECT "id", "name", "email", "profile_img"\nFROM "users" WHERE "email" = $1` },
      { from: "express", to: "db", kind: "sql", label: "INSERT INTO users (first login only)", file: "server/src/db/db.ts", detail: "createUser() — only if the SELECT returned nothing. A random password (\"google\" + 6 chars) is stored because the column is required." },
      { from: "express", to: "express", kind: "internal", label: "generateJWT()", file: "server/src/utils/auth.ts", detail: "Signs { id, name, email, profile_img } with JWT_SECRET. No expiry in the token itself — the cookie's maxAge (24 h) limits it.", payload: `{ "id": "u_7", "name": "Asha",\n  "email": "asha@…", "profile_img": "https://…" }` },
      { from: "express", to: "browser", kind: "http", label: "Set-Cookie token + 302 CLIENT_URL/", detail: "The cookie is HttpOnly (JS can't read it), Secure and SameSite=None so it is sent cross-site from Vercel to Render.", payload: "Set-Cookie: token=eyJhbGciOi…;\n  HttpOnly; Secure; SameSite=None; Max-Age=86400\nLocation: https://bingo-master-ts.vercel.app/" },
      { from: "browser", to: "express", kind: "http", label: "GET /api/user/profile", file: "frontend/src/store/userstore.ts", detail: "App.tsx calls verifyUser() on mount. axios sends the cookie because of withCredentials: true. authenticateJWT checks it first." },
      { from: "express", to: "browser", kind: "http", label: "200 { user }", file: "server/src/routes/user.ts", detail: "decryptJWT(token) → user. userStore saves it (persisted as localStorage 'user-store'); Home now shows “Let's Play”.", payload: `{ "user": { "id": "u_7", "name": "Asha", … } }` },
    ],
  },
  {
    id: "connect",
    title: "Open the socket",
    summary: "One WebSocket per tab, authenticated by the same cookie. Every connect and disconnect broadcasts the live player count.",
    lanes: ["browser", "wss", "user", "gm", "opp"],
    steps: [
      { from: "browser", to: "wss", kind: "ws", label: "Upgrade: websocket (cookie attached)", file: "frontend/src/store/gameSocketStore.ts", detail: "connect() is called once from App.tsx; `if (socket) return` prevents a second socket. The browser attaches the token cookie to the upgrade request automatically." },
      { from: "wss", to: "opp", kind: "ws", label: "user_count → every client", file: "server/src/index.ts", detail: "wss.clients.forEach(send). ActiveUsers.tsx renders it as the green “N Active” badge.", payload: `{ "type": "user_count",\n  "payload": { "count": 12, "text": "active users" } }` },
      { from: "wss", to: "wss", kind: "internal", label: "cookie → decryptJWT(token)", file: "server/src/index.ts", detail: "Reads req.headers.cookie, finds token=…, verifies it with JWT_SECRET." },
      { from: "wss", to: "browser", kind: "blocked", label: "error: user not authorized", detail: "Only when the cookie is missing or invalid. The socket stays open but no User is created, so game messages are ignored.", payload: `{ "type": "error", "text": "user not authorized" }` },
      { from: "wss", to: "user", kind: "internal", label: "new User(ws, id, jwtData)", file: "server/src/User.ts", detail: "One User object per socket. Its constructor runs intialHandeler()." },
      { from: "user", to: "gm", kind: "internal", label: "users.has(id)? → resume game", file: "server/src/User.ts", detail: "If this user id is already known (refresh, second tab, network blip) the running game is resumed and the old socket is closed — see “Disconnect & reconnect”." },
      { from: "user", to: "gm", kind: "internal", label: "users.set(id, this)", detail: "The user is now addressable by id; ws.on('message') starts routing their messages." },
      { from: "browser", to: "browser", kind: "internal", label: "onopen → flushQueue()", file: "frontend/src/store/gameSocketStore.ts", detail: "Anything send() was asked to deliver while the socket was still connecting has been queued and is flushed now." },
    ],
  },
  {
    id: "match",
    title: "Find an opponent",
    summary: "Matchmaking is a single waiting seat: the first player waits, the second one starts the game.",
    lanes: ["browser", "opp", "user", "gm", "game"],
    steps: [
      { from: "browser", to: "user", kind: "ws", label: "join_game", file: "frontend/src/pages/Searching.tsx", detail: "“Find Opponent” on /search. Searching.tsx opens the full-screen dialog with the radar animation.", payload: `{ "type": "join_game" }` },
      { from: "user", to: "gm", kind: "internal", label: "already in a game? → resend game_started", file: "server/src/User.ts", detail: "If this.gameId points at a live game the server just re-sends its state, so double clicks are harmless." },
      { from: "user", to: "gm", kind: "internal", label: "seat empty → waitingId = you", detail: "GameManager.waitingId / waitingUser now hold you." },
      { from: "user", to: "browser", kind: "ws", label: "waiting", detail: "Keeps the “Searching” state on.", payload: `{ "type": "waiting",\n  "payload": { "text": "hey wait a minute …" } }` },
      { from: "opp", to: "user", kind: "ws", label: "join_game (another player)", detail: "Another user hits Find Opponent. (If it is the same id as the waiting user the request is ignored.)" },
      { from: "user", to: "gm", kind: "internal", label: "seat taken → createNewGame(you, them)", file: "server/src/GameManager.ts", detail: "The waiting user becomes player 0 and moves first." },
      { from: "gm", to: "game", kind: "internal", label: "new Game(): uuid + new Bingo()", file: "server/src/Game.ts", detail: "bingo-master creates two independently shuffled 5×5 boards." },
      { from: "game", to: "browser", kind: "ws", label: "game_started (turn: true)", detail: "Your board, the opponent's public profile, and that it's your turn.", payload: `{ "type": "game_started", "payload": {\n  "oponent": { "id", "name", "profile_img" },\n  "boardInfo": [[{ "value": 7, "isCanceled": false }, …]],\n  "cancelInfo": [], "cancelCount": 0,\n  "turn": true, "isGameOver": false } }` },
      { from: "game", to: "opp", kind: "ws", label: "game_started (turn: false)", detail: "Same message with their own board and turn: false." },
      { from: "gm", to: "gm", kind: "internal", label: "games.set · gameId on both · seat cleared", file: "server/src/GameManager.ts", detail: "From now on both Users carry the gameId, which every later message relies on." },
      { from: "browser", to: "browser", kind: "internal", label: "gameStore.update → /game after 2 s", file: "frontend/src/pages/Searching.tsx", detail: "updateGame + updateOponent (persisted), the VS animation plays, then navigate('/game'). The /game guard now passes because game is set." },
    ],
  },
  {
    id: "turn",
    title: "Play a turn",
    summary: "The heart of the game. One number travels in, is validated twice, and comes back to both players with their own updated board.",
    lanes: ["browser", "user", "gm", "game", "opp"],
    steps: [
      { from: "browser", to: "browser", kind: "internal", label: "tile click → cancelNumber(17)", file: "frontend/src/pages/Game.tsx", detail: "Only sends when turn === true locally — a first, client-side guard." },
      { from: "browser", to: "user", kind: "ws", label: "cancle_number { number: \"17\" }", detail: "Note the spelling: “cancle” is the protocol name on both sides.", payload: `{ "type": "cancle_number",\n  "payload": { "number": "17" } }` },
      { from: "user", to: "user", kind: "internal", label: "validate number + gameId", file: "server/src/User.ts", detail: "Number(payload.number) must be truthy (else “Invalid number”), and the user must be in a game (else “not joined any game”)." },
      { from: "user", to: "gm", kind: "internal", label: "cancleNumber(gameId, 17, userId)", file: "server/src/GameManager.ts", detail: "Looks up the Game; replies “No gamejoined…” if it was already removed." },
      { from: "gm", to: "game", kind: "internal", label: "game.cancelNumber(17, playerId)", file: "server/src/Game.ts", detail: "Maps the user id to player index 0 / 1." },
      { from: "game", to: "browser", kind: "blocked", label: "✕ Not your turn", detail: "Server-side guard: bingo.getTurn() (= called numbers % 2) must equal your index. A repeated number is blocked the same way — bingo-master throws “Number already canceled” and the error is sent back as type “errer”.", payload: `{ "type": "errer",\n  "payload": { "text": "Not your turn", "turn": false } }` },
      { from: "game", to: "game", kind: "internal", label: "bingo.cancelNumber(17, idx)", detail: "17 is added to the ONE shared called-set and struck on BOTH boards (it sits in a different cell on each). Completed rows/cols/diagonals are re-counted." },
      { from: "game", to: "browser", kind: "ws", label: "caceled (turn: false)", detail: "Your board with 17 struck, your line codes (R_0, C_3, D_1 …) and count.", payload: `{ "type": "caceled", "payload": {\n  "boardInfo": [[…]], "cancelInfo": ["R_2"],\n  "cancelCount": 1, "number": 17,\n  "turn": false, "isGameOver": false } }` },
      { from: "game", to: "opp", kind: "ws", label: "caceled (turn: true)", detail: "Their own board — 17 is struck there too — and now it's their turn." },
      { from: "opp", to: "opp", kind: "internal", label: "re-render: YOUR TURN · CANCELED 17", file: "frontend/src/components/CustomBoard.tsx", detail: "Game.tsx updates local state; CustomBoard lights BINGO letters per completed line and draws strike bars from cancelInfo." },
    ],
  },
  {
    id: "over",
    title: "Win, lose or surrender",
    summary: "A game ends when any board reaches 5 lines — even if it was the opponent's number that completed it.",
    lanes: ["browser", "user", "gm", "game", "opp"],
    steps: [
      { from: "browser", to: "user", kind: "ws", label: "cancle_number (the deciding number)", detail: "Same path as a normal turn." },
      { from: "game", to: "game", kind: "internal", label: "bingo.getWinner() !== null", file: "server/src/Game.ts", detail: "bingo-master checks every board after each call, so your move can make the OPPONENT win." },
      { from: "game", to: "browser", kind: "ws", label: "winner", detail: "Also includes the loser's board (oponentInfo) so it can be revealed.", payload: `{ "type": "winner", "payload": {\n  "text": "you wone the game",\n  "cancelCount": 5, "oponentCancelCount": 3,\n  "isGameOver": true, … } }` },
      { from: "game", to: "opp", kind: "ws", label: "looser", detail: "Mirror message for the other player (spelled “looser” in the protocol)." },
      { from: "game", to: "gm", kind: "internal", label: "removeGame(id)", file: "server/src/GameManager.ts", detail: "The match is gone from memory. Storing the result (db.updateWinner) is still a TODO in Game.ts." },
      { from: "browser", to: "browser", kind: "internal", label: "confetti + WinningModal → /search", file: "frontend/src/components/modals/WinnLoosModal.tsx", detail: "playWinningAnimation(); closing the modal runs handleClearGame: gameStore reset → navigate('/search')." },
      { from: "opp", to: "user", kind: "ws", label: "surrender (alternative ending)", file: "server/src/User.ts", detail: "Supported by the server, but no button sends it yet — the back arrow in Game.tsx opens the logout modal instead.", payload: `{ "type": "surrender" }` },
      { from: "user", to: "browser", kind: "ws", label: "winner (opponent surrendered)", detail: "The other player is declared winner and the game is removed." },
    ],
  },
  {
    id: "reconnect",
    title: "Disconnect & reconnect",
    summary: "Closing a tab doesn't end the game immediately: the opponent gets a 60-second countdown, and coming back cancels it.",
    lanes: ["browser", "wss", "user", "gm", "opp"],
    steps: [
      { from: "browser", to: "wss", kind: "ws", label: "socket closes", detail: "Tab closed, refresh, or network drop." },
      { from: "wss", to: "user", kind: "internal", label: "user.destroy()", file: "server/src/User.ts", detail: "If there is no game the user is just removed. If the opponent is ALSO gone, the game and both users are deleted immediately." },
      { from: "user", to: "opp", kind: "ws", label: "offline", detail: "Opponent's avatar fades out (isOponentOnline = false).", payload: `{ "type": "offline", "payload": {\n  "text": "if he don't come back in 60sec\n           you are the winner" } }` },
      { from: "user", to: "gm", kind: "internal", label: "game.timer = setTimeout(60 s)", detail: "The forfeit clock starts." },
      { from: "wss", to: "opp", kind: "ws", label: "user_count (broadcast)", file: "server/src/index.ts", detail: "Also clears the waiting seat if the leaver was waiting for a match." },
      { from: "browser", to: "browser", kind: "internal", label: "auto-reconnect 1 → 2 → 4 → 8 → 16 s", file: "frontend/src/store/gameSocketStore.ts", detail: "Exponential backoff, max 5 attempts. game + oponent are still in localStorage, so /game renders straight away." },
      { from: "browser", to: "wss", kind: "ws", label: "new socket, same cookie → new User", detail: "Same JWT → same user id." },
      { from: "user", to: "gm", kind: "internal", label: "users.has(id) → clearTimeout(timer)", file: "server/src/User.ts", detail: "intialHandeler finds the old User, adopts its gameId, stops the countdown and closes the stale socket." },
      { from: "user", to: "browser", kind: "ws", label: "game_started (current state)", detail: "Your board and whose turn it is, exactly where you left off." },
      { from: "user", to: "opp", kind: "ws", label: "online", detail: "Opponent's avatar lights up again.", payload: `{ "type": "online", "payload": { "text": "connected back" } }` },
      { from: "gm", to: "opp", kind: "blocked", label: "…or after 60 s: winner by forfeit", detail: "If nobody came back in time the timer sends winner to the remaining player and removes the game." },
    ],
  },
  {
    id: "chat",
    title: "Emoji & quick chat",
    summary: "A pure relay: the server checks you're in a game and forwards the message to the other player only.",
    lanes: ["browser", "user", "gm", "opp"],
    steps: [
      { from: "browser", to: "user", kind: "ws", label: "send_emoji { text: \"🔥\" }", file: "frontend/src/pages/Game.tsx", detail: "From the smiley popover. The chat bubble button sends send_message “hey there!!” the same way.", payload: `{ "type": "send_emoji",\n  "payload": { "text": "🔥" } }` },
      { from: "user", to: "user", kind: "internal", label: "in a game? text not empty?", file: "server/src/User.ts", detail: "Otherwise replies with an error (“not joined any game” / “empty text…”)." },
      { from: "user", to: "gm", kind: "internal", label: "brodcast(msg, userId, gameId)", file: "server/src/GameManager.ts", detail: "Finds the game's two players and picks the one that isn't the sender. Nothing is echoed back." },
      { from: "gm", to: "opp", kind: "ws", label: "emoji { userId, text }", detail: "send_message arrives as type “normal” — Game.tsx doesn't render that type yet.", payload: `{ "type": "emoji",\n  "payload": { "userId": "u_7", "text": "🔥" } }` },
      { from: "opp", to: "opp", kind: "internal", label: "EmojiAttachment for 5 s", file: "frontend/src/components/EmojiAttachment.tsx", detail: "setEmoji(text), cleared by a 5-second timeout." },
    ],
  },
  {
    id: "ai",
    title: "AI battle (offline)",
    summary: "/aibattle never touches the network: the same engine runs in the browser and two greedy bots play each other.",
    lanes: ["aipage", "aibot", "aiengine"],
    steps: [
      { from: "aipage", to: "aiengine", kind: "internal", label: "new Bingo(4, 2)", file: "frontend/src/pages/AiBattle.tsx", detail: "Two 4×4 boards; 4 lines win. Kept in a useRef so re-renders don't reset it." },
      { from: "aipage", to: "aipage", kind: "internal", label: "requestAnimationFrame loop · 1 move / 4 s", detail: "The loop checks the time since the last move and stops when there is a winner." },
      { from: "aipage", to: "aibot", kind: "internal", label: "bingoBot(board of current turn)", file: "frontend/src/lib/aimodels.ts", detail: "Meant to be greedy — pick the open number that completes the most lines. It's a local heuristic; “ChatGPT” and “DeepSeek” are only labels in the UI." },
      { from: "aibot", to: "aipage", kind: "internal", label: "best number", detail: "-1 means nothing is left." },
      { from: "aipage", to: "aiengine", kind: "internal", label: "cancelNumber(n, turn)", detail: "Same API the server uses. Boards update one after the other with a 1 s delay for drama." },
      { from: "aiengine", to: "aipage", kind: "internal", label: "getWinner() → confetti + dialog", detail: "“once more” reloads the page; “Let's play” goes to /game (→ /search if there's no game)." },
    ],
  },
];
