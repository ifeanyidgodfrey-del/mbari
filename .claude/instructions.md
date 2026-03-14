# M'Bari — Project Instructions

## What this is
M'Bari is the canonical data layer for African culture — a film/event scoring,
discovery, and data infrastructure platform. Consumer-facing editorial interface
+ machine-readable API for AI companies and media outlets.

Domain: mbari.art
Tagline: "Where culture lives"

## Reference prototype
The file `reference/mbari-final.jsx` is the complete working prototype built in
a single React JSX file. Every component, interaction, data structure, and design
decision is defined there. Translate it into a production Next.js codebase.
DO NOT redesign. Replicate the prototype exactly, then improve code quality.

The file `reference/MBari-Product-Spec-March-2026.docx` is the full product
specification document with 14 sections covering every feature.

## Tech stack
- Next.js 14+ (App Router) with TypeScript
- Prisma ORM with PostgreSQL
- Redis (ioredis) for score caching and pre-computed leaderboards
- NextAuth.js v5 (Google OAuth, Apple OAuth, email/password credentials)
- Tailwind CSS — but preserve the EXACT colour palette and typography from the prototype
- BullMQ for background jobs (score recalculation, YouTube polling, social scraping)
- Cloudflare R2 for image/poster storage (S3-compatible)
- Meilisearch for multilingual fuzzy search

## Design system — DO NOT DEVIATE
- Serif font: Libre Baskerville (display/headlines)
- Sans font: Source Sans 3 (body text)
- Parchment palette:
  - bg: #F5F0E4
  - parch: #FAF6ED
  - parchDark: #F0E8D4
  - ink: #1C1608
  - inkMuted: #3D3425
  - inkFaint: #8B7A5E
  - gold: #8B7040
  - goldLight: #C4A862
  - green: #2D7A3A
  - orange: #D4882A
  - red: #B83232
  - border: #D8CDB4
  - borderLight: #E8DFCC
  - navBg: #1C1608
  - navText: rgba(255,255,255,0.5)
  - white: #FFFDF7
- Film pages: vertical scroll format (max-width 480px) with double border,
  dashed margin lines (Ge'ez manuscript reference), cultural border patterns
- Homepage: NYT broadsheet grid (lead hero + sidebar) then full-width sections
- Nav: 34px dark utility strip, fixed top, minimal chrome

## Cultural border patterns (SVG generation)
Each film page generates language-specific decorative dividers based on
the film's primary language code:
- yo (Yorùbá): adire wave pattern (3 interlocking sine waves)
- ig (Igbo): uli angular zigzag lines
- ha (Hausa): arewa interlocking diamonds
- zu (Zulu): Ndebele stepped geometry
- en/default: simple zigzag
These are generated programmatically, not stored as assets.

## Four-score system
Every film has four separate visible scores — NEVER blended:
1. Critic Score — approved critics only (percentage of positive reviews)
2. All Audience Score — all signed-in users
3. Verified Audience Score — only ratings from confirmed legal viewings
4. Heat Score — social sentiment from X (Twitter) + TikTok + engagement data

## Key features (priority order)
1. Film scroll pages with language-specific cultural border patterns
2. Four-score system (Critic, All Audience, Verified Audience, Heat)
3. Verified watch system (cinema barcode, ticket upload, streaming receipt, distributor code)
4. Legal availability tracker (country-by-country with gap alerts for distributors)
5. Box office table with LIVE badge (pulsing green dot) for cinema barcode partners
6. Crew database (above-the-line + craft professionals with full profiles)
7. Live events section (concerts, theatre, festivals, book fairs with barcode support)
8. Film submission with 3-step vetting flow
9. Admin backend (editorial queue with design preservation, API dashboard, data stats)
10. Auth (Google OAuth, Apple OAuth, email/password)
11. API endpoints returning JSON-LD with schema.org markup

## Database schema
```
model Film {
  id            String   @id @default(cuid())
  slug          String   @unique
  title         String
  year          Int
  runtime       String?
  rated         String?
  tagline       String?
  synopsis      String   @db.Text
  posterUrl     String?
  backdropUrl   String?
  country       String
  genres        String[] // stored as array
  criticScore   Int?     // 0-100
  audienceScore Int?     // 0-100
  verifiedScore Int?     // 0-100
  heatScore     Int?     // 0-100
  criticCount   Int      @default(0)
  audienceCount Int      @default(0)
  verifiedCount Int      @default(0)
  boxWeekend    BigInt?  // in local currency minor units
  boxCumulative BigInt?
  boxWeek       Int?
  boxLive       Boolean  @default(false) // cinema barcode partner
  languages     FilmLanguage[]
  cast          CastMember[]
  crew          CrewCredit[]
  availability  Availability[]
  reviews       Review[]
  awards        String[]
  submissions   Submission[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Language {
  id     String @id @default(cuid())
  code   String @unique // ISO 639 or custom
  name   String
  native String? // native script name
  films  FilmLanguage[]
}

model FilmLanguage {
  id         String @id @default(cuid())
  filmId     String
  languageId String
  percentage Int    // 0-100
  film       Film     @relation(fields: [filmId], references: [id])
  language   Language @relation(fields: [languageId], references: [id])
  @@unique([filmId, languageId])
}

model CrewMember {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  bio       String?  @db.Text
  type      String   // "above" or "craft"
  roles     String[] // e.g. ["Director", "Writer"]
  awards    String[]
  available Boolean  @default(false) // for craft: "available for projects"
  credits   CrewCredit[]
  createdAt DateTime @default(now())
}

model CrewCredit {
  id           String     @id @default(cuid())
  filmId       String
  crewMemberId String
  role         String     // specific role on this film
  film         Film       @relation(fields: [filmId], references: [id])
  crewMember   CrewMember @relation(fields: [crewMemberId], references: [id])
  @@unique([filmId, crewMemberId, role])
}

model CastMember {
  id        String @id @default(cuid())
  filmId    String
  name      String
  character String?
  film      Film   @relation(fields: [filmId], references: [id])
}

model Availability {
  id          String @id @default(cuid())
  filmId      String
  countryCode String // ISO 3166 alpha-2
  platform    String // "Netflix", "Prime Video", "Showmax", etc.
  accessType  String // "sub", "rent", "free", "ticket"
  url         String?
  film        Film   @relation(fields: [filmId], references: [id])
  @@unique([filmId, countryCode, platform])
}

model User {
  id            String   @id @default(cuid())
  name          String?
  email         String   @unique
  emailVerified DateTime?
  image         String?
  role          String   @default("user") // "user", "critic", "admin"
  reviews       Review[]
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime @default(now())
}

model Review {
  id               String   @id @default(cuid())
  filmId           String
  userId           String
  score            Int      // 1-10
  comment          String?  @db.Text
  verified         Boolean  @default(false)
  verificationMethod String? // "cinema_barcode", "ticket", "streaming", "distributor_code"
  verificationProof  String? // receipt URL, barcode hash, etc.
  film             Film     @relation(fields: [filmId], references: [id])
  user             User     @relation(fields: [userId], references: [id])
  createdAt        DateTime @default(now())
  @@unique([filmId, userId])
}

model Event {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  type      String   // "CONCERT", "THEATRE", "BOOK FAIR", "MUSIC FESTIVAL", "COMEDY"
  venue     String
  city      String
  date      String   // human-readable date range
  imageUrl  String?
  live      Boolean  @default(false)
  barcode   Boolean  @default(false) // M'Bari barcode partner
  tickets   String?  // "Sold out", "On sale", "TBA", "Free entry"
  capacity  String?
  audienceScore  Int?
  verifiedScore  Int?
  createdAt DateTime @default(now())
}

model Submission {
  id          String   @id @default(cuid())
  type        String   // "film", "article", "event", "crew"
  title       String
  submitter   String
  excerpt     String?  @db.Text
  status      String   @default("pending") // "pending", "approved", "rejected"
  hasDesign   Boolean  @default(false) // original design preserved
  designNote  String?
  designHtml  String?  @db.Text // stored HTML if design is preserved
  filmId      String?
  film        Film?    @relation(fields: [filmId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// NextAuth required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

## File structure
```
mbari/
├── .claude/
│   └── instructions.md          (this file)
├── reference/
│   ├── mbari-final.jsx          (complete prototype)
│   └── MBari-Product-Spec-March-2026.docx
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  (seed with real 2024-2026 Nigerian films)
├── src/
│   ├── app/
│   │   ├── layout.tsx           (root layout with fonts, nav, global styles)
│   │   ├── page.tsx             (homepage)
│   │   ├── film/
│   │   │   └── [slug]/page.tsx  (film scroll page)
│   │   ├── crew/
│   │   │   └── [slug]/page.tsx  (crew profile)
│   │   ├── language/
│   │   │   └── [code]/page.tsx  (language page)
│   │   ├── events/
│   │   │   ├── page.tsx         (events listing)
│   │   │   └── [slug]/page.tsx  (event detail)
│   │   ├── submit/
│   │   │   └── page.tsx         (3-step submission form)
│   │   ├── admin/
│   │   │   └── page.tsx         (admin backend: queue + API dashboard)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── v1/
│   │   │       ├── films/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/
│   │   │       │       ├── route.ts
│   │   │       │       ├── scores/route.ts
│   │   │       │       └── availability/route.ts
│   │   │       ├── crew/[id]/route.ts
│   │   │       ├── boxoffice/weekly/route.ts
│   │   │       ├── heat/[id]/route.ts
│   │   │       ├── languages/[code]/films/route.ts
│   │   │       ├── events/route.ts
│   │   │       ├── verify/watch/route.ts
│   │   │       └── bulk/export/route.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── nav.tsx
│   │   ├── flip-hero.tsx
│   │   ├── sidebar-story.tsx
│   │   ├── film-card.tsx
│   │   ├── score-badge.tsx
│   │   ├── cultural-divider.tsx  (SVG pattern generator)
│   │   ├── language-bar.tsx
│   │   ├── availability-tracker.tsx
│   │   ├── verified-watch-modal.tsx
│   │   ├── auth-modal.tsx
│   │   ├── box-office-table.tsx
│   │   ├── events-grid.tsx
│   │   └── admin/
│   │       ├── submission-queue.tsx
│   │       └── api-dashboard.tsx
│   ├── lib/
│   │   ├── prisma.ts            (singleton Prisma client)
│   │   ├── auth.ts              (NextAuth config)
│   │   ├── redis.ts             (Redis connection)
│   │   ├── patterns.ts          (cultural SVG pattern generators)
│   │   ├── format.ts            (currency formatting: fmt function)
│   │   └── constants.ts         (colour palette, country codes, etc.)
│   └── types/
│       └── index.ts
├── public/
│   └── fonts/                   (self-hosted Libre Baskerville + Source Sans 3)
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

## Seed data (real films, real numbers)
The seed script must include these films with accurate data:

1. Behind the Scenes (2025) — Funke Akindele — ₦2.72B cumulative — LIVE
2. Everybody Loves Jenifa (2024) — Funke Akindele — ₦1.88B — not live
3. Onobiren: A Woman's Story (2026) — Laju Iren — ₦34M (week 1) — LIVE
4. Gingerrr (2025) — Yemi Morafa — ₦378M — not live
5. King of Boys (2018) — Kemi Adetiba — ₦245M — not live (catalogue classic)

Plus events:
- Davido: Timeless Tour Lagos — Eko Convention Centre — LIVE NOW, barcode active
- Lagos Theatre Festival — Muson Centre — barcode active
- Ake Arts & Book Festival — Abeokuta — no barcode
- Felabration 2026 — New Afrika Shrine — future
- Johannesburg International Comedy Festival — Theatre on the Square — barcode active
- Opera at Randle: Saro the Musical — J.K. Randle Centre — barcode active

## Deployment
- Docker Compose on Hetzner (or existing server at 116.203.228.127)
- Cloudflare DNS (already configured for mbari.art)
- Cloudflare R2 for images at media.mbari.art
- PostgreSQL 16 + Redis 7 in Docker
- NextAuth with Google OAuth + Apple OAuth + credentials

## API design principles
- All endpoints return JSON-LD with schema.org markup
- Every data point includes provenance (source, timestamp, confidence)
- Rate limiting: free tier 1,000/day, industry 50,000/day, enterprise unlimited
- Bulk export at /v1/bulk/export for AI training pipelines

## Important rules
- The Verified Audience Score is the most prominent score on every film page
- LIVE badge has a pulsing green dot animation (CSS keyframe: livepulse)
- Cinema barcode mention is subtle, not aggressive — one line below box office table
- Cultural border patterns are generated from language code, not stored as images
- Crew profiles distinguish "above the line" from "craft professional" with different badges
- Submissions with "has original design" flag preserve submitted HTML when published
- Heat score shows "via X · TikTok · social" as its source attribution
- AI crawlers are ALLOWED (do not block) — this is the data licensing strategy
