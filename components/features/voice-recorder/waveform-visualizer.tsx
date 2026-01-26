'use client'

import { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  analyser: AnalyserNode | null
  dataArray: Uint8Array | null
  isActive: boolean
}

export function WaveformVisualizer({
  analyser,
  dataArray,
  isActive,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!analyser || !dataArray || !isActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (!analyser || !dataArray || !isActive) return

      analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)

      const width = canvas.width
      const height = canvas.height

      ctx.fillStyle = 'rgb(249, 250, 251)' // Light background
      ctx.fillRect(0, 0, width, height)

      const barWidth = width / dataArray.length * 2.5
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8

        // Create gradient for waveform bars
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
        gradient.addColorStop(0, 'rgb(59, 130, 246)') // Blue
        gradient.addColorStop(1, 'rgb(99, 102, 241)') // Indigo

        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [analyser, dataArray, isActive])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={128}
      className="w-full h-full rounded"
    />
  )
}
