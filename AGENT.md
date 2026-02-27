# AGENT.md

## Objective
Maintain and extend the Battle Math application as an incremental, testable React project.

## Latest Update (2026-02-24)
Implemented RPG progression systems on top of the existing battle loop, and integrated battle sprite-sheet animations for combat feedback.

### Added
- Domain module for game types: `src/game/types.ts`
- Settings schema + defaults using zod: `src/game/settings.ts`
- Round question generator with operation-aware logic: `src/game/questions.ts`
- Scoring and damage resolution logic with combat modifiers: `src/game/scoring.ts`
- RPG catalog/helpers: `src/game/rpg.ts`
- Sprite animation component: `src/components/BattleSprite.tsx`
- Full app flow in `src/App.tsx`:
  - Setup -> Battle -> Summary phases
  - Timer-driven rounds
  - HP combat, streaks, score, and battle log
- RPG systems in `src/App.tsx`:
  - Boss selection + boss-specific passive effects (`thorns`, `drain`, `enrage`, `time-warp`)
  - Loot rewards after wins, with rarity tiers and passive stat bonuses
  - Gold economy and upgrade shop
  - Active abilities (`Focus`, `Guard`, `Arcane Strike`) with charge tracking
  - State-driven character sprite animations during battle (`idle`, `attack`, `hurt`, `victory`, `defeat`, `death`; plus `magic` for arcane attacks)
- Full UI redesign in `src/App.css` + baseline reset in `src/index.css`
- Sprite sheets from `public/animation-pack` integrated for smoother combat animation:
  - `Attacking-move.png`
  - `Defensive-move.png`
  - `Loosing-battle-fall.png`
  - `Winning-battle-chee.png`
- Unit tests:
  - `test/game/questions.test.ts`
  - `test/game/rpg.test.ts`
  - `test/game/scoring.test.ts`
- Test runner scripts in `package.json`:
  - `npm test`
  - `npm run test:run`
- Runtime guardrails:
  - Node engine requirement `>=20.19.0` in `package.json`
  - `.nvmrc` pinned to `24.14.0`

### Behavioral Rules
- A correct answer deals enemy damage and increases streak.
- A wrong answer damages player HP and resets streak.
- Timeout applies stronger player penalty and resets streak.
- Match ends when HP reaches zero or configured rounds are complete.
- Boss passives alter battle flow and can add reflected damage, healing, or enraged scaling.
- Upgrades and loot permanently improve future runs within the session.
- Ability charges reset each battle and scale with progression bonuses.

## Implementation Notes
- Validation entry point: `parseGameSettings` in `src/game/settings.ts`
- Question creation entry point: `generateQuestion` in `src/game/questions.ts`
- Round resolution entry point: `resolveRound` in `src/game/scoring.ts`
- RPG helper entry points:
  - Boss roster: `bosses` in `src/game/rpg.ts`
  - Boss picker: `pickBoss` in `src/game/rpg.ts`
  - Loot roll: `rollLoot` in `src/game/rpg.ts`
  - Progression bonuses: `calculatePlayerBonuses` in `src/game/rpg.ts`
  - Upgrade pricing: `getUpgradeCost` in `src/game/rpg.ts`
- `App.tsx` keeps orchestration in component state; domain logic remains in `/game` modules.
- Sprite implementation details:
  - Each animation sheet in `public/animation-pack` is treated as one sequence.
  - Frame size is `367x324`; each sheet is `2202x1944` (`6x6`, 36 frames total).
  - `BattleSprite` advances frames in row-major order with timed frame stepping.
  - State mapping:
    - `idle`/`hurt` -> `Defensive-move.png`
    - `attack`/`magic` -> `Attacking-move.png`
    - `victory` -> `Winning-battle-chee.png`
    - `defeat`/`death` -> `Loosing-battle-fall.png`
  - Prime Overlord (`boss.id === "overlord"`) uses `public/animation-pack/newton_animation.png` for all battle animation states.
  - Newton sheet frame size is `372x315`; sheet size is `2232x1890` (`6x6`, 36 frames).

## Next Agent Tasks
1. Persist progression state (gold, inventory, upgrades) to local storage.
2. Add tests for `settings.ts` validation and boss/ability integration behavior.
3. Split `App.tsx` into feature components (`SetupPanel`, `BattlePanel`, `SummaryPanel`, `UpgradeShop`).

## Guardrails
- Preserve typed domain boundaries (`src/game/*`) and keep UI logic in `App.tsx`/components.
- Keep settings validated via zod before starting a match.
- Maintain responsive behavior for mobile (<= 760px).
