# CareerCraft — Landing Page (full-stack starter)

This is the first slice of the larger CareerCraft product spec: the public
landing page, built as a real full-stack app rather than a static mock.

```
careercraft/
├── backend/     Express API + SQLite database
└── frontend/    React (Vite) landing page
```

## What's implemented

- **Landing page** — Hero (live search + AI prompt box), trust stats, feature
  showcase, category grid, success stories, FAQ accordion, and the Journey
  Rail signature scroll element.
- **Career Explorer** (`/explore`) — filter by category, difficulty, remote
  potential, and demand; free-text search; sort by rating or trending. Filters
  live in the URL (`?category=technology&difficulty=High`), so links from the
  landing page's category cards and chips land pre-filtered.
- **Career Detail** (`/careers/:slug`) — full profile page: snapshot stats,
  About, Day in the Life, skills (technical/soft/industry), education
  pathways, certifications, specializations, and a country-by-country salary
  and demand table. Four careers (AI Engineer, UX Designer, Registered Nurse,
  Product Manager) have full profiles seeded; the rest appear in the Explorer
  with core stats and a "full profile coming" note on their detail page —
  this shows how the page degrades gracefully for careers that aren't fully
  written up yet.
- **Career Match Assessment** (`/assessment`) — 8-question quiz, tag-weighted
  scoring against every career's `match_tags`, top-3 + alternatives with
  plain-English reasoning for each match.
- **Career Comparison** (`/compare`) — pick 2–3 careers from dropdowns (or
  land pre-filled via `?slugs=ai-engineer,ux-designer`), see them side by side
  across salary, demand, growth, difficulty, remote potential, education, and
  rating, plus a rule-based "what stands out" panel per career (strengths and
  tradeoffs computed by ranking each metric across the compared set).
- **Learning Roadmap** (`/careers/:slug/roadmap`) — three staged tracks
  (Beginner/Intermediate/Advanced) per career, each with milestones, resource
  links, and time estimates. Checking off a milestone updates a live progress
  bar. Progress is session-only for now (no accounts yet) — that's called out
  on the page itself and will move to the database once the Dashboard/Account
  system exists.
- **Accounts** — signup, login, and a profile page, backed by real password
  hashing (bcryptjs) and JWTs (30-day tokens in `localStorage`, sent as
  `Authorization: Bearer`). Profile supports name and a theme preference field
  (the actual dark-mode UI isn't wired up yet — the setting is stored and
  ready for it). Email verification and password-reset emails need an email
  service that isn't available in this environment, so `/api/auth/request-password-reset`
  is a stub that returns success without sending anything — swap in a real
  provider (Postmark, Resend, SES) when you have one.
- **Commit to Career + Personal Dashboard** (`/dashboard`) — from any career's
  detail page, a logged-in user can commit to it with a mission statement and
  optional target date (one active commitment per user; committing to a new
  career replaces it). The dashboard shows the mission, live roadmap
  completion %, the next 3 uncompleted milestones, and saved careers.
  Roadmap milestone checkboxes now persist to the database for logged-in
  users (session-only, as before, if logged out) — the note on the roadmap
  page reflects which mode you're in.
- **Saved careers** — a Save toggle on the Career Detail page, surfaced on
  the dashboard.
- **Career Readiness Engine** — on the Career Detail skills section, logged-in
  users can mark skills they already have. The score blends roadmap
  completion (60%) and acquired-skills ratio (40%), and surfaces strengths,
  critical missing skills, and a concrete recommended next step (the next
  incomplete roadmap milestone, when one exists). Shown on both the Career
  Detail page and the Dashboard for the committed career.
- **AI Mentor** (`/mentor`) — a persistent chat, distinct from the homepage's
  stateless quick-guidance box. Every reply is generated from the user's real
  data (committed career, roadmap %, next milestone, readiness score, weakest
  skill) rather than a generic script, and the full conversation is saved to
  the database so it's there on the next visit. It's rule-based (pattern-
  matches on things like "stuck," "interview," "resume," "next," time
  constraints) rather than a real LLM — swapping in an actual model call
  (e.g. the Anthropic API) means replacing `generateMentorReply` in
  `backend/mentor.js` with a prompt built from the same context object it
  already assembles.
- **Skill Gap Analyzer + Career Transition Engine** (`/transition`) — the
  spec lists these as two features, but they're the same operation (compare
  a set of current skills against a target career's required skills), so
  they're built as one tool with a mode switch: type your current skills
  manually, or pull them from a career you already have. Returns matched
  ("transferable") skills, missing skills sorted by importance, a match %,
  a difficulty label, a rough timeline estimate (scaled from the target's
  roadmap by how much is missing), recommended certifications, and portfolio
  suggestions drawn from the target's specializations. Works against any of
  the 8 seeded careers as a *target*; as a *source career* it only works for
  the 4 with full skill data (AI Engineer, UX Designer, Registered Nurse,
  Product Manager) and says so clearly if you pick one that isn't ready yet.
- **Opportunity Hub** (`/opportunities`) — 20 seeded opportunities across all
  11 spec types (jobs, internships, scholarships, hackathons, competitions,
  research programs, apprenticeships, bootcamps, fellowships, volunteer,
  certifications) spread across the 8 careers. Public browsing with
  type/career/remote filters, plus a "Recommended for you" section for
  logged-in users with a commitment — sorted by readiness score (below 50%
  leads with internships/bootcamps/entry points, at or above leads with
  jobs/fellowships). One click tracks an opportunity into the Application
  Tracker.
- **Application Tracker** (`/applications`) — a five-column board (Saved →
  Applied → Interviewing → Offer → Rejected). Add opportunities from the Hub
  or type in your own; change status inline, attach notes and a follow-up
  date, remove entries. Backs onto a real `applications` table per user.
- **College & Education Explorer** (`/colleges`, `/colleges/:slug`) — 6
  seeded institutions spanning all 5 spec types (Government, Private,
  International, Specialized, Online) across India, the US, and the UK, with
  real-shaped data: fees, placement %, avg package, top recruiters, campus
  highlights, and links to relevant careers. Filterable by type and country.
- **Entrance Exams** (`/exams`, `/exams/:slug`) — 4 seeded exams (JEE
  Advanced, NEET-UG, SAT, GRE) with syllabus, difficulty, prep resources,
  past trends, and a recommended strategy, each linked to the careers they
  lead toward. Linked from Career Detail's education pathways section and
  the footer.
- **Resource Library** (`/resources`) — 25 seeded resources across all 11
  spec types (YouTube channels, docs, courses, books, blogs, podcasts,
  communities, practice platforms, research papers, tools, templates),
  tagged by career, level (Beginner/Intermediate/Advanced), and cost
  (Free/Paid), with Trending and Community Favorite flags. Filterable and
  searchable; linked from the Roadmap page (pre-filtered to that career) and
  the footer.
- **Community** (`/community`, `/community/:slug`, `/community/:slug/posts/:id`)
  — 9 career-grouped communities matching the spec exactly (AI Engineering,
  Cybersecurity, Medicine, Law, Finance, Design, Business, Research,
  Government Exams), seeded with starter posts and comments from demo users.
  Logged-in users can post (Question/Experience/Resource/Review/Advice/
  Discussion) and comment; anyone can browse and read without an account.
  Moderation is intentionally light for now: a report endpoint increments a
  `report_count` for a future Admin queue to review, and authors can delete
  their own posts — a full moderation dashboard is part of the Admin slice
  below, not built yet.
- **Journey Rail** — the page's signature visual device: a scroll-linked rail
  on the right edge that steps through the platform's own ten-stage lifecycle
  (Discover → ... → Grow) as you scroll the landing page.
- A SQLite database (`better-sqlite3`) with categories, careers (core fields
  plus rich detail columns), per-country career data, trust stats, success
  stories, and FAQs.

**A note on the schema:** nested list-shaped fields on `careers` (skills,
education pathways, certifications, specializations, day-in-the-life data)
are stored as JSON text columns rather than fully normalized into separate
tables. That's a deliberate shortcut at this stage — it keeps the detail page
fast to query and easy to seed — and is easy to normalize later (e.g. a
`career_skills` table) once skills need to be queried or reused independently
(for the Skill Gap Analyzer, for instance). `career_countries` *is* a proper
table since those rows are genuinely queried/filtered on their own.

## Running it locally

You'll need Node.js 18+ installed. This environment has no network access to
install packages, so run these steps on your own machine.

**1. Backend**

```bash
cd backend
npm install
npm run seed     # creates and populates careercraft.db
npm start        # http://localhost:4000
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so just open
`http://localhost:5173`.

## API endpoints

| Method | Path                        | Purpose                              |
|--------|-----------------------------|---------------------------------------|
| GET    | `/api/categories`           | Career categories for the grid/chips  |
| GET    | `/api/stats`                | Trust-section metrics                 |
| GET    | `/api/careers`              | Explorer list, filterable + sortable  |
| GET    | `/api/careers/featured`     | Featured careers                      |
| GET    | `/api/careers/trending`     | Trending careers                      |
| GET    | `/api/careers/search?q=`    | Live search-bar suggestions           |
| GET    | `/api/careers/:slug`        | Full career detail profile            |
| GET    | `/api/careers/:slug/roadmap`| Beginner/Intermediate/Advanced roadmap (marks progress if logged in) |
| POST   | `/api/careers/:slug/roadmap/progress` | Toggle a milestone complete (auth required) |
| GET    | `/api/commit`               | Current commitment (auth required)    |
| POST   | `/api/commit`               | Commit/switch career (auth required)  |
| DELETE | `/api/commit`               | Remove commitment (auth required)     |
| GET    | `/api/saved-careers`        | List saved careers (auth required)    |
| POST   | `/api/saved-careers`        | Toggle save on a career (auth required) |
| GET    | `/api/dashboard`            | Aggregated dashboard data (auth required) |
| GET    | `/api/careers/:slug/skills/progress` | Skills marked acquired (auth required) |
| POST   | `/api/careers/:slug/skills/progress` | Toggle a skill acquired (auth required) |
| GET    | `/api/readiness/:slug`      | Readiness score for a career (auth required) |
| GET    | `/api/mentor/history`       | Full saved conversation (auth required) |
| POST   | `/api/mentor/message`       | Send a message, get a contextual reply (auth required) |
| DELETE | `/api/mentor/history`       | Clear conversation (auth required) |
| POST   | `/api/transition`           | Skill Gap / Transition analysis (public) |
| GET    | `/api/opportunities`        | Browse/filter opportunities (public)  |
| GET    | `/api/opportunities/types`  | Distinct opportunity types (public)   |
| GET    | `/api/opportunities/recommended` | Readiness-sorted picks (auth required) |
| GET    | `/api/applications`         | List tracked applications (auth required) |
| POST   | `/api/applications`         | Track an opportunity or add custom (auth required) |
| PATCH  | `/api/applications/:id`     | Update status/notes/follow-up (auth required) |
| DELETE | `/api/applications/:id`     | Remove a tracked application (auth required) |
| GET    | `/api/colleges`             | Browse/filter colleges (public)       |
| GET    | `/api/colleges/:slug`       | Full college profile (public)         |
| GET    | `/api/exams`                | List entrance exams (public)          |
| GET    | `/api/exams/:slug`          | Full exam profile (public)            |
| GET    | `/api/resources`            | Browse/filter resources (public)      |
| GET    | `/api/resources/types`      | Distinct resource types (public)      |
| GET    | `/api/communities`          | List all 9 communities (public)       |
| GET    | `/api/communities/:slug`    | Single community info (public)        |
| GET    | `/api/communities/:slug/posts` | List posts in a community (public) |
| POST   | `/api/communities/:slug/posts` | Create a post (auth required)      |
| GET    | `/api/posts/:id`            | Post + comments (public)              |
| POST   | `/api/posts/:id/comments`   | Add a comment (auth required)         |
| POST   | `/api/posts/:id/report`     | Flag a post for review (auth required) |
| DELETE | `/api/posts/:id`            | Delete your own post (auth required)  |
| GET    | `/api/careers/compare?slugs=` | Side-by-side comparison + insights  |
| GET    | `/api/assessment/questions` | Career Match Assessment quiz          |
| POST   | `/api/assessment/submit`    | Scored assessment results             |
| GET    | `/api/success-stories`      | Success story cards                   |
| GET    | `/api/faqs`                 | FAQ accordion content                 |
| POST   | `/api/ai/quick-guidance`    | Hero AI prompt box                    |
| POST   | `/api/newsletter`           | Footer/CTA email capture              |
| POST   | `/api/auth/signup`          | Create account, returns JWT           |
| POST   | `/api/auth/login`           | Log in, returns JWT                   |
| GET    | `/api/auth/me`               | Current user (requires Bearer token) |
| PATCH  | `/api/auth/profile`         | Update name/avatar/theme              |
| POST   | `/api/auth/request-password-reset` | Stub — no email service wired up |

`GET /api/careers` accepts optional query params: `category`, `difficulty`,
`remote`, `demand`, `q`, and `sort` (`rating` or `trending`).

## Next slices

Remaining from the spec: News feed, Notifications, and Admin (which would
also formalize community moderation — reviewing reported posts, removing
content, managing users). All build on this same backend and reuse
`Navbar`, `Footer`, and `frontend/src/index.css`.

## A note on this session

While adding Community this round, I found that an earlier session's schema
for `colleges` and `entrance_exams` had silently duplicated — two
`CREATE TABLE IF NOT EXISTS` blocks with different, incompatible columns.
Because SQLite's `IF NOT EXISTS` makes the second one a no-op, the seed
script and API routes (written against the newer columns) would have thrown
"no such column" errors against the older table that actually won at
runtime. Also found: a redundant, conflicting Community schema
(`community_posts`/`community_comments`) had been added on top of a
complete, already-working `communities`/`posts`/`comments` system. Both are
fixed now. Worth a quick smoke test after `npm run seed` given the size
this project has grown to — flagging this in case anything else slipped
through in earlier rounds.
