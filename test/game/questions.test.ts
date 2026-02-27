import { describe, expect, it } from 'vitest'

import { generateQuestion } from '../../src/game/questions'
import type { Operation } from '../../src/game/types'

const evaluate = (left: number, operation: Operation, right: number): number => {
  switch (operation) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '/':
      return left / right
  }
}

describe('generateQuestion', () => {
  it('always creates questions that match the provided operation set', () => {
    const allowed: Operation[] = ['+', '*']

    for (let round = 1; round <= 12; round += 1) {
      const question = generateQuestion(allowed, round)
      expect(allowed).toContain(question.operation)
    }
  })

  it('always generates internally valid arithmetic answers', () => {
    for (let round = 1; round <= 16; round += 1) {
      const question = generateQuestion(['+', '-', '*', '/'], round)
      expect(question.answer).toBe(evaluate(question.left, question.operation, question.right))
      expect(question.text).toBe(`${question.left} ${question.operation} ${question.right}`)
    }
  })

  it('keeps division questions integer and exact', () => {
    for (let i = 0; i < 200; i += 1) {
      const question = generateQuestion(['/'], 18)
      expect(question.right).toBeGreaterThan(0)
      expect(Number.isInteger(question.answer)).toBe(true)
      expect(question.left % question.right).toBe(0)
      expect(question.left / question.right).toBe(question.answer)
    }
  })

  it('increases addition range on later rounds', () => {
    for (let i = 0; i < 40; i += 1) {
      const question = generateQuestion(['+'], 20)
      expect(question.left).toBeGreaterThanOrEqual(10)
      expect(question.right).toBeGreaterThanOrEqual(10)
    }
  })
})
