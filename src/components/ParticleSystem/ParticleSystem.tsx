import React, { useEffect, useRef, useCallback } from 'react'

// ─── Particle definition ─────────────────────────────────────────────────────
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  opacityDir: number
  color: string
  type: 'orb' | 'spark' | 'dust'
  pulsePhase: number
  pulseSpeed: number
  originalX: number
  originalY: number
}

// ─── Mouse state (module-level, shared) ──────────────────────────────────────
let mouseX = -9999
let mouseY = -9999

// ─── ParticleSystem ──────────────────────────────────────────────────────────
export const ParticleSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const frameRef = useRef(0)

  // Gold palette
  const COLORS = [
    'rgba(200,162,0,',
    'rgba(255,215,0,',
    'rgba(232,184,0,',
    'rgba(255,200,50,',
    'rgba(180,140,0,',
    'rgba(255,230,100,',
  ]

  const createParticle = useCallback((canvas: HTMLCanvasElement, forceType?: Particle['type']): Particle => {
    const type = forceType ?? (
      Math.random() < 0.15 ? 'orb' :
      Math.random() < 0.35 ? 'spark' : 'dust'
    )

    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const speed = type === 'orb' ? 0.12 : type === 'spark' ? 0.3 : 0.18
    const angle = Math.random() * Math.PI * 2

    return {
      x, y,
      originalX: x, originalY: y,
      vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
      vy: Math.sin(angle) * speed * (0.5 + Math.random() * 0.5) - 0.05,
      size: type === 'orb'
        ? 2.5 + Math.random() * 3
        : type === 'spark'
        ? 0.8 + Math.random() * 1.2
        : 0.4 + Math.random() * 0.8,
      opacity: 0.1 + Math.random() * 0.5,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      type,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.015,
    }
  }, [])

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 14000), 80)
    particlesRef.current = Array.from({ length: count }, () => createParticle(canvas))
  }, [createParticle])

  const drawOrb = useCallback((ctx: CanvasRenderingContext2D, p: Particle, pulse: number) => {
    const r = p.size * (1 + pulse * 0.3)
    // Outer soft glow
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5)
    grd.addColorStop(0, p.color + (p.opacity * 0.9).toFixed(2) + ')')
    grd.addColorStop(0.3, p.color + (p.opacity * 0.4).toFixed(2) + ')')
    grd.addColorStop(1, p.color + '0)')
    ctx.beginPath()
    ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2)
    ctx.fillStyle = grd
    ctx.fill()
    // Core
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fillStyle = p.color + Math.min(p.opacity * 1.8, 1).toFixed(2) + ')'
    ctx.fill()
  }, [])

  const drawSpark = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.color + p.opacity.toFixed(2) + ')'
    ctx.fill()
    // Tiny glow
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
    grd.addColorStop(0, p.color + (p.opacity * 0.5).toFixed(2) + ')')
    grd.addColorStop(1, p.color + '0)')
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
    ctx.fillStyle = grd
    ctx.fill()
  }, [])

  const drawDust = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.color + (p.opacity * 0.6).toFixed(2) + ')'
    ctx.fill()
  }, [])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frameRef.current++
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const now = frameRef.current
    const W = canvas.width
    const H = canvas.height

    particlesRef.current.forEach(p => {
      // Mouse parallax repulsion (very subtle)
      const dx = p.x - mouseX
      const dy = p.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const repelRadius = 120
      if (dist < repelRadius && dist > 0) {
        const force = ((repelRadius - dist) / repelRadius) * 0.4
        p.vx += (dx / dist) * force * 0.08
        p.vy += (dy / dist) * force * 0.08
      }

      // Drift velocity damping
      p.vx *= 0.995
      p.vy *= 0.995

      // Update position
      p.x += p.vx
      p.y += p.vy

      // Opacity breathing
      const pulse = Math.sin(p.pulsePhase + now * p.pulseSpeed)
      p.opacity += p.opacityDir * 0.003
      if (p.opacity > 0.65 || p.opacity < 0.05) p.opacityDir *= -1

      // Wrap around edges smoothly
      if (p.x < -10) p.x = W + 10
      if (p.x > W + 10) p.x = -10
      if (p.y < -10) p.y = H + 10
      if (p.y > H + 10) p.y = -10

      // Draw
      ctx.save()
      if (p.type === 'orb') drawOrb(ctx, p, pulse)
      else if (p.type === 'spark') drawSpark(ctx, p)
      else drawDust(ctx, p)
      ctx.restore()
    })

    // Subtle connection lines between close orbs
    if (now % 2 === 0) { // every other frame for performance
      const orbs = particlesRef.current.filter(p => p.type === 'orb')
      for (let i = 0; i < orbs.length; i++) {
        for (let j = i + 1; j < orbs.length; j++) {
          const a = orbs[i], b = orbs[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 180) {
            const alpha = (1 - d / 180) * 0.06
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(200,162,0,${alpha.toFixed(3)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(animate)
  }, [drawOrb, drawSpark, drawDust])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight || window.innerHeight
      initParticles(canvas)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY + window.scrollY
    }

    const onMouseLeave = () => {
      mouseX = -9999
      mouseY = -9999
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [animate, initParticles])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.65,
      }}
      aria-hidden="true"
    />
  )
}