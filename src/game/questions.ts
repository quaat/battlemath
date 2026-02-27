import type { Operation, Question } from './types'

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pickRandom = <T>(items: T[]): T => items[randomInt(0, items.length - 1)]

const buildDivisionQuestion = (difficulty: number): Question => {
  const right = randomInt(2, Math.max(4, 4 + difficulty))
  const answer = randomInt(2, Math.max(8, 8 + difficulty * 2))
  const left = right * answer

  return {
    left,
    right,
    operation: '/',
    answer,
    text: `${left} / ${right}`,
  }
}

const buildQuestionByOperation = (
  operation: Operation,
  difficulty: number,
): Question => {
  const min = Math.max(1, difficulty)
  const max = 10 + difficulty * 3

  if (operation === '+') {
    const left = randomInt(min, max)
    const right = randomInt(min, max)
    const answer = left + right
    return { left, right, operation, answer, text: `${left} + ${right}` }
  }

  if (operation === '-') {
    const bigger = randomInt(min + 2, max + 4)
    const smaller = randomInt(min, bigger - 1)
    const answer = bigger - smaller
    return {
      left: bigger,
      right: smaller,
      operation,
      answer,
      text: `${bigger} - ${smaller}`,
    }
  }

  if (operation === '*') {
    const left = randomInt(2, Math.max(8, 4 + difficulty))
    const right = randomInt(2, Math.max(8, 5 + difficulty))
    const answer = left * right
    return { left, right, operation, answer, text: `${left} * ${right}` }
  }

  return buildDivisionQuestion(difficulty)
}

export const generateQuestion = (
  allowedOperations: Operation[],
  round: number,
  difficultyBonus = 0,
): Question => {
  const operation = pickRandom(allowedOperations)
  const difficulty = Math.min(
    12,
    Math.max(1, Math.floor(round / 2) + 1 + difficultyBonus),
  )
  return buildQuestionByOperation(operation, difficulty)
}
