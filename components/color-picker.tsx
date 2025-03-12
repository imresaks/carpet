"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  disabled?: boolean
}

interface HSV {
  h: number
  s: number
  v: number
}

interface RGB {
  r: number
  g: number
  b: number
}

export function ColorPicker({ color, onChange, disabled = false }: ColorPickerProps) {
  const [hsv, setHsv] = useState<HSV>({ h: 0, s: 1, v: 1 })
  const [isDraggingHue, setIsDraggingHue] = useState(false)
  const [isDraggingColor, setIsDraggingColor] = useState(false)
  const colorPanelRef = useRef<HTMLCanvasElement>(null)
  const huePanelRef = useRef<HTMLCanvasElement>(null)

  // Convert hex to HSV on initial load
  useEffect(() => {
    const rgb = hexToRgb(color)
    if (rgb) {
      const hsv = rgbToHsv(rgb)
      setHsv(hsv)
    }
  }, [])

  // Draw color panel
  useEffect(() => {
    const canvas = colorPanelRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw saturation/value gradient
    const width = canvas.width
    const height = canvas.height

    // Create base hue gradient
    const hueGradient = ctx.createLinearGradient(0, 0, width, 0)
    const rgb = hsvToRgb({ h: hsv.h, s: 1, v: 1 })
    hueGradient.addColorStop(0, "#fff")
    hueGradient.addColorStop(1, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)

    ctx.fillStyle = hueGradient
    ctx.fillRect(0, 0, width, height)

    // Create darkness gradient
    const darkGradient = ctx.createLinearGradient(0, 0, 0, height)
    darkGradient.addColorStop(0, "rgba(0, 0, 0, 0)")
    darkGradient.addColorStop(1, "rgba(0, 0, 0, 1)")

    ctx.fillStyle = darkGradient
    ctx.fillRect(0, 0, width, height)

    // Draw marker
    const markerX = hsv.s * width
    const markerY = (1 - hsv.v) * height

    ctx.beginPath()
    ctx.arc(markerX, markerY, 10, 0, 2 * Math.PI)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.stroke()
  }, [hsv])

  // Draw hue slider
  useEffect(() => {
    const canvas = huePanelRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Create hue gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    for (let i = 0; i <= 1; i += 1 / 6) {
      const rgb = hsvToRgb({ h: i * 360, s: 1, v: 1 })
      gradient.addColorStop(i, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)
    }

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Draw marker
    const markerY = (hsv.h / 360) * height

    ctx.beginPath()
    ctx.arc(width / 2, markerY, 10, 0, 2 * Math.PI)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.stroke()
  }, [hsv.h])

  const handleColorPanelMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return
    setIsDraggingColor(true)
    handleColorPanelMove(e)
  }

  const handleHuePanelMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return
    setIsDraggingHue(true)
    handleHuePanelMove(e)
  }

  const handleColorPanelMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingColor || disabled) return
    const canvas = colorPanelRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    let s = (e.clientX - rect.left) / rect.width
    let v = 1 - (e.clientY - rect.top) / rect.height

    s = Math.max(0, Math.min(1, s))
    v = Math.max(0, Math.min(1, v))

    const newHsv = { ...hsv, s, v }
    setHsv(newHsv)
    onChange(hsvToHex(newHsv))
  }

  const handleHuePanelMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingHue || disabled) return
    const canvas = huePanelRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    let h = ((e.clientY - rect.top) / rect.height) * 360

    h = Math.max(0, Math.min(360, h))

    const newHsv = { ...hsv, h }
    setHsv(newHsv)
    onChange(hsvToHex(newHsv))
  }

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDraggingColor(false)
      setIsDraggingHue(false)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingColor) {
        handleColorPanelMove(e as unknown as React.MouseEvent<HTMLCanvasElement>)
      }
      if (isDraggingHue) {
        handleHuePanelMove(e as unknown as React.MouseEvent<HTMLCanvasElement>)
      }
    }

    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isDraggingColor, isDraggingHue])

  return (
    <div className={`flex gap-4 ${disabled ? "opacity-50" : ""}`}>
      <canvas
        ref={colorPanelRef}
        width={300}
        height={300}
        className="rounded-lg cursor-pointer"
        onMouseDown={handleColorPanelMouseDown}
      />
      <canvas
        ref={huePanelRef}
        width={30}
        height={300}
        className="rounded-lg cursor-pointer"
        onMouseDown={handleHuePanelMouseDown}
      />
    </div>
  )
}

// Color conversion utilities
function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

function rgbToHsv({ r, g, b }: RGB): HSV {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s, v }
}

function hsvToRgb({ h, s, v }: HSV): RGB {
  h /= 360
  let r = 0,
    g = 0,
    b = 0

  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    case 5:
      r = v
      g = p
      b = q
      break
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function hsvToHex(hsv: HSV): string {
  const rgb = hsvToRgb(hsv)
  return `#${rgb.r.toString(16).padStart(2, "0")}${rgb.g.toString(16).padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`
}

