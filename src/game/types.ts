export type Operation = '+' | '-' | '*' | '/'

export type GamePhase = 'setup' | 'battle' | 'summary'

export type BattleOutcome = 'hit' | 'miss' | 'timeout'

export type BossAbility = 'thorns' | 'drain' | 'enrage' | 'time-warp'

export type LootRarity = 'common' | 'rare' | 'epic'

export type UpgradeKey = 'blade' | 'bulwark' | 'vitality' | 'focus'

export type AbilityKey = 'focus' | 'guard' | 'arcane'

export interface GameSettings {
  rounds: number
  secondsPerRound: number
  operations: Operation[]
}

export interface Question {
  left: number
  right: number
  operation: Operation
  answer: number
  text: string
}

export interface BattleLogEntry {
  round: number
  question: string
  playerAnswer: string
  expectedAnswer: number
  outcome: BattleOutcome
  damageToEnemy: number
  damageToPlayer: number
  note?: string
}

export interface Boss {
  id: string
  name: string
  title: string
  description: string
  ability: BossAbility
  maxHP: number
  damageMultiplier: number
  resistance: number
  rewardGold: number
  timePressure: number
  questionBonus: number
}

export interface LootEffect {
  attackBonus?: number
  armorBonus?: number
  maxHPBonus?: number
  abilityChargesBonus?: number
  goldBonus?: number
}

export interface LootItem {
  id: string
  name: string
  rarity: LootRarity
  description: string
  effects: LootEffect
}

export interface UpgradeState {
  blade: number
  bulwark: number
  vitality: number
  focus: number
}

export interface AbilityCharges {
  focus: number
  guard: number
  arcane: number
}

export interface PlayerBonuses {
  attackBonus: number
  armorBonus: number
  maxHPBonus: number
  abilityChargesBonus: number
}
