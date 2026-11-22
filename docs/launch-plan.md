# TODOctopus launch plan

Goal: get the project in front of developers and make it a **personal-branding asset**: a shipped, playable, well-documented project. Money is not the goal yet (see "After launch").

Owner key: **Me** = Claude can prepare it in the repo. **You** = needs your account, your voice, or your decision.

## 0. Gate: do these before telling anyone (about 1 week)

| # | Item | Owner |
|---|---|---|
| 1 | `ANTHROPIC_API_KEY` on Vercel (Production + Preview) with a **monthly spend limit** in the Anthropic console (suggest $5). Without it the AI buttons are hidden. | You |
| 2 | Custom domain (a short, memorable one beats `todoctopus.vercel.app` in every post). Then set `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL`. | You (buy), Me (wire) |
| 3 | Error tracking (Sentry needs a DSN) so you hear about failures before users do. | You (DSN), Me (wire) |
| 4 | Performance pass on the 3D scene: Lighthouse, a mid-range Android phone, slow 4G. Three.js forum posts get "slow to load" replies; do not give them a reason. | Me |
| 5 | Re-read `/about`: it still says "a team of developers" and lists the original team. Make sure it says what you want public. | You |
| 6 | Analytics events (Vercel Analytics is on): first task added, first slash, defeat, share clicked, signup, token created. Needed to learn anything from launch day. | Me |
| 7 | Add a `LICENSE` and a short "Contributing / Issues" note so the repo looks finished. | You (license choice), Me |

## 1. Assets (week 1)

- **30-second demo video** (no voice needed): add 3 tasks, one gets split by AI, slash one by swiping, defeat the octopus, share card appears. Captions on, vertical and horizontal cut. *You record; Me: shot list and captions.*
- **README hero GIF** (the swipe-to-slash moment) plus 3 screenshots (Realistic body, Moon jelly body, trophy room). *Me*
- **One-liner and pitch**, English and Arabic. Draft: "A to-do list where every task is a tentacle of a living 3D octopus. Slash them all." *Me*
- **The MCP clip**: terminal says "add buy milk to my octopus", the tentacle grows. 15 seconds. This is the part few projects have. *You record, Me script.*
- Social card already exists (`/api/og`, `/s`); check how it unfurls on X, LinkedIn and Slack.

## 2. Content: three posts, one per angle

1. **"How I made living tentacles with Verlet chains in React Three Fiber"** (technical breakdown, GIFs). Fits the Three.js forum and dev.to.
2. **"My to-do list is an MCP server"**: tokens, the five tools, why every change goes through the same rules. Likely the most shareable in 2026 developer circles.
3. **"Rules as pure commands, replayed on the server"**: the architecture (optimistic client, transactional server, advisory lock), with the AI boundary: AI only suggests, never writes.

Each post ends with the live link and the repo. Write them in your voice; *Me: outlines, code snippets and diagrams.*

## 3. Channels: pick two and stay consistent

Sources agree that the first posts of almost everyone get little engagement; consistency matters more than one big day.

| Channel | Why | Notes |
|---|---|---|
| **LinkedIn + dev.to** | Your network and where posts 1–3 live. | Start here, no gating. |
| **Three.js forum, Showcase** | Right audience for the 3D. | Posts need moderator approval, so submit early. Showcase can be considered for the three.js homepage. |
| **Show HN** | Developers, feedback. | Must be something people can try now (guest play qualifies, no sign-up). Plain title, no hype, no asking for upvotes. Be present to answer for the first hours. |
| **Product Hunt** | Consumer reach. | Guides suggest 4–6 weeks of prep and Tuesday to Thursday launches; their ranking claims are unverified. Do it last, after you have feedback and a few real users. |

## 4. Timeline

- **Week 0–1:** gate items, analytics, performance, assets.
- **Week 2:** publish post 1 (dev.to + LinkedIn). Submit the Three.js showcase.
- **Week 3:** publish post 2 (MCP). Show HN the same week, with the MCP clip in the first comment.
- **Week 4:** post 3. Collect feedback, fix the top 3 issues, reply to every comment.
- **Week 5–6:** Product Hunt prep (gallery, maker comment written in advance, a few people who actually use it). Launch only if weeks 2–4 showed real interest.

## 5. What to measure

Set the target before launch so you can judge it honestly: visits, % who add a first task, % who slash, signups, tokens created, share clicks, AI calls per day vs the spend limit. A good first outcome is a handful of real users, useful feedback and one post that sticks, not thousands of visits.

## 6. Risks

- **AI cost or abuse:** daily per-user caps, kill switch `AI_ENABLED=0`, provider spend limit. Watch it on launch day.
- **Guest-account spam:** sign-in is rate limited (5/min); the cron removes idle guests after 90 days.
- **Slow first load on phones:** see gate item 4.
- **Negative or no feedback:** expected; answer politely, fix what is real, move on.

## 7. After launch

Only if there is traction: cosmetic "Pro" (extra bodies and skins), body-doubling / co-op octopus, focus timer tied to a tentacle, PWA push and calendar export. Do not build any of it before users ask.
