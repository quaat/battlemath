import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

export type SpriteAnimation =
  | 'idle'
  | 'attack'
  | 'magic'
  | 'hurt'
  | 'victory'
  | 'defeat'
  | 'death'

interface BattleSpriteProps {
  animation: SpriteAnimation
  facing: 'left' | 'right'
  name: string
  spriteProfile?: 'default' | 'newton'
}

interface SpriteProfileConfig {
  frameColumns: number
  frameRows: number
  renderFrameWidth: number
  renderFrameHeight: number
  animationMap: Record<SpriteAnimation, AnimationDefinition>
}

interface AnimationDefinition {
  src: string
  fps: number
  loop: boolean
}

const animationDefinitions: Record<SpriteAnimation, AnimationDefinition> = {
  idle: {
    src: '/animation-pack/Defensive-move.png',
    fps: 18,
    loop: true,
  },
  attack: {
    src: '/animation-pack/Attacking-move.png',
    fps: 24,
    loop: false,
  },
  magic: {
    src: '/animation-pack/Attacking-move.png',
    fps: 28,
    loop: false,
  },
  hurt: {
    src: '/animation-pack/Defensive-move.png',
    fps: 22,
    loop: false,
  },
  victory: {
    src: '/animation-pack/Winning-battle-chee.png',
    fps: 18,
    loop: true,
  },
  defeat: {
    src: '/animation-pack/Loosing-battle-fall.png',
    fps: 20,
    loop: false,
  },
  death: {
    src: '/animation-pack/Loosing-battle-fall.png',
    fps: 24,
    loop: false,
  },
}

const profileConfigs: Record<'default' | 'newton', SpriteProfileConfig> = {
  default: {
    frameColumns: 6,
    frameRows: 6,
    renderFrameWidth: 220,
    renderFrameHeight: 194,
    animationMap: animationDefinitions,
  },
  newton: {
    frameColumns: 6,
    frameRows: 6,
    renderFrameWidth: 224,
    renderFrameHeight: 189,
    animationMap: {
      idle: { src: '/animation-pack/newton_animation.png', fps: 18, loop: true },
      attack: { src: '/animation-pack/newton_animation.png', fps: 24, loop: false },
      magic: { src: '/animation-pack/newton_animation.png', fps: 24, loop: false },
      hurt: { src: '/animation-pack/newton_animation.png', fps: 22, loop: false },
      victory: { src: '/animation-pack/newton_animation.png', fps: 18, loop: true },
      defeat: { src: '/animation-pack/newton_animation.png', fps: 22, loop: false },
      death: { src: '/animation-pack/newton_animation.png', fps: 22, loop: false },
    },
  },
}

export function BattleSprite({
  animation,
  facing,
  name,
  spriteProfile = 'default',
}: BattleSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(0)

  const profile = profileConfigs[spriteProfile]
  const definition = profile.animationMap[animation]
  const frameCount = profile.frameColumns * profile.frameRows

  useEffect(() => {
    const frameIntervalMs = Math.max(16, Math.floor(1000 / definition.fps))

    const intervalId = window.setInterval(() => {
      setFrameIndex((previous) => {
        if (previous >= frameCount - 1) {
          if (definition.loop) {
            return 0
          }

          window.clearInterval(intervalId)
          return previous
        }

        return previous + 1
      })
    }, frameIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [definition.fps, definition.loop, definition.src, frameCount])

  const position = useMemo(() => {
    const column = frameIndex % profile.frameColumns
    const row = Math.floor(frameIndex / profile.frameColumns)

    const scaledX = column * profile.renderFrameWidth
    const scaledY = row * profile.renderFrameHeight

    return `-${scaledX}px -${scaledY}px`
  }, [frameIndex, profile.frameColumns, profile.renderFrameHeight, profile.renderFrameWidth])

  const style = {
    '--sprite-direction': facing === 'right' ? '-1' : '1',
    backgroundImage: `url('${definition.src}')`,
    backgroundPosition: position,
    backgroundSize: `${profile.renderFrameWidth * profile.frameColumns}px ${profile.renderFrameHeight * profile.frameRows}px`,
    '--sprite-width': `${profile.renderFrameWidth}px`,
    '--sprite-height': `${profile.renderFrameHeight}px`,
  } as CSSProperties

  return (
    <figure className="sprite-wrapper">
      <div
        className={`battle-sprite ${animation}`}
        style={style}
        role="img"
        aria-label={`${name} ${animation}`}
      />
      <figcaption>{name}</figcaption>
    </figure>
  )
}
