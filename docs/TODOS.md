# TODOS

Project: KON
Created by /plan-ceo-review on 2026-05-23
Branch: main

This file tracks deferred work — items considered during planning that are
not in the current scope but should ship later. Each entry includes context
so the work can be picked up months from now without re-deriving the
motivation.

---

## P1 — Stage 3 candidates (post-relaunch, within 3-6 months of Stage 2)

### 1. Launch essay: "Why we removed crypto from KON's homepage"

**What:** A 1500-2000 word first-person essay arguing that decentralized
stacks are the new LAMP stack and that the crypto framing was the wrong
cultural carrier wave. Position KON as the proof of concept. Ship on the
KON blog (kon.xyz/blog), cross-post to HN / Indie Hackers / /r/selfhosted /
JP indie OSS channels.

**Why:** The relaunched homepage is a tree falling in an empty forest
without an announcement that travels. An essay-shaped launch reaches the
indie OSS and local-first communities that the new positioning targets.
The author (KON creator, ETHTokyo organizer) has unusually credible
standing for this argument — embedded in the decentralized stack scene
but stepping back to see where the framing is failing.

**Pros:** Reaches the new audience directly. Becomes a permanent artifact
on the kon.xyz blog. Can be repurposed for talks. Builds personal brand
alongside KON.

**Cons:** Time-intensive (~1 week of writing). Requires the new positioning
to be live first, so essay grounding examples are real. Risk of writing
something that pleases neither old (crypto) nor new (indie OSS) audiences.

**Context:** Originally proposed as Expansion 2 in the 2026-05-23 CEO review,
deferred so Stage 2 (positioning relaunch) doesn't depend on it. Essay
ships in Stage 3 once the homepage and Apps Wall are live and at least
one real testimonial is available to quote.

**Effort:** Human M (1 week writing + editing) / CC compresses to ~2-3 days
**Priority:** P1
**Depends on:** Stage 2 launch complete. Anchor #2 live with testimonial available.

---

### 2. Cross-app composability working demo (stamp rally)

**What:** Ship the matsuri + nearby ramen shop (or two shops) stamp rally
as a real working demo, not a paragraph. Build 3 toy "shop" KON apps + 1
matsuri app. Wire them together via shared on-chain stamp ledger. Record
a 30-second video showing a user scanning at three shops and unlocking
something at the matsuri.

**Why:** Cross-app composability is KON's single most differentiated,
structurally-incumbent-incopyable feature. Shopify, Eventbrite, and
Discord cannot ship this because their business model requires lock-in.
Right now it lives as a sentence in the concept doc. Until it lives as
a working demo, the moat is invisible.

**Pros:** The "oh, holy shit" moment of the new KON story. Becomes the
centerpiece of the launch essay and any future talk. Real exercise of
the cross-app data sharing architecture under realistic conditions.

**Cons:** High engineering effort — touches contract layer, requires
multiple apps wired together, requires careful UX design for the
attendee experience. Risk that the architecture doesn't cleanly support
cross-app reads without a custom resolver.

**Context:** Originally proposed as Expansion 4 in the 2026-05-23 CEO
review, deferred because Stage 2 should not be gated on heavy engineering.
Ships in Stage 3 alongside or shortly after the launch essay.

**Effort:** Human L (~2 weeks) / CC compresses to ~3-4 days
**Priority:** P1
**Depends on:** Stage 2 launch complete. Matsuri template at hero quality.
Two anchor shops (could be friendly local shops or controlled demo apps).

---

### 3. Japanese-language site + Japan origin story

**What:** Add a Japanese-language version of kon.xyz at kon.xyz/ja (or
language-toggle from the homepage). Add a "Why this is a Japanese project"
section that talks about matsuri culture, chōnaikai (neighborhood
associations), and the high-trust low-platform-dependency local economy
that already exists in Japan. Add "Made in Tokyo" badge in the footer.

**Why:** "Hi, my name is Yuji, and I'm from Japan" is the single most
under-leveraged sentence in the repo. Linux is Finland. Ruby is Japan.
KON is Japan and should be proud of it. The matsuri / hyperlocal wedge
IS culturally Japanese; trying to internationalize away from it dilutes
the positioning.

**Pros:** Distinct identity. Strong moat against US-centric SaaS
competitors. Opens up the Japanese indie OSS and local-organizer
audience properly (they prefer Japanese-language UX). Cultural authenticity
becomes the bigger story.

**Cons:** Translation work + content writing. Requires maintaining two
language versions going forward.

**Context:** Originally proposed as Expansion 5 in the 2026-05-23 CEO
review, deferred so Stage 2 ships in one language first. Stage 3 adds
the Japanese site once the English positioning has been validated.

**Effort:** Human M (~2-3 weeks) / CC compresses translation significantly
**Priority:** P1
**Depends on:** Stage 2 launch complete.

---

### 4. Print-ready QR poster generation per app

**What:** Every KON app gets a built-in feature: generate a print-ready
A3 PDF poster with the app's name, a big QR code linking to the app,
a one-line description, and a "made with KON" badge. Organizer prints
at conbini, sticks on lamp posts, attendees scan.

**Why:** Every matsuri organizer's deepest, dumbest problem is "how do
attendees find the app?" The KON answer needs to be ridiculously easy.
This is the real-world-to-app bridge that distinguishes KON from any
pure-digital competitor. Also generates Twitter-shareable "oh that's
clever" moments.

**Pros:** Solves a real problem. Differentiates KON from SaaS
competitors. Low engineering complexity. Generates organic word-of-mouth
when matsuri organizers post photos of their printed posters.

**Cons:** Requires designing a PDF template that looks good across all
KON apps. Minor server-side PDF generation infrastructure (or
client-side via a library).

**Context:** Originally proposed as Expansion 6 in the 2026-05-23 CEO
review, deferred because Stage 2 should ship without it. Stage 3 add-on
once matsuri template is hero-grade.

**Effort:** Human S (~2-3 days) / CC ~half day
**Priority:** P1
**Depends on:** Stage 2 launch complete. Matsuri template at hero quality.

---

## P2 — Stage 4 candidates (post-Stage 3, 6-12 months out)

### 5. Annual "KON Matsuri" event

**What:** Virtual or IRL gathering of people running KON apps. Year 1
could be 5 people on Zoom or a small Tokyo meetup. Plant the seed early.
Build the muscle. Year N could be a real conference.

**Why:** Communities form around shared rituals. The annual gathering is
the most powerful community-building primitive ever invented. Even at
small scale it creates belonging, generates testimonials, and surfaces
what users actually want next.

**Pros:** Compounds over time. Generates content (talks, videos,
recap posts). Creates anchor identity ("I went to KON Matsuri").

**Cons:** Requires sustained organizational energy beyond product work.
Probably won't be worth running until there are at least 10-20 active
KON communities.

**Context:** Mentioned but not formally proposed in the 2026-05-23 CEO
review. Worth planting as a Stage 4 idea once Stage 3 has shipped and
there's a community to gather.

**Effort:** Human variable (depends on scale) / CC mostly N/A
**Priority:** P2
**Depends on:** A real community of KON organizers (likely after Stage 3).

---

## Notes

- **Anchor #2 search is NOT in this file** because it's IN scope for the
  current plan (the highest-priority assignment from the 2026-05-23 CEO
  review). It belongs in the active plan, not in TODOs.
- All items above are "scheduled for Stages 3-4," not "abandoned." If
  Stage 3 never ships, the relaunch fades. Roadmap explicitly.
