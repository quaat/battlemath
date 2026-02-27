import { z } from 'zod'

import type { GameSettings } from './types'

const operationEnum = z.enum(['+', '-', '*', '/'])

export const gameSettingsSchema = z.object({
  rounds: z.number().int().min(3).max(20),
  secondsPerRound: z.number().int().min(5).max(45),
  operations: z.array(operationEnum).min(1),
})

export const defaultSettings: GameSettings = {
  rounds: 10,
  secondsPerRound: 12,
  operations: ['+', '-', '*', '/'],
}

export const parseGameSettings = (settings: Partial<GameSettings>): GameSettings =>
  gameSettingsSchema.parse({
    ...defaultSettings,
    ...settings,
  })
