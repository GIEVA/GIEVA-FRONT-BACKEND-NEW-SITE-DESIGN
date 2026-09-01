# Backend API requests — marketing site → `gieva-front-backend-new-site-design`

Changes the marketing site needs from the Express/Sequelize backend and its React admin
dashboard. Each entry says what we do today, what we want, and what it unblocks, so nothing here
needs a conversation to act on.

Context the list assumes: the marketing site is **static** (`output: 'static'`, zero-JS
baseline). It fetches CMS content **at build time** and ships it as real HTML — see
`src/lib/cms.ts` for why. Nothing on this site calls the API from a browser today.

Ordered by what blocks us most — approximately. Items added after the first pass are
appended rather than slotted in, because several entries cross-reference each other by
number; a late arrival carries a **blocking** marker in its heading instead.

---

## 1. Fire a deploy webhook when content is published — **blocking**

**Today:** nothing. Publishing an article or a staff member in the dashboard changes the live
site not at all, until someone happens to push a commit.

**Want:** an outbound POST to a build hook URL (env var, e.g. `SITE_DEPLOY_HOOK_URL`) after any
successful publish / unpublish / delete on the content types the marketing site reads —
currently `Article`, `Staff`, `Faq`, `HistoryPage` and `Program`. Fire-and-forget; a failed hook
must not fail the admin request.

**Unblocks:** the entire CMS integration. Everything else here is a refinement; this is the
difference between the CMS being real and being theoretical.

---

## 2. `POST /api/public/articles/:id/view` — stop `GET` mutating

**Today:** `GET /api/public/articles/slug/:slug` increments and saves `views` on every request
(`publicArticle.controller.js`). Our build calls it once per article per build, so every deploy
inflates the counts — and so does every crawler, link prefetch and preview bot, independent of
us.

**Want:** move the increment to its own `POST /articles/:id/view`. A GET should not mutate.

**Unblocks:** trusting `views` enough to surface it in the UI. Until then we treat the number as
unreliable and don't display it.

---

## 3. A `site` column on `Article` — brand filtering is currently fuzzy

**Today:** both brands share one article pool, and we slice it by tag — `?tag=ngo` /
`?tag=consultancy`, matched server-side with `LIKE '%ngo%'`. So a tag like `ngo-partnerships`
also matches `ngo`. `category` is deliberately _not_ the discriminator: `/articles/:id/related`
matches on category, so overloading it would turn "related articles" into "same-brand articles"
and leave the topic taxonomy nowhere to live.

**Want:** an explicit `site` enum (`consultancy` | `ngo` | `both`) on `Article`, a matching
dropdown in `CreateArticle.jsx` / `EditArticle.jsx`, and a `?site=` filter on the list endpoint.

**Unblocks:** correctness. One place changes on our side (`BRAND_QUERY` in `src/lib/articles.ts`).

---

## 4. Brand-constrain `GET /api/public/articles/:id/related`

**Today:** it matches on category or first tag with no brand constraint, so on a shared pool it
will happily surface Consultancy posts under an NGO article. We don't call it — related posts are
computed client-side in `relatedArticles()` instead.

**Want:** accept the same `site`/brand filter as #3.

**Unblocks:** deleting our workaround and getting the API's better matching for free.

---

## 5. A `site` column on `Staff` and `Program` — same problem, not yet urgent

**Today:** neither model has a brand field. Only Consultancy has a `/team` page, so every
published member renders there; only NGO has programme pages, so every published programme
renders there. Both work today by accident of which brand happens to own the surface.

**Want:** the same `site` enum as #3, whenever the mirror-image page appears (an NGO team page, a
Consultancy programme page). Not before — flagging it now only so it lands in the same migration
if #3 is being done anyway. One place changes on our side per model: `getStaff()` in
`src/lib/staff.ts` and `fetchPrograms()` in `src/lib/programs.ts`.

---

## 6. `description` (and `placement`) on `Partner`

**Today:** `Partner` is `{name, logoUrl, href, external, order}` — exactly the shape of the
homepage logo marquee. But the page that actually wants CMS-managed partners is `/partners`: 24
organisations, each with a description paragraph. The model can't back it.

**Want:** a `description` TEXT column, plus a `placement` enum (`marquee` | `directory` | `both`)
so one record can drive both surfaces without the marquee inheriting 24 entries.

**Unblocks:** `/partners` and `/ngo/partners` becoming CMS-driven. (The marquee itself is
deliberately _not_ a priority — its logos are local optimised assets with per-logo crop metadata
and curated alt text, which a URL column would lose.)

---

## 7. Add the marketing domain to the CORS allowlist

**Today:** `backend/middleware/corsConfig.js` allows `localhost:3000/3001/5173` and
`https://gieva-front-backend-new-site-design.vercel.app`, plus whatever `CORS_ORIGINS` adds.

**Want:** the marketing site's production and preview origins in `CORS_ORIGINS`.

**Note:** still not blocking the newsletter endpoint in #13, and it is worth being precise about
why. A native `<form method="post">` submission is a top-level navigation, not an XHR — the
browser sends it regardless of CORS and never reads the response, so the zero-JS baseline needs
no allowlist entry at all. CORS becomes necessary only when a page `fetch`es the API from script:
the progressive enhancement on top of #13, or any future in-page form. Our build-time fetches are
server-to-server and send no `Origin`, so they take the `if (!origin) return callback(null, true)`
path today.

---

## 8. Rate-limit and spam-protect `POST /api/contact`

**Today:** no rate limiting, no captcha, no honeypot. Fine while nothing links to it.

**Want:** per-IP rate limiting and a bot check before the marketing site's contact form points at
it. A public marketing site with real traffic is a different exposure profile from an admin
dashboard.

**Related, now decided:** that open question — a static site can't process its own form POST —
was resolved for the newsletter in #13, and the same answer applies here. The form posts directly
to the API and the API replies `303 See Other` to a static thank-you page, so the baseline works
with JS off and no serverless shim is needed. If `POST /api/contact` is ever wired to the
marketing site's contact form, copy that shape rather than re-deciding it.

---

## 9. `HistoryPage`'s timeline and sidebar have nowhere to render — **product decision, not a bug**

**Today:** `/about` consumes exactly two of `HistoryPage`'s fields — `introTitle` and
`introParagraphs` — and ignores the rest. That is a deliberate call (2026-08-15), recorded here
so nobody reads it as an oversight and "fixes" it.

**Why:** `HistoryPage` models a standalone _Our History_ page — hero + breadcrumb, an intro
column beside a sidebar card, then a year-by-year timeline. That is exactly how the backend
repo's own React app renders it, at its own `/history` route
(`frontend/src/pages/history/History.jsx`). The marketing site has no such route and Figma has
no such frame, and `/about` (node 8181:8314) is a different page: photo hero, "Our Story",
Vision/Mision, Core Values. Only the intro group overlaps.

**Consequence the client should know about:** the **six timeline entries and the whole sidebar
are authored but unpublished** — nothing on the marketing site surfaces them. Also unused:
`heroBreadcrumb` (the design has no breadcrumbs anywhere) and `introEyebrow`. `heroTitle` is
deliberately _not_ bound to `/about`'s h1: it is `allowNull: false` with
`defaultValue: "Our History"`, so binding it would silently retitle the page from "Who We Are"
the first time anyone saved the form.

**Want:** a decision, not a code change — either commission an `/about/history` page (in which
case `src/lib/history.ts` already has the row and only its interface widens), or accept the
timeline as dashboard-only. Nothing is blocked either way.

**Related:** `/about`'s four stat tiles, Vision/Mision and five Core Values have no source field
in any model, so they remain hard-coded. Worth knowing if the client expects to edit them.

---

## 10. `introParagraphs` is plain text, so the design's bold lead run can't round-trip

**Today:** `introParagraphs` is a `DataTypes.JSON` array of plain strings. `/about`'s first
story paragraph opens with the organisation's full name in bold — a confirmed design decision
(node 8183:8839's `characterStyleOverrides` marks exactly those 58 characters). Plain strings
carry no per-run styling, so the CMS cannot express it.

**Workaround in place:** `splitLeadBold` in `src/lib/history.ts` re-applies the bold, but only
when a paragraph literally starts with `"Global Integrated Education Volunteers Association
(GIEVA)"`. Rewrite that opening sentence in the dashboard and the paragraph renders plain —
deliberately, so the bold never lands on the wrong words.

**Want:** either rich text for `introParagraphs`, or an explicit `introLeadBold` column. Either
one deletes that function and its constant.

**Second, smaller note:** the design draws **two** story paragraphs; the CMS's current content
has **four**. `/about` renders however many are published rather than truncating, and
`.about-story__paragraphs` is a two-column grid — so an even count fills cleanly and an odd one
leaves the last cell empty (the same shape Core Values already ships with its five items). Not a
defect, just the thing to look at before the client signs off on the live content.

---

## 11. `Program.sections` has nowhere to render — **product decision, not a bug**

**Today:** NGO Home's card grid and `/ngo/program`'s detail sections consume five of `Program`'s
fields — `title`, `slug`, `tagline`, `description`, `heroImageUrl` — and ignore `sections`
entirely. Deliberate (2026-08-15), recorded here so nobody reads it as an oversight.

**Why:** `sections` is the bulk of the dashboard's Programs form — `AdminPrograms.jsx` calls it
"Sub-sections / Clubs" and stores `{ id, name, description, imageUrl }` per entry, suggesting
"STEM Club" / "WASH Club". Neither NGO frame draws anything of the kind: Home's card is a title, a
rule, one blurb and a link (node 7403:5261), and a detail section is a photo beside a heading, one
paragraph and a button (node 7463:5838). The screen shaped for `sections` is a per-programme page,
which is exactly what the backend repo's own React app renders at its `/programs/:slug` route
(`frontend/src/pages/ProgramDetail.jsx`) — and the marketing site has no such route, and Figma no
such frame (the file holds five NGO frames).

**Consequence the client should know about:** any sub-section authored in the dashboard is
**published but invisible**. Also unconsumed: `category` (no chip, filter or grouping exists on
either page) and `heroImageCloudinaryId`.

**Want:** a decision, not a code change — either commission a `/ngo/program/[slug]` page (in which
case `GET /api/programs/all/:slug` already backs it and `src/lib/programs.ts` only widens its
interface), or accept sub-sections as dashboard-only. Nothing is blocked either way.

**Related, smaller:** `heroImageUrl` has no companion alt-text column, so programme photos ship
with `alt=""`. Defensible today — the heading immediately beside the photo names the programme, so
a filled-in `alt` would repeat it — but if these become real photographs of real activities rather
than a placeholder, they carry information a caption field would need to describe.

---

## 12. `Program.title` has to be two different strings at once

**Today:** the design writes a programme's name twice, differently. Home's card shows the bare
acronym at display size ("STEP", node 5990:3672); `/ngo/program`'s heading spells it out
("Strategic Transformative Education Program (STEP)", node 7447:6027). `Program` has one `title`,
and both surfaces now read it, so whichever form the author types appears in both places.

**How we resolved it:** `title` is treated as the short form, matching `AdminPrograms.jsx`'s own
placeholder ("e.g. CHOICES") and the backend repo's React app, which renders `title` as the
heading and `tagline` as a one-line secondary in both `ProgramDetail.jsx` and `OurPrograms.jsx`.
The cost is that the detail heading loses the parenthetical expansion the design draws. We did
**not** compose it from `tagline` + `title`: `tagline` is the Home card's blurb, and stitching a
heading out of a field authored for something else would put words on the page nobody wrote.

**Want:** a `fullName` (or `longTitle`) column, shown on the detail heading while `title` stays the
acronym on the card. One projection changes in `src/lib/programs.ts`.

---

## 13. `POST /api/newsletter/subscribe` — the footer form does nothing today — **blocking**

**Today:** the newsletter field in the site footer (`src/components/SiteFooter.astro`, on all 18
routes of both sites) is a real `<form>` with no `action`. Submitting it reloads the page. There
is no subscriber store, no list, and no way for an admin to mail anyone who signs up.

Worth knowing: the backend repo's own React footer
(`frontend/src/components/layout/footer/FooterNewsletter.jsx`) is in a worse state — it validates
the address, calls an optional `onSubmit` prop that is never passed, and then shows **"Thank you!
You've successfully subscribed."** regardless. That message is currently false. Whatever is built
here should replace that component's behaviour too.

**Want:** one public endpoint, plus a Brevo list behind it.

### Why Brevo, and what it means for you

GIEVA already sends through Brevo (`utils/sendMail.js`, `BREVO_API_KEY`), so the account exists —
it is just only used for transactional mail today, never for contact lists. Putting subscribers in
a Brevo **list** means the Brevo dashboard becomes the admin interface: contact lists, the
campaign composer, scheduling, templates, one-click unsubscribe, bounce and complaint handling,
consent records, open/click stats. **No admin UI needs to be built**, which was the deciding
constraint. The existing `CampaignMessage` machinery is deliberately _not_ being extended for
this — it sends per-recipient transactional mail to campaign registrants with no unsubscribe
handling, which is fine for tens of registrants and a deliverability problem for a growing list.

### The endpoint

```
POST /api/newsletter/subscribe        public, no auth
```

Accepts **both** `application/x-www-form-urlencoded` (the native form post — this is the path
that runs with JS off, and it is the one that matters) and `application/json` (for the
progressive enhancement layered on later).

| Field     | Required | Notes                                                           |
| --------- | -------- | --------------------------------------------------------------- |
| `email`   | yes      | the subscriber                                                  |
| `brand`   | no       | `consultancy` \| `ngo`, default `consultancy` — see below       |
| `source`  | no       | free string, default `footer`                                   |
| `company` | no       | **honeypot** — if non-empty, return success and do nothing else |

`brand` matters because the footer is shared by both path-prefixed sites. Without it every
subscriber looks like a Consultancy subscriber and the list can't be segmented. We send it as a
hidden input whose value is the page's own brand.

`company` is a honeypot: a hidden, `tabindex="-1"`, `autocomplete="off"` text input that a human
never sees and a naive bot fills in. It is spam protection that costs no JS. It is not a
substitute for the rate limiting in #8 — please apply `express-rate-limit` here too (it is
already in `package.json` and currently unused anywhere; something like 5 requests per IP per 15
minutes is ample for a footer signup).

### Responses

**This is the part that makes a static site work, so it's worth being exact.**

For a normal form post (no `Accept: application/json`):

| Outcome                      | Response                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| success, or honeypot tripped | `303 See Other` → `${MARKETING_SITE_URL}/newsletter/thanks/` |
| invalid or missing email     | `303 See Other` → `${MARKETING_SITE_URL}/newsletter/error/`  |

For an `Accept: application/json` request: `201 {"message": "...", "alreadySubscribed": bool}`
and `400 {"message": "..."}` respectively.

Three notes on that:

- **`303`, not `302`.** 303 forces the follow-up request to be a `GET`. This is the standard
  POST-redirect-GET shape and it stops a browser refresh from resubmitting the form.
- **The redirect target must come from `MARKETING_SITE_URL` only — never from a request field.**
  Reading a `redirect`/`next` parameter off the body would be an open redirect on a public
  unauthenticated endpoint. We do not send one and the endpoint should not accept one.
- Both target pages are static routes we own and are building now, so they will exist before the
  endpoint does.

### What it should do internally

Order matters here — it is what stops a Brevo outage from silently losing signups:

1. Validate `email`. Reject empty/malformed → error redirect.
2. If `company` (honeypot) is non-empty → return the success redirect and **stop**. Write nothing.
3. **Write the local row first.** A `NewsletterSubscriber` table (`email` unique, `brand`,
   `source`, `status`, `ipAddress`, plus `brevoSynced` / `brevoSyncedAt` / `brevoError`). Use
   `findOrCreate` on `email`; if the row exists with `status: "unsubscribed"`, flip it back to
   `subscribed`. This mirrors the `ContactMessage` pattern — `POST /api/contact` is the closest
   existing analogue and is one step simpler (no file upload).
4. **Then sync to Brevo.**
5. If Brevo fails, log the message to `brevoError`, leave `brevoSynced: false`, and **still
   return success to the visitor.** We hold the address, so it can be re-synced; showing an error
   for something already captured would just make them submit again. The `brevoSynced: false`
   rows are the retry queue — a periodic sweep in `jobs/` would be the natural home, but it is not
   needed for v1.

The local table is not a second source of truth for consent or deliverability — Brevo is
authoritative for both. It exists so a signup is never lost to a third-party outage, and so GIEVA
keeps its own record of who signed up from which site, independent of a vendor account.

### The Brevo call

Verified against Brevo's current API reference (2026-08-22), not from memory:

```
POST https://api.brevo.com/v3/contacts
api-key: <BREVO_API_KEY>          # header name is literally "api-key"
content-type: application/json

{
  "email": "someone@example.com",
  "attributes":    { "BRAND": "ngo", "SOURCE": "footer" },
  "listIds":       [ <BREVO_NEWSLETTER_LIST_ID> ],
  "updateEnabled": true
}
```

Two things that will bite otherwise:

- **`updateEnabled: true` is not optional in practice.** It defaults to `false`, and with it
  false a contact that already exists returns a 4xx conflict. Someone re-entering their address —
  which people do constantly — would look like a hard failure.
- **Attribute names must be capitalised, and `BRAND` / `SOURCE` must be created in the Brevo
  dashboard first** (Contacts → Settings → Contact attributes, type text). Attributes the account
  doesn't know about are not reliably accepted.

No new npm dependency is needed: this is one `fetch`, and Node has it globally. (`sib-api-v3-sdk`
is already installed and does have a Contacts API, but it is the legacy Sendinblue v8 package —
plain `fetch` against the documented REST endpoint is fewer moving parts either way.)

### Env vars

| Var                        | Example             | Notes                                            |
| -------------------------- | ------------------- | ------------------------------------------------ |
| `BREVO_NEWSLETTER_LIST_ID` | `7`                 | numeric list id, from the Brevo dashboard        |
| `MARKETING_SITE_URL`       | `https://gieva.org` | redirect base; no trailing slash                 |
| `BREVO_API_KEY`            | —                   | already set, already used by `utils/sendMail.js` |

If `MARKETING_SITE_URL` is unset, returning the JSON response rather than redirecting is a
sensible fallback — it keeps the endpoint testable with `curl` and in local dev.

### Double opt-in — a decision for the client, and cheaper to make now than later

The above is **single opt-in**: the address goes straight onto the list. Brevo also supports
double opt-in, where it mails a confirmation link first:

```
POST https://api.brevo.com/v3/contacts/doubleOptinConfirmation
{ "email", "includeListIds": [...], "templateId": <id>, "redirectionUrl": "..." }
```

All four fields are required, and `templateId` refers to a DOI template that has to be created in
the Brevo dashboard — so this cannot be switched on from code alone.

It is worth raising with the client before launch rather than after. Double opt-in is the
difference between a list that is safe to mail and a pile of addresses, it materially improves
deliverability, and retrofitting it means re-confirming everyone already collected. The clean way
to leave the door open is to branch on `BREVO_DOI_TEMPLATE_ID` being set: unset → the single
opt-in call above; set → the DOI call. Then enabling it is a dashboard task plus an env var,
not a code change.

**Unblocks:** the footer newsletter on all 18 routes of both sites, and an admin path to actually
send a newsletter without anyone building a UI for it.

---

## Bugs noticed in passing — unrelated to the marketing site

Found while reading the campaign/email code for #13. Neither affects us; flagging them because
they look unintentional.

1. **Scheduled campaign sends throw.** `backend/jobs/emailScheduler.js` calls
   `sendCampaignMessage(msg)` but never imports it — and `sendCampaignMessage` is an Express
   controller expecting `(req, res)`, while the job passes a Sequelize model instance. So any
   `CampaignMessage` saved with `status: "scheduled"` fails when its `scheduledAt` comes due. The
   send-now path through the controller is fine; only the cron path is affected.

2. **Default sender name is `"Domify"`.** `backend/utils/sendMail.js` falls back to
   `process.env.SMTP_FROM || "Domify"` — a name from a different project. If `SMTP_FROM` is ever
   unset in an environment, GIEVA's mail goes out branded as Domify.

---

## Endpoints we consume today

| Endpoint                              | Consumer              | Notes                                                          |
| ------------------------------------- | --------------------- | -------------------------------------------------------------- |
| `GET /api/public/articles`            | `src/lib/articles.ts` | paginated, walked to completion; excludes `content`            |
| `GET /api/public/articles/slug/:slug` | `src/lib/articles.ts` | ⚠ mutates `views` — see #2                                     |
| `GET /api/staff/all`                  | `src/lib/staff.ts`    | bare array, pre-filtered to `published`, pre-sorted by `order` |
| `GET /api/faqs/all`                   | `src/lib/faqs.ts`     | bare array; server order kept as-is; `category` unrendered     |
| `GET /api/gieva/history/our-history`  | `src/lib/history.ts`  | ⚠ only `introTitle` + `introParagraphs` — see #9 and #10       |
| `GET /api/programs/all`               | `src/lib/programs.ts` | bare array, pre-filtered/pre-sorted; `sections` unread — #11   |

## Endpoints available and unused

`GET /api/projects/all`, `GET /api/service/services`,
`GET /api/partners/all`, `POST /api/contact`,
`POST /api/consultations` + `GET /api/consultations/available-slots`.

These need no backend change to start using (except `Partner`, see #6) — they're listed so it's
clear what the marketing site may start calling next.
