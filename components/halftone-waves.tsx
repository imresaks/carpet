"use client"

import { useEffect, useRef, useState } from "react"
import WelcomeScreen from "./welcome-screen"

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [waveOpacity, setWaveOpacity] = useState(1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0
    const fadeStartTime = 3000 // Start fading after 3 seconds
    const zoomStartTime = 3000 // Start zooming at the same time as fading
    const animationStartTime = Date.now()
    let scale = 1

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawHalftoneWaves = () => {
      const currentTime = Date.now()
      const elapsedTime = currentTime - animationStartTime

      // Calculate fade and zoom progress
      let fadeProgress = 0
      let zoomProgress = 0

      if (elapsedTime > fadeStartTime) {
        fadeProgress = Math.min((elapsedTime - fadeStartTime) / 4000, 1) // 4 second fade
        setWaveOpacity(1 - fadeProgress * 0.7) // Don't fade completely to maintain some visibility during zoom
      }

      if (elapsedTime > zoomStartTime) {
        // Faster zoom - 2.5 seconds instead of 5
        zoomProgress = Math.min((elapsedTime - zoomStartTime) / 2500, 1)

        // More aggressive exponential zoom curve
        // Use cubic function for even faster acceleration toward the end
        scale = 1 + Math.pow(zoomProgress, 3) * 150 // Zoom up to 26x
      }

      // If zoom animation is complete, show welcome screen
      if (zoomProgress >= 1) {
        cancelAnimationFrame(animationFrameId)
        setTimeout(() => {
          setShowWelcome(true)
        }, 300) // Shorter delay before welcome screen
        return
      }

      // Clear and fill with black background
      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Apply zoom transformation
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(scale, scale)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)

      // Create 3 different waves
      drawWave(time, 8, 0.7)
      drawWave(time * 0.8, 12, 0.5)
      drawWave(time * 1.2, 6, 0.9)

      // Restore canvas state
      ctx.restore()

      time += 0.05
      animationFrameId = requestAnimationFrame(drawHalftoneWaves)
    }

    const drawWave = (timeOffset: number, frequency: number, scale: number) => {
      const gridSize = 20
      const rows = Math.ceil(canvas.height / gridSize)
      const cols = Math.ceil(canvas.width / gridSize)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const centerX = x * gridSize
          const centerY = y * gridSize
          const distanceFromCenter = Math.sqrt(
            Math.pow(centerX - canvas.width / 2, 2) + Math.pow(centerY - canvas.height / 2, 2),
          )
          const maxDistance = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2))
          const normalizedDistance = distanceFromCenter / maxDistance

          const waveOffset = Math.sin(normalizedDistance * frequency - timeOffset) * 0.5 + 0.5
          const dotSize = gridSize * waveOffset * scale

          ctx.beginPath()
          ctx.arc(centerX, centerY, dotSize / 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${waveOffset * 0.5 * waveOpacity})`
          ctx.fill()
        }
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    drawHalftoneWaves()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-black">
      {!showWelcome && <canvas ref={canvasRef} className="w-full h-screen bg-black absolute top-0 left-0" />}
      {showWelcome && <WelcomeScreen />}
    </div>
  )
}

