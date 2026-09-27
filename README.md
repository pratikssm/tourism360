# Tourism360 - Project Status & Technical Overview

> Yeh root-level README hai. Application code [`FRONTEND/`](FRONTEND/) folder mein hai. Status 27 September 2026 ko repository ke source/configuration ke basis par likha gaya hai; live deployment ya production database ko yahan se verify nahi kiya gaya.

## Abhi tak kitna bana hai?

- **Functional prototype / MVP scope: lagbhag 60-65%.** Core screens, navigation, account flow, catalogue, basic data CRUD aur dashboard flows maujood hain.
- **Production readiness: lagbhag 35-40%.** Secure server-side authorization, complete database setup, real booking/payment/provider integrations, tests aur operational checks abhi baaki hain.
- Yeh engineering estimate hai, automated completion metric nahi. UI ka hona hamesha live/production integration hone ka matlab nahi hai.

## Built Features

| Area | Status | Details |
| --- | --- | --- |
| Home & discovery | Working foundation | Home page, catalogue highlights, text search, category filters aur browser-supported voice search. |
| Destinations | Working foundation | Destination list, tags, dynamic city pages, city ke listings/events. |
| Travel catalogues | Working foundation | Hotels, restaurants, attractions, activities, experiences, shopping, cinema aur events. Search/filter UI aur detail drawer hai. |
| Maps & weather | Partially integrated | OpenStreetMap embed, city geocoding aur Open-Meteo weather. Nearby picks actual distance/radius se nahi, city-name match se aate hain. |
| Authentication | Implemented with setup required | Supabase email/password signup/login, session restore, logout, signup roles, protected dashboard route. Supabase env/config aur email confirmation setup zaroori hai. |
| Roles & dashboard | UI-level workflows | Tourist, Business Owner, Tour Guide, Travel Agent, Admin aur Super Admin roles; trips, favorites, bookings, reviews, listing management aur admin views. API-side role enforcement verify/implement karna baaki hai. |
| Booking requests | Basic flow | Listing se request save hoti hai aur dashboard mein dikhti hai. Yeh confirmed reservation nahi hai; payment collect nahi hoti. |
| AI trip planner | Rule-based | Listings se day-wise itinerary banata hai; save aur `.txt` export available. LLM ya external AI model call nahi hota. |
| Recommendations | Rule-based | Interest/city text match ke basis par listing ranking. Budget preference abhi ranking ko affect nahi karti. |
| Chatbot | Rule-based | Fixed keyword-to-answer logic; chat API/LLM se connected nahi hai. |
| Safety, About, Contact, FAQ | Basic pages | Safety helplines/checklist, product info, contact form API aur FAQ. Support contact details placeholder hain. |
| UI | Implemented | Responsive React UI, light/dark theme, English/Hindi labels, toast messages, loading/empty states, icons and motion. |

## Routes

`App.tsx` mein 26 named routes aur ek catch-all route (total **27 route patterns**) hain:

`/`, `/explore`, `/destinations`, `/destinations/:slug`, `/hotels`, `/restaurants`, `/attractions`, `/activities`, `/experiences`, `/shopping`, `/cinema`, `/events`, `/transport`, `/maps`, `/planner`, `/recommendations`, `/chatbot`, `/safety`, `/about`, `/contact`, `/help`, `/login`, `/register`, `/dashboard`, `/unauthorized`, `/server-error`, `*`.

Dashboard ke andar role ke hisaab se Trips, Favorites, Bookings, Reviews, Manage aur Users tabs dikhte hain.

## API Inventory

### Application backend

`FRONTEND/api/` mein **9 resource endpoints** hain. Vercel function URLs `/api/<resource>` format mein hain; code `/api/v1` use nahi karta.

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/destinations` | GET, POST, PUT, DELETE | Destination search/read aur management |
| `/api/listings` | GET, POST, PUT, DELETE | Category/city/destination filtering aur listing management |
| `/api/events` | GET, POST, PUT, DELETE | Events read aur management |
| `/api/trips` | GET, POST, PUT, DELETE | Saved itineraries |
| `/api/bookings` | GET, POST, PUT, DELETE | Booking requests/status |
| `/api/reviews` | GET, POST, PUT, DELETE | Reviews |
| `/api/favorites` | GET, POST, DELETE | Favorite items |
| `/api/profiles` | GET, POST, PUT | User profile records |
| `/api/contacts` | GET, POST | Contact form submissions/admin inbox |

In 9 routes mein **6 full CRUD** hain (destinations, listings, events, trips, bookings, reviews). Favorites mein delete hai par update nahi; profiles mein delete nahi; contacts mein update/delete nahi. Frontend service layer (`src/lib/api.ts`) in routes ke liye 26 helper methods expose karti hai. `db-client.js` aur `db-wake.js` internal helpers hain, public resource endpoints nahi.

### External services / APIs

- **Supabase:** Auth aur PostgreSQL data access. Vercel API functions server-side Supabase client use karti hain; local development fallback browser se Supabase access karta hai.
- **Open-Meteo:** 2 live HTTP APIs: Geocoding `/v1/search` aur Forecast `/v1/forecast`. API key nahi chahiye.
- **OpenStreetMap:** Map iframe/embed. Yeh full map SDK ya nearby places API integration nahi hai.
- **DesignArena instrumentation:** `FRONTEND/index.html` mein page-view POST aur `rrweb` session-recording CDN script present hai. Deployment se pehle confirm karein ki yeh intentional hai; privacy/consent review zaroori hai.
- **Static assets:** Unsplash images aur Google Fonts (`Poppins`) external hosts se load hote hain.

Google OAuth client-related environment values [`FRONTEND/vercel.json`](FRONTEND/vercel.json) mein hain, lekin current auth implementation email/password Supabase flow chalati hai; Google sign-in feature code mein nazar nahi aaya.

## Technology Stack

- **Frontend:** React 19, TypeScript 5.9, Vite 7, React Router 7.
- **Styling/UI:** Tailwind CSS 4 (`@tailwindcss/vite`), custom CSS, Lucide React icons, Framer Motion.
- **Backend:** Vercel-style serverless API functions in JavaScript; fetch-based frontend service layer.
- **Database & auth:** Supabase JS client, Supabase Auth, PostgreSQL.
- **Live data:** Open-Meteo geocoding/weather; OpenStreetMap embed.
- **Quality/build tools:** ESLint 9, TypeScript project build, Vite production build.
- **Node/npm:** `FRONTEND/package.json` scripts ke through development, build, lint aur preview.

MongoDB, payment gateway, live airline/rail/cab APIs ya LLM provider ka runtime integration is codebase mein nahi mila. About page mein MongoDB/aggregator ka zikr roadmap-style text hai, implemented stack nahi.

## Kya missing hai / Production se pehle

### High priority: security & data integrity

- Server API handlers par authenticated user/JWT verification aur har operation par server-side ownership/role checks implement/verify karein. Abhi handlers privileged Supabase secret client use karte hain aur source mein request-level authorization nazar nahi aata; browser/dashboard role checks akelay security boundary nahi hain.
- Production CORS ko `*` se restrict karein; input validation, rate limiting, abuse protection aur safe error responses add karein.
- Schema constraints, indexes, foreign keys, Row Level Security policies aur complete SQL migrations document karein. Current checked-in migration sirf signup par profile row create/update karne ka trigger banati hai.
- API mein user identity ke liye email bhejne par bharosa karne ke bajay verified auth identity se owner derive karein.

### Product integrations

- Payments/refunds aur actual supplier booking, confirmation, cancellation/availability workflows.
- Hotels ke live rates/availability; cinema showtimes/seats; flight, train/PNR, bus, cab aur ferry provider integrations.
- Real AI provider for itinerary/recommendations/chat, with cost, safety and failure handling.
- Nearby search ko geospatial distance, proper map provider/places data aur location permissions ke saath implement karein.
- Password reset, email verification UX, optional social login (Google env values alone se login active nahi hota).
- Partner-owned inventory scoping/editing, review moderation, admin actions/audit trail, notifications and contact response workflow.

### Reliability & release readiness

- `package.json` mein test script nahi hai; unit/integration/e2e tests aur API authorization tests add karein.
- Pagination, server-side search, empty/error retry states aur larger catalogue performance harden karein.
- Supabase schema/seed-data setup, deploy/environment instructions aur backup/monitoring steps complete karein.
- `.env` values aur public browser variables ko review karein; privileged secret sirf server environment mein rahe. Public publishable key secret nahi hoti, lekin production policies phir bhi zaroori hain.
- `index.html` instrumentation ko approve/remove karein aur privacy disclosure/consent behavior confirm karein.

## Local Setup

Project folder mein jaakar:

```powershell
cd FRONTEND
npm ci
```

`FRONTEND/.env.example` ke names ke mutabik local `.env.local` set karein. Browser ke liye `VITE_SUPABASE_URL` aur `VITE_SUPABASE_PUBLISHABLE_KEY`; server APIs ke liye `SUPABASE_URL` aur server-only `SUPABASE_SECRET_KEY` chahiye. Secret ko `VITE_` prefix na dein aur commit na karein.

```powershell
npm run dev
npm run build
npm run lint
```

`npm run dev` Vite UI chalata hai. Serverless API functions ke saath local development ke liye Vercel environment configure/pull karke `npm run dev:vercel` use karein. Auth ke liye Supabase email/password enable karein. Signup profile trigger apply karne ke liye [`FRONTEND/supabase/migrations/20260926_create_profile_on_signup.sql`](FRONTEND/supabase/migrations/20260926_create_profile_on_signup.sql) Supabase SQL Editor mein run karein. Baaki tables/schema ka complete migration abhi repo mein documented nahi hai.

### Current checks

- `npm run build`: pass; Vite ne 500 KB se bade JavaScript chunk ka warning diya.
- `npm run lint`: fail; current source mein 11 errors aur 3 warnings hain, mainly React Hooks/Fast Refresh rules aur `vite.config.ts` lint rules. Yeh README change in source files ko modify nahi karta.

## Useful Files

- App routes/providers: [`FRONTEND/src/App.tsx`](FRONTEND/src/App.tsx)
- API client + local fallback: [`FRONTEND/src/lib/api.ts`](FRONTEND/src/lib/api.ts)
- AI rule engine: [`FRONTEND/src/lib/ai.ts`](FRONTEND/src/lib/ai.ts)
- Weather/geocoding: [`FRONTEND/src/lib/weather.ts`](FRONTEND/src/lib/weather.ts)
- Supabase client: [`FRONTEND/src/lib/supabase.ts`](FRONTEND/src/lib/supabase.ts)
- Existing frontend setup notes: [`FRONTEND/README.md`](FRONTEND/README.md)