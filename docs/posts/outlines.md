# Launch post outlines

Three posts, one angle each. These are outlines with the real code to quote, not finished text: write them in your own voice. Every post ends with the live link, the repo, and one specific question for readers (it invites replies better than "let me know what you think").

Visuals for all three come from `pnpm media` (video, screenshots) and `pnpm media:gif` (`docs/media/demo.gif`).

---

## 1. How I made living tentacles with Verlet chains in React Three Fiber

**Audience:** Three.js forum (Showcase), dev.to, X/LinkedIn graphics people.
**Title options:** "Procedural tentacles in R3F: no model file, just a rope simulation" / "I made a to-do list where every task is a tentacle".

**Hook (first 3 lines):** the swipe-to-slash GIF, then: "There is no 3D model in this project. Every tentacle is a chain of points."

**Outline**
1. **The idea in one paragraph.** A task is a tentacle; finishing it cuts it. Show `demo.gif`.
2. **Why not a model?** A model can't grow a new arm when you add a task, shrink when cut, or vary per octopus. A simulation can.
3. **The chain.** A tentacle is N points joined by fixed-length segments (`src/three/physics/verlet.ts`). Per frame:
   - `integrate`: each point moves by its own velocity (`pos - prev`) plus gravity. No velocity is stored: it is implied by the last position. Explain this trick in two sentences.
   - `solveDistances`: push the points back to the rest length, a few iterations; the first `pinned` points never move (the root stays on the body).
   - `attract`: nudge points toward a target pose (`pose.ts`) so the arm wanders gracefully instead of flopping like a rope.
   - `collideFloor`: keep it above the sea floor, with friction.
4. **From points to a tube.** `geometry/tube.ts` (`TubeBuilder`) rebuilds a tapered tube in place every frame from the chain, using Catmull-Rom rings and parallel-transport frames so the skin never twists; suckers are placed on the per-ring frames. Explain taper and why the geometry is rebuilt, not skinned.
5. **Cutting.** The chain has a `count` smaller than its `capacity`: cutting a tentacle shrinks the live chain at the cut index, and the removed part becomes a `SeveredPiece` (`fx/SeveredPiece.tsx`) that keeps simulating and falls away.
6. **Swipe to cut.** Pointer events are tracked on `window` from pointer-down (a mesh `onPointerMove` stops firing once the pointer leaves the arm, so the first version never cut anything). OrbitControls is disabled during the swipe.
7. **Species with one config.** Octopus, giant Pacific, blue-ringed, moon jelly are the same rig with different numbers (`species.ts`): opacity, `noSuckers`, arm shape, tuning.
8. **Performance.** Quality switch (`quality.ts`), WebGL fallback boundary (`SceneBoundary`), the hero loads after first paint. Be honest about what is lab data vs real-device data.

**Code to quote:** `integrate` and `solveDistances` (about 40 lines together). Nothing else.
**Visuals:** a 4-panel diagram (points, segments, constraint pass, tube), the demo GIF, the jellyfish screenshot.
**Closing question:** "What would you add to make the motion feel more alive: muscle waves, curling, or something else?"

---

## 2. My to-do list is an MCP server

**Audience:** developers using Claude Code / Cursor / any MCP client. Likely the most shareable.
**Title options:** "I gave my to-do list an MCP server, and now Claude can slash my tasks" / "A small, safe MCP server in a Next.js route handler".

**Hook:** a 15-second terminal clip: "add 'buy milk' to my octopus" and a tentacle grows in the browser.

**Outline**
1. **What it does** (5 tools): `list_tasks`, `add_task`, `slash_task`, `list_octopuses`, `get_stats`. Show the `claude mcp add --transport http ...` line.
2. **The transport.** A single route handler (`src/app/api/mcp/route.ts`) with the official SDK's web-standard Streamable HTTP transport in **stateless** mode, JSON responses: no sessions, nothing to keep in memory, runs fine on serverless.
3. **Auth you can explain in a paragraph.** Personal tokens: 32 random bytes, stored as a SHA-256 hash (256 bits of entropy, so a plain hash is enough), shown once, max five, accounts only (a guest cannot sign back in to revoke one), rate limited, revocable. Constant 401 for anything else.
4. **Safety by construction.** Tools are a thin layer over the same pure rules the browser uses: every write goes through `runCommand`, which replays the command in a transaction under a per-user advisory lock. Nothing in the MCP layer can do what the game rules refuse. There is no delete tool and no account access.
5. **Dates are hard.** `due` is `YYYY-MM-DD` plus `utc_offset_minutes`; the server can't guess the player's time zone. Show `endOfDayAt` and its test.
6. **The browser catches up.** `store.sync()` quietly refreshes when you return to the tab, skipped while a save or animation is in flight and a no-op when nothing changed.
7. **Testing an MCP server.** The e2e creates an account and a token, then calls the tools with plain HTTP JSON-RPC; also asserts 401 for missing, fake and revoked tokens.
8. **What I'd do next.** OAuth for claude.ai web connectors (tokens fit Claude Code and Desktop first).

**Code to quote:** `registerTool` for `add_task` (schema + handler), the token hash function.
**Visuals:** terminal clip, the `/settings/tokens` page, a diagram: client → route → `runCommand` → Postgres.
**Closing question:** "Which tools would you want an MCP server for your own task list to expose?"

---

## 3. Rules as pure commands, replayed on the server

**Audience:** full-stack / TypeScript developers; Hacker News and dev.to.
**Title options:** "An optimistic UI that can't lie: pure commands replayed on the server" / "How I keep a game's rules in one place and run them in the browser and in Postgres".

**Hook:** "The browser applies a command instantly. The server replays the same command in a transaction to make it official. Same function, two places."

**Outline**
1. **The problem.** Instant feedback (slash a tentacle, it's gone) without trusting the client, and without writing the rules twice.
2. **The rules are a pure function:** `apply(state, command) → { state, events }` (`src/game/rules.ts`). Commands: add, edit, complete, remove. Zod schemas validate both input and the shape of commands from the browser.
3. **The client.** A Zustand store applies the command immediately, queues a commit, and on failure rolls back by reloading the saved game (`store.ts`).
4. **The server.** `runCommand`: take a per-user advisory lock, load the user's game, `apply`, write the resulting events. The browser's timestamps are replaced if they are more than 10 minutes off our clock.
5. **Why events?** The same events drive the database writes, the sounds, the octopus's speech, the achievements and the analytics counts.
6. **Where AI fits.** The model has no tools and no write access. It only returns data (suggested steps, a parsed sentence, a one-line quip), which is validated and shown for confirmation; accepted suggestions become ordinary commands. Limits: daily per-user caps in the existing rate-limit table, a kill switch, a mock for tests.
7. **Guests without accounts.** The first save creates an anonymous account; signing up links it and moves the octopuses (`moveGameToUser`).
8. **Testing.** Pure rules get fast unit tests; a small Playwright suite covers the real flows; `AI_MOCK` and `E2E_NO_RATE_LIMIT` are test-only switches.

**Code to quote:** the `apply` signature and one case, `runCommand` (about 10 lines).
**Visuals:** sequence diagram (click → store → commit → lock → apply → write), before/after of a failed save rolling back.
**Closing question:** "Where would you draw the line between what the client may decide and what the server must re-check?"

---

## Publishing checklist (each post)
- [ ] First screen has the GIF or clip, not text.
- [ ] One idea per post; cut anything that is not the title.
- [ ] Code blocks under 25 lines; link the file for the rest.
- [ ] Only claims you measured; say "lab" vs "real device" for performance.
- [ ] Live link, repo link, one specific question at the end.
- [ ] Post in the morning of your audience's time zone; reply to every comment in the first hours.
