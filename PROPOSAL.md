# Proposal: SMS-Based Group Trip Planning MVP (Amanda AI)

## Project Overview

Amanda AI is a group trip decision tool that replaces chaotic group chats with a structured SMS survey. The MVP collects, aggregates, and presents trip planning data — it does not book anything.

## Technical Architecture

### Tech Stack
- **Frontend:** Next.js 14+ (App Router) on Vercel
- **Database:** PostgreSQL on Supabase with Row-Level Security
- **Auth:** Supabase Auth (magic link)
- **SMS:** Twilio Programmable Messaging (send/receive webhooks)
- **Payments:** Stripe Checkout (one-time fee)
- **AI:** OpenAI GPT-4o (single call per results generation)

### Core Features

**Admin Flow:**
- Magic-link authentication via Supabase
- Trip creation form → Stripe Checkout → dashboard
- Dashboard: shareable link, participant table (Not Started / In Progress / Complete / Abandoned), progress bar, "Generate Results" button, results cards

**Participant Flow:**
- Public opt-in page: name, phone, consent checkboxes (Terms + Privacy)
- Phone validation, duplicate detection per trip
- On submit: first SMS fires within 30 seconds

**SMS Engine (core logic):**
- Twilio send/receive via webhooks
- 12 sequential multiple-choice questions (golf trips)
- Participant replies with number, system validates, stores response, sends next question
- Invalid input: retry once, then skip
- Reminder cron: nudge after 24hr idle (not started) or 6hr idle (in progress), max 2 reminders
- Auto-abandon after 48hr with no response post-reminders

**Results:**
- Aggregate all responses per question (count per option)
- Send aggregation to OpenAI GPT-4o with structured prompt
- Parse JSON response → display 1–3 trip option cards on dashboard

## Milestones & Pricing

| Milestone | Deliverables | Timeline |
|-----------|--------------|----------|
| M1: Admin Auth + Trip Creation + Stripe + Dashboard Shell | Supabase Auth, trip form, Stripe Checkout, dashboard UI | Week 2 |
| M2: Participant Opt-in + Full Twilio SMS Flow | Opt-in page, phone validation, 12-question survey engine, webhooks | Week 4 |
| M3: Dashboard Live Tracking + Generate Results + OpenAI | Progress tracking, result aggregation, GPT-4o integration | Week 6 |
| M4: QA + Edge Cases + Polish | Testing, reminder cron, auto-abandon logic, final polish | Weeks 7-8 |

**Total Fixed Price: $7,500**
**Timeline: 6-8 weeks**

## Why This Architecture

1. **Supabase over Firebase** — Better PostgreSQL compatibility, RLS policies for data isolation, magic link auth out of the box
2. **Twilio webhooks** — Reliable SMS delivery with built-in retry and status callbacks
3. **Stripe Checkout** — Handles payment edge cases (3DS, refunds, disputes) so we don't have to
4. **OpenAI single call** — Cost predictable at $0.01-0.05 per results generation

## What We Deliver

- Working Next.js application deployed on Vercel
- Supabase schema with migrations
- All source code in GitHub
- Technical documentation
- QA test cases

## Not In Scope

Booking integrations, web scraping, custom question editing, multiple trip types (golf only), mobile app, payment splitting, email notifications, analytics.
