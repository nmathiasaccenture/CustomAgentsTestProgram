# Counter App

A minimal React + TypeScript counter with increment, decrement, reset, and a configurable step size. Built with Vite and tested with Vitest + React Testing Library.

This project was scaffolded by running the 6-stage [PIPELINE.md](PIPELINE.md) (plan → build → test → review → fix → docs).

## Requirements

- Node 20+ (developed on Node 25)
- npm 10+

## Getting started

```bash
npm install
npm run dev      # start the dev server (Vite)
npm run build    # type-check then production build
npm test         # run the unit test suite once
npm run test:watch  # vitest in watch mode
```

The dev server prints a local URL (typically http://localhost:5173).

## Usage

```tsx
import { Counter } from "./src/components/Counter";

// Defaults: initial = 0, step = 1
<Counter />

// Custom starting value and step size
<Counter initial={10} step={5} />
```

### Controls

| Control | Behavior |
|---|---|
| `+` button | Adds the current step to the count |
| `−` button | Subtracts the current step from the count |
| `Reset` | Returns the count to `initial` (not necessarily 0) |
| `Step` input | Updates the step size used by `+` and `−` |

### Edge cases

- A non-positive or non-numeric step (`0`, `-2`, empty input) falls back to `1` so the buttons always make progress.
- `Reset` returns the count to whatever `initial` was passed in, not zero.

## Project layout

```
src/
  components/
    Counter.tsx        # the feature
    Counter.test.tsx   # unit tests (8 cases)
  App.tsx              # mounts <Counter />
  main.tsx             # React entry
  setupTests.ts        # @testing-library/jest-dom setup
  styles.css
```

## Testing

The test suite covers:

- Initial value rendering (default and custom)
- Increment / decrement by the configured step
- Reset returning to `initial` (not 0)
- Updating the step at runtime applies to subsequent operations
- Step fallback to `1` for non-positive or empty input

Run once: `npm test`. Watch mode: `npm run test:watch`.
