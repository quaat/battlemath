# Battle Math

Battle Math is a timed arithmetic duel built with React + TypeScript + Vite.
You configure a match, answer equations under pressure, and defeat a rival by landing correct answers before the timer expires.

## Current Increment

This repository now includes a complete playable MVP with:

- Match setup (round count, timer per round, operation selection)
- Question generation with increasing difficulty over rounds
- Timed round resolution (`hit`, `miss`, `timeout`)
- Health-based duel loop (player HP vs rival HP)
- Score, streak, best streak, and accuracy tracking
- Round-by-round battle log
- Summary screen with rematch and setup reset
- Responsive custom UI with motion transitions

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Framer Motion (screen transitions)
- Lucide React (icons)
- Zod (settings validation)

## Project Structure

- `src/App.tsx`: Main UI and battle state orchestration
- `src/game/types.ts`: Core domain types
- `src/game/settings.ts`: Settings defaults + zod validation
- `src/game/questions.ts`: Arithmetic question generator
- `src/game/scoring.ts`: Round outcome + damage/score rules
- `src/App.css`: Component-level styling and responsive layout
- `src/index.css`: Global baseline styles

## Run

```bash
nvm use
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run test:run
npm run build
```

## Node Version

- Project now pins Node with `.nvmrc`.
- Required runtime is `>=20.19.0` (declared in `package.json` engines).

## Next Increments

- Add difficulty presets and custom enemy archetypes
- Add local persistence for best historical runs
# battlemath
