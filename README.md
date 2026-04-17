# Amanda AI — SMS Group Trip Planning MVP

AI-powered group trip decision tool that replaces chaotic group chats with a structured SMS survey.

## Tech Stack
- Next.js 14+ (App Router) on Vercel
- Supabase (PostgreSQL + Auth)
- Twilio Programmable Messaging
- Stripe Checkout
- OpenAI GPT-4o

## Features
- Admin: Magic-link auth, trip creation, Stripe checkout, participant tracking dashboard
- Participant: Opt-in page with phone validation, consent, duplicate detection
- SMS Engine: 12 sequential MCQ questions, retry logic, reminder cron, auto-abandon
- Results: OpenAI aggregation → 1-3 trip option cards

## Getting Started
```bash
npm install
cp .env.example .env.local  # fill in Supabase, Twilio, Stripe, OpenAI keys
npm run dev
```

## Project Structure
- `/src/app/` — Pages (landing, auth, dashboard, join flow)
- `/src/app/api/` — API routes (auth, trips, stripe, twilio, cron)
- `/src/lib/` — Utilities (supabase, stripe, twilio, openai)
- `/supabase/schema.sql` — DB schema with RLS policies
