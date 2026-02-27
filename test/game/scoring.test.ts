import { describe, expect, it } from 'vitest'

import { resolveRound } from '../../src/game/scoring'

describe('resolveRound', () => {
  it('resolves timeout with fixed player penalty and streak reset', () => {
    const result = resolveRound(false, 4, true)

    expect(result).toEqual({
      outcome: 'timeout',
      damageToEnemy: 0,
      damageToPlayer: 16,
      scoreDelta: -2,
      nextStreak: 0,
    })
  })

  it('resolves correct answers with scaling damage and score bonus', () => {
    const result = resolveRound(true, 2, false)

    expect(result.outcome).toBe('hit')
    expect(result.damageToPlayer).toBe(0)
    expect(result.nextStreak).toBe(3)
    expect(result.damageToEnemy).toBe(18)
    expect(result.scoreDelta).toBe(13)
  })

  it('caps bonus damage on very high streaks', () => {
    const result = resolveRound(true, 20, false)
    expect(result.damageToEnemy).toBe(30)
  })

  it('resolves wrong answers with player damage and streak reset', () => {
    const result = resolveRound(false, 6, false)

    expect(result).toEqual({
      outcome: 'miss',
      damageToEnemy: 0,
      damageToPlayer: 10,
      scoreDelta: -1,
      nextStreak: 0,
    })
  })

  it('applies attack, armor, boss resistance and ability modifiers', () => {
    const hit = resolveRound(true, 1, false, {
      attackBonus: 0.2,
      bossResistance: 0.1,
      arcaneStrikeActive: true,
    })
    const miss = resolveRound(false, 0, false, {
      bossDamageMultiplier: 1.3,
      armorBonus: 0.2,
      guardActive: true,
    })

    expect(hit.damageToEnemy).toBe(26)
    expect(miss.damageToPlayer).toBe(5)
  })
})
