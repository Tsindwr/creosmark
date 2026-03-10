# Sunder sheet trackers – phase 2

This bundle moves the sheet toward a genuinely playable online shell.

## Included work

### 1) Charged volatility display

`components/potentials/PotentialWidget.tsx`

- Treats `volatilityPerks` as face-value keyed (`2..max`) instead of raw node index.
- Automatically shows the Charge slot with `faBolt` on the die's maximum face when `charged` is true.
- Highlights the outer volatility arc in gold when the die is charged **and** Stress has filled the jinx threshold.
- Keeps click/long-press interactions for Stress and Resistance.

### 2) Playable overview trackers

- `MarksTracker`
- `ExperienceTracker`
- `TokenTracker`
- `ArmorProtectionTracker`

These are arranged in `OverviewSection.tsx` so the Overview tab acts like a real session dashboard.

### 3) Character sheet shell + tabs

- `SectionTabs`
- `CharacterSheetShell`
- `RollComposerFab`

This gives you a clean top-level frame that can grow into actions, abilities, inventory, background, and notes.

## Layout intent

The physical sheet places **Armor**, **Marks**, **Flavor Token**, and **EXP Tracker** in the lower middle of page 1, with the attacks box off to the right and a more body/equipment-oriented layout on page 2. This bundle follows that idea, but adapts it to a web layout by:

- stacking Marks / EXP / Tokens as quick-access cards
- giving Armor a larger, more detailed panel
- keeping tabs persistent across sections
- adding a fixed Roll button for table-speed actions

## Suggested next step

Once this is in place, the most valuable next build is:

1. `AttacksPanel`
2. `GoalsPanel`
3. `KnacksDomainsPanel`
4. `AbilitiesBrowser`

That gets you from “playable status dashboard” to “I can actually run a full turn from this page.”
