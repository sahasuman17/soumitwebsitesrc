# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on port 3000 (0.0.0.0)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # Type-check only (tsc --noEmit) — no ESLint configured
npm run clean     # Remove dist/
```

There is no test suite configured.

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Vite exposes them as `import.meta.env.VITE_*`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_DATABASE_ID
VITE_GEMINI_API_KEY
```

## Architecture Overview

SXVOIX is a digital library platform with AI assistance and a gamification/prestige system. Stack: **React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase + Google Gemini API**, deployed on Vercel.

### Routing

React Router DOM v7 handles all routing in [src/App.tsx](src/App.tsx). All routes rewrite to `/index.html` (configured in [vercel.json](vercel.json)).

### State Management

Two React Contexts drive global state:

- **[src/context/AuthContext.tsx](src/context/AuthContext.tsx)** — Firebase auth state; provides `useAuth()` hook. Admin access is gated to a hardcoded email (`soumitdbpc@gmail.com`).
- **[src/context/GamificationContext.tsx](src/context/GamificationContext.tsx)** — User stats, XP, prestige rank, daily challenges, streaks; provides `useGamification()` hook. Syncs in real-time via Firestore `onSnapshot()`.

Page components do their own data fetching with `useEffect` — no external data-fetching library.

### Firestore Data Model

```
/users/{userId}/stats/main           → UserStats (XP, prestige rank, preferences)
/users/{userId}/challenges/{date}    → UserChallengeProgress
/users/{userId}/bookmarks/{bookId}   → Bookmark records
/users/{userId}/progress/{bookId}    → ReadingProgress (%)
/books/{bookId}                      → Book metadata + ratings subcollection
/authors/{authorId}                  → Author profiles
/challenges/{date}                   → Global daily challenge definition
```

### Gamification System

Defined in [src/constants/gamification.ts](src/constants/gamification.ts) and orchestrated via [src/services/gamificationService.ts](src/services/gamificationService.ts):

- **5 Prestige Ranks**: Initiate → Academic → Sage → Luminary → Oracle (each with XP thresholds and 3 sub-titles)
- **XP Sources**: Open book (10 XP), generate AI summary (50 XP), deep work 5 min (10 XP), daily challenges (150–300 XP)
- **Daily challenges** ([src/services/challengeService.ts](src/services/challengeService.ts)): FOCUS (30 min session), QUIZ (comprehension), EXPLORE (add a book)
- **Focus tracking** ([src/hooks/useAcademicFocus.ts](src/hooks/useAcademicFocus.ts)): 30-second heartbeat checks window focus; syncs XP every 5 minutes

### AI Integration

[src/lib/gemini.ts](src/lib/gemini.ts) wraps the Google Gemini API (`@google/genai`). Used for:
- Book summaries in [src/components/PDFViewer.tsx](src/components/PDFViewer.tsx)
- Genre suggestions in the Admin panel
- "Aura Intelligence" chatbot ([src/components/Chatbot.tsx](src/components/Chatbot.tsx)) — fixed bottom-right panel

The app degrades gracefully if `VITE_GEMINI_API_KEY` is missing.

### UI Conventions

- **Dark theme** by default ("midnight"), with "parchment" and "daylight" alternatives; stored in `localStorage`, applied as a body class
- **Glass-morphism**: `.glass` and `.glass-card` utility classes (backdrop blur + semi-transparent)
- **Custom colors**: primary `#a855f7` (neon-purple), background `#050505` (obsidian) — defined in [src/index.css](src/index.css)
- **Animations**: Framer Motion for entrance/exit/hover effects throughout
- **Icons**: Lucide React exclusively
- **Tailwind CSS v4**: configured via `@tailwindcss/vite` plugin — no separate `tailwind.config.js` required
