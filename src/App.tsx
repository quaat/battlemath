import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calculator,
  Coins,
  Crown,
  Flame,
  Gem,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Timer,
  Zap,
} from 'lucide-react'
import './App.css'
import { BattleSprite, type SpriteAnimation } from './components/BattleSprite'
import { generateQuestion } from './game/questions'
import {
  bosses,
  calculatePlayerBonuses,
  getUpgradeCost,
  initialUpgrades,
  pickBoss,
  rollLoot,
  upgradeDefinitions,
} from './game/rpg'
import { resolveRound } from './game/scoring'
import { defaultSettings, parseGameSettings } from './game/settings'
import type {
  AbilityCharges,
  AbilityKey,
  BattleLogEntry,
  Boss,
  GamePhase,
  LootItem,
  Operation,
  Question,
  UpgradeKey,
  UpgradeState,
} from './game/types'

const BASE_MAX_HP = 100
const BASE_ABILITY_CHARGES = 1
const FOCUS_TIME_BOOST = 4

const operationLabels: Record<Operation, string> = {
  '+': 'Add',
  '-': 'Subtract',
  '*': 'Multiply',
  '/': 'Divide',
}

const rarityClassMap: Record<LootItem['rarity'], string> = {
  common: 'rarity-common',
  rare: 'rarity-rare',
  epic: 'rarity-epic',
}

function App() {
  const [phase, setPhase] = useState<GamePhase>('setup')
  const [settings, setSettings] = useState(defaultSettings)

  const [roundSetting, setRoundSetting] = useState(defaultSettings.rounds)
  const [secondsSetting, setSecondsSetting] = useState(defaultSettings.secondsPerRound)
  const [selectedBossId, setSelectedBossId] = useState('random')
  const [selectedOperations, setSelectedOperations] = useState<Record<Operation, boolean>>({
    '+': true,
    '-': true,
    '*': true,
    '/': true,
  })
  const [formError, setFormError] = useState('')

  const [gold, setGold] = useState(0)
  const [inventory, setInventory] = useState<LootItem[]>([])
  const [upgrades, setUpgrades] = useState<UpgradeState>(initialUpgrades)
  const [lastLoot, setLastLoot] = useState<LootItem | null>(null)
  const [lastRewardGold, setLastRewardGold] = useState(0)

  const [round, setRound] = useState(1)
  const [currentBoss, setCurrentBoss] = useState<Boss>(() => pickBoss('random'))
  const [playerHP, setPlayerHP] = useState(BASE_MAX_HP)
  const [enemyHP, setEnemyHP] = useState(currentBoss.maxHP)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [answerInput, setAnswerInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(defaultSettings.secondsPerRound)
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([])

  const [abilityCharges, setAbilityCharges] = useState<AbilityCharges>({
    focus: 0,
    guard: 0,
    arcane: 0,
  })
  const [playerAnimation, setPlayerAnimation] = useState<SpriteAnimation>('idle')
  const [enemyAnimation, setEnemyAnimation] = useState<SpriteAnimation>('idle')
  const [guardActive, setGuardActive] = useState(false)
  const [arcaneStrikeActive, setArcaneStrikeActive] = useState(false)

  const enabledOperations = useMemo(
    () =>
      (Object.entries(selectedOperations) as [Operation, boolean][])
        .filter((entry) => entry[1])
        .map((entry) => entry[0]),
    [selectedOperations],
  )

  const selectedBossPreview = useMemo(
    () => bosses.find((boss) => boss.id === selectedBossId) ?? null,
    [selectedBossId],
  )

  const playerBonuses = useMemo(
    () => calculatePlayerBonuses(upgrades, inventory),
    [inventory, upgrades],
  )

  const playerMaxHP = Math.round(BASE_MAX_HP + playerBonuses.maxHPBonus)
  const baseCharges = Math.max(
    1,
    BASE_ABILITY_CHARGES + Math.floor(playerBonuses.abilityChargesBonus),
  )

  const getRoundTimer = useCallback(
    (nextBoss: Boss, nextSettings = settings) =>
      Math.max(4, nextSettings.secondsPerRound - nextBoss.timePressure),
    [settings],
  )

  const resetBattleState = useCallback(
    (nextSettings = settings, nextBoss = currentBoss) => {
      setCurrentBoss(nextBoss)
      setRound(1)
      setPlayerHP(playerMaxHP)
      setEnemyHP(nextBoss.maxHP)
      setScore(0)
      setStreak(0)
      setBestStreak(0)
      setCorrectAnswers(0)
      setAnswerInput('')
      setBattleLog([])
      setTimeLeft(getRoundTimer(nextBoss, nextSettings))
      setQuestion(generateQuestion(nextSettings.operations, 1, nextBoss.questionBonus))
      setAbilityCharges({
        focus: baseCharges,
        guard: baseCharges,
        arcane: baseCharges,
      })
      setPlayerAnimation('idle')
      setEnemyAnimation('idle')
      setGuardActive(false)
      setArcaneStrikeActive(false)
      setLastRewardGold(0)
      setLastLoot(null)
    },
    [baseCharges, currentBoss, getRoundTimer, playerMaxHP, settings],
  )

  const startBattle = useCallback(() => {
    try {
      const parsed = parseGameSettings({
        rounds: roundSetting,
        secondsPerRound: secondsSetting,
        operations: enabledOperations,
      })

      const selectedBoss = pickBoss(selectedBossId)

      setFormError('')
      setSettings(parsed)
      setPhase('battle')
      resetBattleState(parsed, selectedBoss)
    } catch {
      setFormError('Please choose at least one operation and use valid round/timer limits.')
    }
  }, [enabledOperations, resetBattleState, roundSetting, secondsSetting, selectedBossId])

  const activateAbility = useCallback(
    (ability: AbilityKey) => {
      if (phase !== 'battle' || abilityCharges[ability] <= 0) {
        return
      }

      setAbilityCharges((previous) => ({
        ...previous,
        [ability]: previous[ability] - 1,
      }))

      if (ability === 'focus') {
        setTimeLeft((previous) => previous + FOCUS_TIME_BOOST)
      }

      if (ability === 'guard') {
        setGuardActive(true)
      }

      if (ability === 'arcane') {
        setArcaneStrikeActive(true)
      }
    },
    [abilityCharges, phase],
  )

  const resolveCurrentRound = useCallback(
    (submittedAnswer: string, timedOut = false) => {
      if (!question || phase !== 'battle') {
        return
      }

      const normalizedAnswer = submittedAnswer.trim()
      const parsedAnswer = Number(normalizedAnswer)
      const isCorrect = !timedOut && normalizedAnswer.length > 0 && parsedAnswer === question.answer

      const enrageActive =
        currentBoss.ability === 'enrage' && enemyHP <= currentBoss.maxHP * 0.4

      const resolution = resolveRound(isCorrect, streak, timedOut, {
        attackBonus: playerBonuses.attackBonus,
        armorBonus: playerBonuses.armorBonus,
        bossDamageMultiplier: currentBoss.damageMultiplier + (enrageActive ? 0.35 : 0),
        bossResistance: currentBoss.resistance + (enrageActive ? 0.1 : 0),
        guardActive,
        arcaneStrikeActive,
      })

      let extraDamageToPlayer = 0
      let bossHealing = 0
      const notes: string[] = []

      if (currentBoss.ability === 'thorns' && resolution.outcome === 'hit') {
        extraDamageToPlayer = 4
        notes.push('Thorns reflect 4 damage.')
      }

      if (currentBoss.ability === 'drain' && resolution.outcome !== 'hit') {
        bossHealing = 6
        notes.push('Boss drains 6 HP.')
      }

      if (enrageActive) {
        notes.push('Enrage active.')
      }

      const nextPlayerHP = Math.max(
        0,
        playerHP - resolution.damageToPlayer - extraDamageToPlayer,
      )
      const nextEnemyHP = Math.max(
        0,
        Math.min(currentBoss.maxHP, enemyHP - resolution.damageToEnemy + bossHealing),
      )
      const nextScore = score + resolution.scoreDelta

      const nextRound = round + 1
      const shouldFinish = nextPlayerHP <= 0 || nextEnemyHP <= 0 || round >= settings.rounds
      const wonBattle = nextEnemyHP <= 0 || (round >= settings.rounds && nextEnemyHP < nextPlayerHP)

      if (isCorrect) {
        setPlayerAnimation(arcaneStrikeActive ? 'magic' : 'attack')
        setEnemyAnimation(nextEnemyHP <= 0 ? 'death' : 'hurt')
      } else {
        setEnemyAnimation('attack')
        setPlayerAnimation(nextPlayerHP <= 0 ? 'death' : 'hurt')
      }

      setPlayerHP(nextPlayerHP)
      setEnemyHP(nextEnemyHP)
      setScore(nextScore)
      setStreak(resolution.nextStreak)
      setBestStreak((previous) => Math.max(previous, resolution.nextStreak))

      if (isCorrect) {
        setCorrectAnswers((previous) => previous + 1)
      }

      setBattleLog((previous) => [
        {
          round,
          question: question.text,
          playerAnswer: timedOut ? 'TIME' : normalizedAnswer || '-',
          expectedAnswer: question.answer,
          outcome: resolution.outcome,
          damageToEnemy: resolution.damageToEnemy,
          damageToPlayer: resolution.damageToPlayer + extraDamageToPlayer,
          note: notes.join(' '),
        },
        ...previous,
      ])

      setGuardActive(false)

      if (arcaneStrikeActive && resolution.outcome === 'hit') {
        setArcaneStrikeActive(false)
      }

      if (shouldFinish) {
        if (wonBattle) {
          setPlayerAnimation('victory')
          setEnemyAnimation(nextEnemyHP <= 0 ? 'death' : 'defeat')
        } else {
          setEnemyAnimation('victory')
          setPlayerAnimation(nextPlayerHP <= 0 ? 'death' : 'defeat')
        }

        setPhase('summary')

        if (wonBattle) {
          const loot = rollLoot(currentBoss)
          const reward =
            currentBoss.rewardGold +
            Math.max(10, Math.floor(nextScore * 0.45) + correctAnswers + (isCorrect ? 1 : 0))
          const rewardWithBonus = reward + (loot.effects.goldBonus ?? 0)

          setGold((previous) => previous + rewardWithBonus)
          setLastRewardGold(rewardWithBonus)
          setLastLoot(loot)
          setInventory((previous) => [loot, ...previous].slice(0, 24))
        } else {
          setLastRewardGold(0)
          setLastLoot(null)
        }

        return
      }

      setRound(nextRound)
      setAnswerInput('')
      setTimeLeft(getRoundTimer(currentBoss, settings))
      setQuestion(
        generateQuestion(settings.operations, nextRound, currentBoss.questionBonus),
      )
    },
    [
      arcaneStrikeActive,
      correctAnswers,
      currentBoss,
      enemyHP,
      getRoundTimer,
      guardActive,
      phase,
      playerBonuses.attackBonus,
      playerBonuses.armorBonus,
      playerHP,
      question,
      round,
      score,
      settings,
      streak,
    ],
  )

  useEffect(() => {
    if (phase !== 'battle' || timeLeft <= 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (timeLeft === 1) {
        setTimeLeft(0)
        window.setTimeout(() => {
          resolveCurrentRound('', true)
        }, 0)
        return
      }

      setTimeLeft((previous) => previous - 1)
    }, 1000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [phase, resolveCurrentRound, timeLeft])

  useEffect(() => {
    if (phase !== 'battle') {
      return
    }

    if (playerAnimation === 'idle' && enemyAnimation === 'idle') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setPlayerAnimation('idle')
      setEnemyAnimation('idle')
    }, 1450)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [enemyAnimation, phase, playerAnimation])

  const purchaseUpgrade = useCallback(
    (key: UpgradeKey) => {
      const currentLevel = upgrades[key]
      const cost = getUpgradeCost(key, currentLevel)

      if (gold < cost) {
        return
      }

      setGold((previous) => previous - cost)
      setUpgrades((previous) => ({
        ...previous,
        [key]: previous[key] + 1,
      }))
    },
    [gold, upgrades],
  )

  const healthPlayerPercent = Math.max(0, Math.min(100, (playerHP / playerMaxHP) * 100))
  const healthEnemyPercent = Math.max(0, Math.min(100, (enemyHP / currentBoss.maxHP) * 100))
  const accuracy = battleLog.length > 0 ? Math.round((correctAnswers / battleLog.length) * 100) : 0
  const wonBattle = enemyHP <= 0 || (round >= settings.rounds && enemyHP < playerHP)

  const handleOperationToggle = (operation: Operation) => {
    setSelectedOperations((previous) => {
      const currentlyEnabled = previous[operation]
      const enabledCount = Object.values(previous).filter(Boolean).length

      if (currentlyEnabled && enabledCount === 1) {
        return previous
      }

      return {
        ...previous,
        [operation]: !previous[operation],
      }
    })
  }

  return (
    <div className="battle-app">
      <div className="ambient-glow ambient-glow-left" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-right" aria-hidden="true" />

      <main className="battle-shell">
        <header className="battle-header">
          <p className="eyebrow">Turn arithmetic into a duel</p>
          <h1>
            <Swords size={28} /> Battle Math
          </h1>
          <p className="subtle">Boss fights, loot drops, upgrades, and tactical abilities.</p>
          <div className="meta-strip">
            <span>
              <Coins size={15} /> Gold: {gold}
            </span>
            <span>
              <Gem size={15} /> Loot: {inventory.length}
            </span>
            <span>
              <Sparkles size={15} /> Attack +{Math.round(playerBonuses.attackBonus * 100)}%
            </span>
            <span>
              <Shield size={15} /> Armor +{Math.round(playerBonuses.armorBonus * 100)}%
            </span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.section
              key="setup"
              className="panel setup-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2>
                <Calculator size={20} /> Match Setup
              </h2>

              <label>
                Rounds
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={roundSetting}
                  onChange={(event) => setRoundSetting(Number(event.target.value))}
                />
              </label>

              <label>
                Seconds per round
                <input
                  type="number"
                  min={5}
                  max={45}
                  value={secondsSetting}
                  onChange={(event) => setSecondsSetting(Number(event.target.value))}
                />
              </label>

              <label>
                Boss
                <select
                  value={selectedBossId}
                  onChange={(event) => setSelectedBossId(event.target.value)}
                >
                  <option value="random">Random Boss</option>
                  {bosses.map((boss) => (
                    <option key={boss.id} value={boss.id}>
                      {boss.name}
                    </option>
                  ))}
                </select>
              </label>

              {selectedBossPreview && (
                <article className="boss-preview">
                  <h3>
                    <Crown size={16} /> {selectedBossPreview.name}
                  </h3>
                  <p>{selectedBossPreview.title}</p>
                  <p>{selectedBossPreview.description}</p>
                </article>
              )}

              <fieldset>
                <legend>Operations</legend>
                <div className="operation-grid">
                  {(Object.keys(operationLabels) as Operation[]).map((operation) => (
                    <button
                      key={operation}
                      type="button"
                      className={selectedOperations[operation] ? 'toggle active' : 'toggle'}
                      onClick={() => handleOperationToggle(operation)}
                    >
                      <span>{operation}</span>
                      {operationLabels[operation]}
                    </button>
                  ))}
                </div>
              </fieldset>

              {formError && <p className="error-message">{formError}</p>}

              <button className="primary" onClick={startBattle}>
                Start Battle
              </button>

              <section className="upgrade-shop">
                <h3>
                  <Sparkles size={16} /> Upgrades
                </h3>
                <div className="upgrade-grid">
                  {upgradeDefinitions.map((upgrade) => {
                    const level = upgrades[upgrade.key]
                    const cost = getUpgradeCost(upgrade.key, level)
                    const canBuy = gold >= cost

                    return (
                      <article key={upgrade.key} className="upgrade-card">
                        <strong>{upgrade.name}</strong>
                        <p>{upgrade.description}</p>
                        <p>Level {level}</p>
                        <button
                          type="button"
                          className={canBuy ? 'secondary' : 'secondary disabled'}
                          onClick={() => purchaseUpgrade(upgrade.key)}
                          disabled={!canBuy}
                        >
                          Buy ({cost}g)
                        </button>
                      </article>
                    )
                  })}
                </div>
              </section>
            </motion.section>
          )}

          {phase === 'battle' && question && (
            <motion.section
              key="battle"
              className="panel battle-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="status-row">
                <div className="status-card">
                  <p>
                    <Heart size={16} /> You
                  </p>
                  <div className="health-track">
                    <div style={{ width: `${healthPlayerPercent}%` }} />
                  </div>
                  <strong>
                    {playerHP}/{playerMaxHP} HP
                  </strong>
                </div>

                <div className="status-card central">
                  <p>
                    <Shield size={16} /> Round {round}/{settings.rounds}
                  </p>
                  <strong className={timeLeft <= 3 ? 'urgent' : ''}>
                    <Timer size={16} /> {timeLeft}s
                  </strong>
                  {(guardActive || arcaneStrikeActive) && (
                    <p className="buff-line">
                      {guardActive && 'Guard active'}
                      {guardActive && arcaneStrikeActive && ' · '}
                      {arcaneStrikeActive && 'Arcane Strike primed'}
                    </p>
                  )}
                </div>

                <div className="status-card enemy">
                  <p>
                    <Flame size={16} /> {currentBoss.name}
                  </p>
                  <div className="health-track enemy">
                    <div style={{ width: `${healthEnemyPercent}%` }} />
                  </div>
                  <strong>
                    {enemyHP}/{currentBoss.maxHP} HP
                  </strong>
                </div>
              </div>

              <div className="boss-trait">
                <Crown size={15} />
                <span>
                  {currentBoss.title}: {currentBoss.description}
                </span>
              </div>

              <div className="sprite-stage">
                <BattleSprite
                  key={`player-${playerAnimation}`}
                  animation={playerAnimation}
                  facing="left"
                  name="You"
                />
                <BattleSprite
                  key={`enemy-${enemyAnimation}`}
                  animation={enemyAnimation}
                  facing="right"
                  name={currentBoss.name}
                  spriteProfile="newton"
                />
              </div>

              <div className="ability-row">
                <button
                  type="button"
                  className="ability"
                  onClick={() => activateAbility('focus')}
                  disabled={abilityCharges.focus <= 0}
                >
                  <Timer size={15} /> Focus (+{FOCUS_TIME_BOOST}s)
                  <span>{abilityCharges.focus}</span>
                </button>
                <button
                  type="button"
                  className="ability"
                  onClick={() => activateAbility('guard')}
                  disabled={abilityCharges.guard <= 0}
                >
                  <Shield size={15} /> Guard (halve next hit)
                  <span>{abilityCharges.guard}</span>
                </button>
                <button
                  type="button"
                  className="ability"
                  onClick={() => activateAbility('arcane')}
                  disabled={abilityCharges.arcane <= 0}
                >
                  <Zap size={15} /> Arcane Strike (+50% next hit)
                  <span>{abilityCharges.arcane}</span>
                </button>
              </div>

              <div className="question-card">
                <p className="question-label">Solve fast</p>
                <h2>{question.text}</h2>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    resolveCurrentRound(answerInput, false)
                  }}
                >
                  <input
                    autoFocus
                    type="number"
                    inputMode="numeric"
                    value={answerInput}
                    onChange={(event) => setAnswerInput(event.target.value)}
                    placeholder="Answer"
                  />
                  <button className="primary" type="submit">
                    Strike
                  </button>
                </form>
              </div>

              <div className="stats-strip">
                <span>Score: {score}</span>
                <span>Streak: {streak}</span>
                <span>Best Streak: {bestStreak}</span>
              </div>

              <ul className="battle-log">
                {battleLog.slice(0, 6).map((entry) => (
                  <li key={`${entry.round}-${entry.question}-${entry.playerAnswer}`}>
                    <span>R{entry.round}</span>
                    <span>{entry.question}</span>
                    <span>
                      {entry.playerAnswer} / {entry.expectedAnswer}
                    </span>
                    <span className={`outcome ${entry.outcome}`}>
                      {entry.outcome === 'hit' && `+${entry.damageToEnemy} dmg`}
                      {entry.outcome === 'miss' && `-${entry.damageToPlayer} hp`}
                      {entry.outcome === 'timeout' && `-${entry.damageToPlayer} hp`}
                    </span>
                    {entry.note && <span className="entry-note">{entry.note}</span>}
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {phase === 'summary' && (
            <motion.section
              key="summary"
              className="panel summary-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2>{wonBattle ? 'Victory' : playerHP <= 0 ? 'Defeat' : 'Battle Complete'}</h2>
              <div className="summary-grid">
                <article>
                  <p>Final Score</p>
                  <strong>{score}</strong>
                </article>
                <article>
                  <p>Accuracy</p>
                  <strong>{accuracy}%</strong>
                </article>
                <article>
                  <p>Best Streak</p>
                  <strong>{bestStreak}</strong>
                </article>
                <article>
                  <p>Gold Reward</p>
                  <strong>{lastRewardGold}</strong>
                </article>
              </div>

              {lastLoot && (
                <article className={`loot-drop ${rarityClassMap[lastLoot.rarity]}`}>
                  <h3>
                    <Gem size={16} /> Loot Acquired: {lastLoot.name}
                  </h3>
                  <p>{lastLoot.description}</p>
                </article>
              )}

              <section className="inventory-preview">
                <h3>Recent Loot</h3>
                <div className="loot-list">
                  {inventory.slice(0, 6).map((item) => (
                    <span key={item.id} className={rarityClassMap[item.rarity]}>
                      {item.name}
                    </span>
                  ))}
                  {inventory.length === 0 && <span>No loot yet.</span>}
                </div>
              </section>

              <div className="summary-actions">
                <button
                  className="primary"
                  onClick={() => {
                    setPhase('battle')
                    resetBattleState(settings, currentBoss)
                  }}
                >
                  Rematch Boss
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setPhase('setup')
                  }}
                >
                  Change Setup
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
