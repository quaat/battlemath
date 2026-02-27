import type { BattleOutcome } from './types'

export interface BattleResolution {
  outcome: BattleOutcome
  damageToEnemy: number
  damageToPlayer: number
  scoreDelta: number
  nextStreak: number
}

export interface RoundModifiers {
  attackBonus: number
  armorBonus: number
  bossDamageMultiplier: number
  bossResistance: number
  guardActive: boolean
  arcaneStrikeActive: boolean
}

const defaultRoundModifiers: RoundModifiers = {
  attackBonus: 0,
  armorBonus: 0,
  bossDamageMultiplier: 1,
  bossResistance: 0,
  guardActive: false,
  arcaneStrikeActive: false,
}

export const resolveRound = (
  isCorrect: boolean,
  streak: number,
  timedOut = false,
  modifiers: Partial<RoundModifiers> = {},
): BattleResolution => {
  const normalized = { ...defaultRoundModifiers, ...modifiers }
  const armorFactor = Math.max(0.25, 1 - normalized.armorBonus)
  const bossResistance = Math.min(0.7, Math.max(0, normalized.bossResistance))

  if (timedOut) {
    const timedOutDamage = Math.max(
      1,
      Math.round(
        16 *
          normalized.bossDamageMultiplier *
          (normalized.guardActive ? 0.5 : 1) *
          armorFactor,
      ),
    )

    return {
      outcome: 'timeout',
      damageToEnemy: 0,
      damageToPlayer: timedOutDamage,
      scoreDelta: -2,
      nextStreak: 0,
    }
  }

  if (isCorrect) {
    const nextStreak = streak + 1
    const baseDamage = 12 + Math.min(18, nextStreak * 2)
    const adjustedDamage = Math.round(
      baseDamage *
        (1 + normalized.attackBonus) *
        (normalized.arcaneStrikeActive ? 1.5 : 1) *
        (1 - bossResistance),
    )
    const damageToEnemy = Math.max(1, adjustedDamage)
    return {
      outcome: 'hit',
      damageToEnemy,
      damageToPlayer: 0,
      scoreDelta: 10 + nextStreak,
      nextStreak,
    }
  }

  const missDamage = Math.max(
    1,
    Math.round(
      10 * normalized.bossDamageMultiplier * (normalized.guardActive ? 0.5 : 1) * armorFactor,
    ),
  )

  return {
    outcome: 'miss',
    damageToEnemy: 0,
    damageToPlayer: missDamage,
    scoreDelta: -1,
    nextStreak: 0,
  }
}
