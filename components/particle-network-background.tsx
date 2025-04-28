"use client"

import { useEffect, useRef } from "react"

export function ParticleNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Particle class
    class Particle {
      x: number
      y: number
      size: number
      baseSize: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.baseSize = Math.random() * 5 + 1
        this.size = this.baseSize
        // Reduced speed by 75% - much slower movement
        this.speedX = (Math.random() * 3 - 1.5) * 0.25
        this.speedY = (Math.random() * 3 - 1.5) * 0.25
        this.color = `hsla(${Math.random() * 60 + 120}, 80%, 50%, 0.8)` // Green hues
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        else if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        else if (this.y < 0) this.y = canvas.height
      }

      draw() {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Create particles
    const particlesArray: Particle[] = []
    const numberOfParticles = Math.min(100, Math.floor((canvas.width * canvas.height) / 9000))

    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle())
    }

    // Connect particles with lines
    function connect() {
      const maxDistance = 150
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x
          const dy = particlesArray[a].y - particlesArray[b].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < maxDistance) {
            const opacity = 1 - distance / maxDistance
            ctx.strokeStyle = `rgba(100, 255, 150, ${opacity * 0.4})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y)
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y)
            ctx.stroke()
          }
        }
      }
    }

    // Create ripple effect
    function createRipple(x: number, y: number) {
      // Create burst of particles
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 5 + 2
        const size = Math.random() * 4 + 2

        const particle = new Particle()
        particle.x = x
        particle.y = y
        particle.size = size
        // Slow down the burst particles too
        particle.speedX = Math.cos(angle) * speed * 0.25
        particle.speedY = Math.sin(angle) * speed * 0.25
        particle.color = `hsla(${Math.random() * 60 + 120}, 100%, 70%, 0.9)` // Bright green

        particlesArray.push(particle)

        // Remove oldest particles if we have too many
        if (particlesArray.length > numberOfParticles + 50) {
          particlesArray.splice(0, 8)
        }
      }
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update()
        particlesArray[i].draw()
      }

      connect()
      requestAnimationFrame(animate)
    }

    animate()

    // Mouse interaction
    function handleMouseMove(event: MouseEvent) {
      const mouseX = event.clientX
      const mouseY = event.clientY

      // Create particles along mouse path
      if (Math.random() < 0.3) {
        // 30% chance to create a particle
        const particle = new Particle()
        particle.x = mouseX
        particle.y = mouseY
        particle.size = Math.random() * 3 + 2
        particle.color = `hsla(${Math.random() * 60 + 120}, 90%, 60%, 0.9)` // Brighter green
        // Slow down the mouse-created particles too
        particle.speedX = (Math.random() * 3 - 1.5) * 0.25
        particle.speedY = (Math.random() * 3 - 1.5) * 0.25
        particlesArray.push(particle)

        // Remove oldest particles if we have too many
        if (particlesArray.length > numberOfParticles + 20) {
          particlesArray.splice(0, 1)
        }
      }
    }

    function handleClick(event: MouseEvent) {
      const clickX = event.clientX
      const clickY = event.clientY

      // Create ripple effect
      createRipple(clickX, clickY)
    }

    // Add event listeners directly to window to ensure they work
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 pointer-events-auto"
    />
  )
}
