# Refactor Idea: Annual Fee Tracking & Account Anniversary

## The Concept
Extend the current benefit tracking to include annual fee reminders. This provides a more holistic view of a credit card's value proposition.

## Questions & Planning
- **Single vs. Dual Pickers:**
  - Most cards have an anniversary and fee post date that are very close (Account Anniversary vs. Statement Close).
  - **Decision:** Prefer a single "Account Anniversary" date picker to keep the UI clean. It acts as the "anchor" for both benefits and fees.
- **Trigger Logic:**
  - Currently, we only prompt for an anniversary date if a card has `anniversary` type benefits.
  - **Proposed Change:** Also prompt if the card has a non-zero annual fee (`annualFee > 0`).
- **Notification/UI:**
  - Show a "Fee Incoming" warning during the anniversary month.
  - Show the annual fee amount on the card tile in the management view.

## Implementation Steps
1. Add `annualFee` field to `CreditCard` and `BenefitConfiguration` types.
2. Update `prepopulatedCards.ts` with fee data for known cards.
3. Update `ProfileView.tsx` logic: `cardNeedsInfo = !card.isAnniversarySet && (hasAnniversaryBenefit || hasAnnualFee)`.
4. Add visual indicators for upcoming fees in `HeaderStats` or individual card tiles.
