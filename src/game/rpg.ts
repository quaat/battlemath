import type {
  Boss,
  LootItem,
  LootRarity,
  PlayerBonuses,
  UpgradeKey,
  UpgradeState,
} from './types'

interface LootTemplate {
  name: string
  rarity: LootRarity
  description: string
  weight: number
  affinity?: Boss['ability']
  effects: LootItem['effects']
}

interface UpgradeDefinition {
  key: UpgradeKey
  name: string
  description: string
  baseCost: number
  growth: number
}

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pickRandom = <T>(items: T[]): T => items[randomInt(0, items.length - 1)]

export const bosses: Boss[] = [
  {
    id: 'golem',
    name: 'Granite Golem',
    title: 'Keeper of Fractions',
    description: 'High armor and reflective spikes punish clean hits.',
    ability: 'thorns',
    maxHP: 120,
    damageMultiplier: 0.95,
    resistance: 0.14,
    rewardGold: 44,
    timePressure: 0,
    questionBonus: 1,
  },
  {
    id: 'wyrm',
    name: 'Chrono Wyrm',
    title: 'Timebreaker',
    description: 'Bends the clock and gives you less time each round.',
    ability: 'time-warp',
    maxHP: 102,
    damageMultiplier: 1.08,
    resistance: 0.06,
    rewardGold: 48,
    timePressure: 1,
    questionBonus: 2,
  },
  {
    id: 'lich',
    name: 'Lich of Algebra',
    title: 'Soul Divider',
    description: 'Drains life whenever your answer is wrong or late.',
    ability: 'drain',
    maxHP: 96,
    damageMultiplier: 1.18,
    resistance: 0.08,
    rewardGold: 55,
    timePressure: 0,
    questionBonus: 2,
  },
  {
    id: 'overlord',
    name: 'Prime Overlord',
    title: 'Lord of Constants',
    description: 'Enrages below 40% HP, gaining damage and resistance.',
    ability: 'enrage',
    maxHP: 132,
    damageMultiplier: 1.14,
    resistance: 0.17,
    rewardGold: 70,
    timePressure: 1,
    questionBonus: 3,
  },
]

const lootTable: LootTemplate[] = [
  {
    name: 'Bronze Abacus Ring',
    rarity: 'common',
    description: '+4% attack.',
    weight: 34,
    effects: { attackBonus: 0.04 },
  },
  {
    name: 'Guard Sigil',
    rarity: 'common',
    description: '+4% armor.',
    weight: 34,
    effects: { armorBonus: 0.04 },
  },
  {
    name: 'Sage Notebook',
    rarity: 'common',
    description: '+1 starting ability charge.',
    weight: 30,
    affinity: 'time-warp',
    effects: { abilityChargesBonus: 1 },
  },
  {
    name: 'Runed Bracers',
    rarity: 'rare',
    description: '+8% attack and +6% armor.',
    weight: 18,
    affinity: 'thorns',
    effects: { attackBonus: 0.08, armorBonus: 0.06 },
  },
  {
    name: 'Heart of Quartz',
    rarity: 'rare',
    description: '+18 max HP.',
    weight: 16,
    affinity: 'drain',
    effects: { maxHPBonus: 18 },
  },
  {
    name: 'Pocket Chronometer',
    rarity: 'rare',
    description: '+2 starting ability charges.',
    weight: 14,
    affinity: 'time-warp',
    effects: { abilityChargesBonus: 2 },
  },
  {
    name: 'Overlord Crest',
    rarity: 'epic',
    description: '+12% attack, +12% armor, +15 max HP, +1 charge.',
    weight: 6,
    affinity: 'enrage',
    effects: { attackBonus: 0.12, armorBonus: 0.12, maxHPBonus: 15, abilityChargesBonus: 1 },
  },
  {
    name: 'Arcane Treasury Map',
    rarity: 'epic',
    description: '+80 bonus gold and +6% attack.',
    weight: 5,
    effects: { attackBonus: 0.06, goldBonus: 80 },
  },
]

export const upgradeDefinitions: UpgradeDefinition[] = [
  {
    key: 'blade',
    name: 'Blade Training',
    description: '+8% attack damage each level.',
    baseCost: 60,
    growth: 42,
  },
  {
    key: 'bulwark',
    name: 'Bulwark Drills',
    description: '+7% damage reduction each level.',
    baseCost: 60,
    growth: 42,
  },
  {
    key: 'vitality',
    name: 'Vitality Runes',
    description: '+10 max HP each level.',
    baseCost: 75,
    growth: 50,
  },
  {
    key: 'focus',
    name: 'Focus Mastery',
    description: '+1 starting charge for each ability each level.',
    baseCost: 85,
    growth: 56,
  },
]

export const initialUpgrades: UpgradeState = {
  blade: 0,
  bulwark: 0,
  vitality: 0,
  focus: 0,
}

export const getUpgradeCost = (key: UpgradeKey, level: number): number => {
  const definition = upgradeDefinitions.find((entry) => entry.key === key)

  if (!definition) {
    return Number.POSITIVE_INFINITY
  }

  return definition.baseCost + level * definition.growth
}

export const calculatePlayerBonuses = (
  upgrades: UpgradeState,
  inventory: LootItem[],
): PlayerBonuses => {
  const lootBonuses = inventory.reduce(
    (totals, item) => ({
      attackBonus: totals.attackBonus + (item.effects.attackBonus ?? 0),
      armorBonus: totals.armorBonus + (item.effects.armorBonus ?? 0),
      maxHPBonus: totals.maxHPBonus + (item.effects.maxHPBonus ?? 0),
      abilityChargesBonus:
        totals.abilityChargesBonus + (item.effects.abilityChargesBonus ?? 0),
    }),
    { attackBonus: 0, armorBonus: 0, maxHPBonus: 0, abilityChargesBonus: 0 },
  )

  return {
    attackBonus: upgrades.blade * 0.08 + lootBonuses.attackBonus,
    armorBonus: upgrades.bulwark * 0.07 + lootBonuses.armorBonus,
    maxHPBonus: upgrades.vitality * 10 + lootBonuses.maxHPBonus,
    abilityChargesBonus: upgrades.focus + lootBonuses.abilityChargesBonus,
  }
}

export const pickBoss = (bossId: string): Boss => {
  if (bossId === 'random') {
    return pickRandom(bosses)
  }

  const selected = bosses.find((boss) => boss.id === bossId)
  return selected ?? pickRandom(bosses)
}

export const rollLoot = (boss: Boss): LootItem => {
  const weighted = lootTable.map((template) => ({
    template,
    score:
      template.weight *
      (template.affinity === boss.ability ? 1.45 : 1) *
      (boss.id === 'overlord' ? 1.15 : 1),
  }))

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.score, 0)
  let roll = Math.random() * totalWeight

  for (const entry of weighted) {
    roll -= entry.score

    if (roll <= 0) {
      return {
        id: `${entry.template.rarity}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: entry.template.name,
        rarity: entry.template.rarity,
        description: entry.template.description,
        effects: entry.template.effects,
      }
    }
  }

  const fallback = weighted[weighted.length - 1].template
  return {
    id: `${fallback.rarity}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: fallback.name,
    rarity: fallback.rarity,
    description: fallback.description,
    effects: fallback.effects,
  }
}
