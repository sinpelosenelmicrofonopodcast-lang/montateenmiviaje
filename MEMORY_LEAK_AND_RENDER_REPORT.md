# Memory Leak and Render Report

## Audit focus
- Event listener cleanup
- Timer/interval cleanup
- Stale async responses
- Re-render hotspots

## Findings
1. **Admin snapshot fetch race risk**
- `AdminRafflePanel` could issue overlapping snapshot fetches when changing raffle selection quickly.
- Risk: stale response overriding newer state + wasted network work.

2. **Timers/listeners generally cleaned correctly**
- `raffle-countdown` interval: cleaned on unmount.
- `tombola-shell` interval + timeout refs: cleaned on unmount.
- `gallery-experience` keydown listener: cleaned correctly.

3. **Large render surfaces still present**
- `admin-raffle-panel` remains large; split-by-tab would improve rerender locality.

## Fixes applied
- Added `AbortController` flow to snapshot refresh in:
  - `components/custom/admin-raffle-panel.tsx`
- Added unmount cleanup abort to prevent stale updates.

## Impact
- Lower chance of state corruption from out-of-order responses.
- Reduced unnecessary in-flight admin API calls when switching context quickly.
