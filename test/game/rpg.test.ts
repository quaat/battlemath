import { describe, expect, it } from 'vitest'

import {
  bosses,
  calculatePlayerBonuses,
  getUpgradeCost,
  initialUpgrades,
  pickBoss,
  rollLoot,
} from '../../src/game/rpg'
import type { LootItem } from '../../src/game/types'

describe('rpg helpers', () => {
  it('calculates upgrade costs with growth', () => {
    expect(getUpgradeCost('blade', 0)).toBe(60)
    expect(getUpgradeCost('blade', 1)).toBe(102)
    expect(getUpgradeCost('vitality', 2)).toBe(175)
  })

  it('aggregates upgrade and loot bonuses', () => {
    const sampleLoot: LootItem[] = [
      {
        id: 'a',
        name: 'A',
        rarity: 'common',
        description: '',
        effects: { attackBonus: 0.03, maxHPBonus: 8 },
      },
      {
        id: 'b',
        name: 'B',
        rarity: 'rare',
        description: '',
        effects: { armorBonus: 0.05, abilityChargesBonus: 1 },
      },
    ]

    const bonuses = calculatePlayerBonuses(
      { ...initialUpgrades, blade: 2, bulwark: 1, vitality: 1, focus: 1 },
      sampleLoot,
    )

    expect(bonuses.attackBonus).toBeCloseTo(0.19)
    expect(bonuses.armorBonus).toBeCloseTo(0.12)
    expect(bonuses.maxHPBonus).toBe(18)
    expect(bonuses.abilityChargesBonus).toBe(2)
  })

  it('returns requested boss when id is known', () => {
    const boss = pickBoss('overlord')
    expect(boss.id).toBe('overlord')
  })

  it('rolls loot with valid shape', () => {
    const loot = rollLoot(bosses[0])
    expect(loot.id.length).toBeGreaterThan(0)
    expect(loot.name.length).toBeGreaterThan(0)
    expect(['common', 'rare', 'epic']).toContain(loot.rarity)
  })
})
