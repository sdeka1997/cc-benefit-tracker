# Credit Card Benefit Tracker

Premium credit cards carry recurring credits — travel, dining, hotel, Global Entry — that quietly
expire if you don't use them. This tracks what's left on each one and how long you have.

The hard part isn't the tracking, it's the calendar: credits reset on different schedules, and
some reset on your **account anniversary** rather than the calendar year. A card you opened in
March has a different clock than one you opened in September.

## What it does

- **Every benefit has its own reset clock** — monthly, quarterly, semi-annual, or annual, on
  either a calendar period or an anniversary-anchored one, with custom intervals where a card
  needs them.
- **Grouped the way you'd actually ask about it** — by what expires soonest, by category, or by
  card.
- **Partial usage**, so a $300 travel credit drawn down $85 at a time shows what's actually left.
- **Prepopulated card library** so adding a card doesn't mean entering fifteen benefits by hand.
- **Annual fee tracking** against the account anniversary, alongside the benefits it pays for.
- **Lifetime savings** — what you've actually pulled out of the cards you carry.

## Built with

React + TypeScript + Vite · Firebase Auth (Google) · Firestore · deployed to GitHub Pages via
Actions

Signing in with Google persists your cards to Firestore and keeps them live across devices via
snapshot listeners; a new sign-in adopts whatever you'd already entered in the session. Benefit
templates are normalized on every load, so when a card's benefits are renamed or removed
upstream, existing user data is migrated rather than orphaned.

## Running it

```bash
npm install
npm run dev
```

The Firebase web config is checked in, so there's nothing to configure locally.
