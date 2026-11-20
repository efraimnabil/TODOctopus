# TODOctopus v2 — Rebuild Plan

The idea stays the same: your tasks are an octopus's tentacles, finishing a task cuts a tentacle off, and cutting the last one kills the octopus.
What changes: a living 3D octopus instead of SVG images, our own backend inside the app (Next.js), and no forced sign-up.

---

## 1. Key decisions (defaults — override any of them)

| Topic | Decision | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript** | 16.x is the Active LTS line; frontend and backend in one repo |
| 3D | **React Three Fiber v9 + drei + @react-three/postprocessing** | R3F v9 is the line that pairs with React 19 |
| Octopus model | **Procedural, in code** (not a downloaded/AI model) | Tentacle count changes 1–8, each tentacle is tied to one task, must be clickable, and must be cut at any point. AI generators (Meshy/Tripo) auto-rig only humanoids/quadrupeds, so they can't rig tentacles. A bought rigged GLB (~$10 on CGTrader) is the fallback for the head only |
| Art style | **Stylized-realistic** (Pixar-like: soft skin, glossy, expressive eyes) in the old pink→orange brand colors | Photoreal + procedural looks uncanny; stylized reads as "alive" and stays on-brand |
| Cutting | **Verlet chain per tentacle**; cutting = releasing the lower part of the chain as its own falling, wriggling piece | No mesh-slicing library or physics engine needed, since we always cut along the tentacle's spine |
| Database | **Neon Postgres + Drizzle ORM** | Small, serverless-friendly, Neon MCP is already connected here |
| Auth | **Better Auth**: email/password (+ Google later) + **anonymous plugin** | Guests get an invisible anonymous account; when they sign up, `onLinkAccount` moves their octopuses to the real account. One data path for everyone |
| Validation | zod | Shared between forms and server actions |
| Hosting | Vercel (Vercel MCP is connected) | Replaces the two Render deployments |
| Old code | Tag `v1-legacy`, rebuild on branch `v2`, Vite app removed from the tree | History stays in git; nothing to maintain twice |

Kept from v1: brand gradient `#FF00C2 → #FF4D00`, fonts (Sunshiney for the logo, Source Serif Pro for text), the copy, the 3-level priority (1 low / 2 medium / 3 high).

---

## 2. Game rules (fixes v1's "octopus = page of 8" problem)

In v1 an octopus was just a pagination page, so tasks moved between octopuses whenever you added, deleted or sorted. In v2 an octopus is a real record.

- **Octopus**: has up to 8 tentacle slots, a random name and an appearance `seed` (hue shift, size, eye style).
- **Add a task** → it grows as a tentacle on the oldest living octopus that has a free slot. No free slot anywhere → a new octopus spawns. A task never moves to another octopus.
- **Complete a task** → the tentacle is **cut** (it stays in history as done; the slot becomes a stump and is not reused).
- **Delete a task** (a mistake) → the tentacle **retracts** (no kill credit; the slot is freed).
- **Kill rule**: an octopus dies when it has ≥1 tentacle and every tentacle it has is cut. *(Alternative to consider: only allow the kill once it has all 8 tentacles.)*
- **Stats**: octopuses killed, tasks finished, current streak (days with ≥1 cut).

### Data model (Drizzle)

```
octopus   id, user_id, name, seed, status('alive'|'defeated'), created_at, defeated_at
tentacle  id, octopus_id, user_id, slot(0-7), title, description, priority(1-3),
          status('open'|'done'|'removed'), created_at, completed_at
          unique(octopus_id, slot) where status <> 'removed'
+ Better Auth tables (user, session, account, verification) with isAnonymous on user
```

Slot assignment runs in one transaction so two quick adds can't take the same slot.

---

## 3. 3D approach in detail

**Octopus parts**
- *Mantle (head)*: subdivided sphere deformed in a vertex shader (breathing, squash/stretch on reactions). `MeshPhysicalMaterial` with clearcoat + sheen + a fake-subsurface rim light so the skin looks wet and soft.
- *Eyes*: two eyeball meshes with pupils that follow the cursor, blink at random, and squint when hurt.
- *Tentacles*: each one is a chain of ~24 points simulated with Verlet + constraints, anchored at the mantle. Idle motion comes from curl noise (slow curling, waving). The skin is a tapered tube rebuilt from the chain every frame (or a bone chain on a `SkinnedMesh` if performance needs it). Suckers are instanced meshes along the underside.
- *Task label*: an HTML label (drei `<Html>`) near each tentacle tip; hover lifts the tentacle, click opens the task.

**Cut animation** (starts instantly; the server call runs in the background)
1. A slash trail across the tentacle, with a short hit-stop (~80 ms) and a small camera shake.
2. The chain splits at the cut point. The lower piece becomes its own Verlet chain with gravity, wriggles, drops to the sea floor, then dissolves (noise-dissolve shader).
3. Ink burst (particles) + a few bubbles from the stump; the stump curls up and closes.
4. The octopus flinches: eyes squint, the mantle squashes, the other tentacles pull in for a moment.

**Death animation**: the last cut → the octopus deflates, releases a big ink cloud, and sinks or floats away. Then a "Octopus defeated" card appears and it goes to the trophy room.

**Scene**: underwater: depth fog, animated caustics on the floor, god rays, floating plankton/bubbles, bloom + vignette + light depth of field.

**Performance and fallbacks**
- The 3D canvas is loaded client-side only (`dynamic(..., { ssr: false })`), with a 2D poster while it loads.
- Quality tiers via drei `PerformanceMonitor` / `AdaptiveDpr` (fewer chain points, no DoF and lower DPR on weak devices).
- Target: 60 fps on a mid laptop, ≥30 fps on a mid phone.
- `prefers-reduced-motion` → simple fades instead of slashes and shakes.
- All task actions also exist in a normal HTML list (keyboard and screen reader friendly). The 3D view displays the tasks; the list is where you edit them.

**Reference**: "How to make an octopus giggle" (three.js forum) built an octopus with three.js's `CCDIKSolver`. The Codevember 2016 tentacles fed Perlin-noise points into a `TubeGeometry`. Alan Zucconi's IK-for-tentacles series covers the IK side.

---

## 4. Phases

Each phase ends with something you can open and try. Phase 1 comes early on purpose: the 3D octopus is the riskiest and most important part, so we prove it before building around it.

### Phase 0 — Foundation
- Tag `v1-legacy`, create branch `v2`, replace the Vite app with a new Next.js 16 app (TypeScript, Tailwind, ESLint, Vitest).
- Brand tokens (colors, fonts), base layout, favicon from the old `icon.png`.
- Vercel project with preview deploys on every push; CI runs lint + typecheck + tests.
- **Done when:** an empty, branded app deploys to a Vercel preview URL.

### Phase 1 — The living octopus (3D prototype)
- `/lab` page with debug sliders (Leva): add a tentacle, cut a tentacle, kill.
- Mantle, eyes, 1–8 Verlet tentacles with idle motion, cursor-following eyes.
- Cut animation (slash, severed piece, ink, flinch) and the death animation.
- Underwater scene + postprocessing + quality tiers.
- **Done when:** you can play with it in the browser, it feels alive, and it runs smoothly on your laptop and phone. **Checkpoint: you review the look and feel before Phase 2.**

### Phase 2 — Game rules + task UI (still no backend)
- Pure TypeScript game module (`game/rules.ts`): spawn, slot assignment, cut, retract, kill, stats. Fully unit-tested.
- Task panel: add / edit / complete / delete, priority, description; selecting a task highlights its tentacle and the reverse.
- Several octopuses: switch between living octopuses (swipe / arrows); a new one spawns when all are full.
- Data lives in an in-memory store (zustand) behind a repository interface, so Phase 3 only swaps the storage.
- **Done when:** the whole game loop works in one browser tab.
- *Built:* the game is at `/play`. Rules are in `game/rules.ts` and are commands that carry their own ids and timestamps, so the server can replay them in Phase 3. The store is `game/store.ts`. For now the repository saves to `localStorage`, so a refresh keeps your octopuses. Swipe between octopuses is left for Phase 4, together with swipe-to-cut; for now you switch with the arrow buttons, the dots or the ← → keys.

### Phase 3 — Backend + accounts
- Neon database (dev branch + prod), Drizzle schema and migrations.
- Server actions for every task/octopus operation, zod validation, ownership checks, transactional slot assignment.
- Better Auth: email/password, sessions, anonymous plugin.
- **Guest flow:** the first time someone adds a task, they silently get an anonymous session, and their octopuses are saved on the server under it. "Save your progress" → sign up → `onLinkAccount` moves their data inside one transaction → the anonymous user is deleted.
- Optimistic UI (`useOptimistic`): animations never wait for the network; a failed save rolls back with a toast.
- Rate limiting on auth + writes; a Vercel cron job removes anonymous users inactive for 90 days.
- **Done when:** a guest can play, refresh and still have their octopuses, then sign up and keep everything; a logged-in user sees the same data on another device.
- *Built:*
  - **Database:** Neon project `todoctopus`. Its `main` branch serves production and its `dev` branch serves local dev and Vercel previews. Migrations live in `drizzle/` and you run them with `pnpm db:migrate`.
  - **Saving:** the server action `commitCommand` replays each game command with the same rules, inside a transaction holding a per-user advisory lock. A unique index on (octopus, slot) for every task that isn't removed guards against two tasks taking the same slot.
  - **Rate limits:** Better Auth's limiter keeps its counts in the database, and game writes are capped at 120 per minute per user.
  - **Cleanup:** the daily cron `/api/cron/cleanup` deletes guests idle for 90 days.
  - **Not built yet:** email verification and password reset, which need an email provider, and Google sign-in.

### Phase 4 — The full experience
- Landing page with a live 3D octopus hero ("Let's start" drops you straight into the game, no sign-up).
- First-run onboarding: "Add your first task — watch the octopus grow a tentacle."
- Trophy room: defeated octopuses (name, date, tasks they held), kill counter, streak.
- Sound (slash, squish, ink, death; mute toggle), haptics on mobile, swipe across a tentacle to cut it.
- Sort/filter in the list (priority, newest); About page ported from v1.
- **Done when:** a new visitor understands the game in under 10 seconds without reading anything.

### Phase 5 — Polish + launch
- Performance pass on low-end devices, loading states, error boundaries.
- Accessibility pass (keyboard, focus, contrast, reduced motion).
- Playwright end-to-end tests: guest flow, sign-up migration, cut → kill.
- SEO + Open Graph image (a rendered octopus), error tracking, basic analytics.
- Production deploy on Vercel + custom domain; update the README; retire the Render deployments.
- **Done when:** v2 is live and replaces v1.

### Backlog (after launch)
- Due dates: overdue tentacles turn angry/red and the octopus inks the screen.
- Boss octopus for a big high-priority task.
- AI split: describe a big goal and Claude breaks it into up to 8 tentacles.
- PWA / offline, shared octopuses for teams, daily "octopus of the day".

---

## 5. Sources

- R3F ↔ React version pairing (v8↔18, v9↔19): https://r3f.docs.pmnd.rs/getting-started/installation
- R3F v9.5 React 19.2 compatibility: https://newreleases.io/project/npm/@react-three/fiber/release/9.5.0
- Next.js 16.3 / support policy: https://nextjs.org/blog/next-16-3.md, https://nextjs.org/support-policy
- Better Auth anonymous plugin (`onLinkAccount`): https://better-auth.com/docs/plugins/anonymous
- Anonymous-first auth with Better Auth + Postgres: https://dev.to/pawsinside/anonymous-first-auth-with-better-auth-postgres-56ck
- Meshy rigging supports humanoids & quadrupeds: https://www.meshy.ai/use-cases/3d-animation
- Rigged octopus GLBs (fallback): https://www.cgtrader.com/3d-models/animal/fish/lowpoly-animated-octopus, https://cgtrader.com/3d-models/animals/fish/animated-octopus
- Octopus with CCDIKSolver in three.js: https://discourse.threejs.org/t/how-to-make-an-octupus-giggle/40457
- Noise-driven TubeGeometry tentacles: https://clicktorelease.com/code/codevember-2016/27
- IK for tentacles: https://www.alanzucconi.com/2017/04/12/tentacles/
- Mesh cutting + Rapier (not needed for spine cuts, kept for reference): https://discourse.threejs.org/t/demo-interactive-cutting-of-pieces-off-a-mesh-three-bvh-csg-rapier3d/45404, https://github.com/dgreenheck/three-pinata
- Drizzle vs Prisma on Neon: https://neon.com/guides/prisma-drizzle-typeorm-postgres
