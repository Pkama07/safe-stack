'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Violation } from '@/lib/types'

interface LiveCameraProps {
  isActive: boolean
  onViolationsDetected: (violations: Violation[]) => void
  onStatusChange: (status: string) => void
}

export default function LiveCamera({
  isActive,
  onViolationsDetected,
  onStatusChange,
}: LiveCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const startTimeRef = useRef<number>(0)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const frameData = canvas.toDataURL('image/jpeg', 0.8)
    const base64Data = frameData.split(',')[1]
    const currentTimestamp = formatTime(elapsedTime)

    setIsScanning(true)
    onStatusChange(`Analyzing frame at ${currentTimestamp}...`)

    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frame: base64Data,
          timestamp: currentTimestamp,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.violations && data.violations.length > 0) {
          onViolationsDetected(data.violations)
        }
        onStatusChange('Monitoring...')
      }
    } catch (error) {
      console.error('Error analyzing frame:', error)
      onStatusChange('Error analyzing frame')
    } finally {
      setIsScanning(false)
    }
  }, [elapsedTime, onViolationsDetected, onStatusChange])

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now()

      navigator.mediaDevices
        .getUserMedia({ video: { width: 1280, height: 720 } })
        .then((stream) => {
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
          onStatusChange('Camera active - Monitoring...')

          intervalRef.current = setInterval(() => {
            captureAndAnalyze()
          }, 5000)
        })
        .catch((err) => {
          console.error('Error accessing camera:', err)
          onStatusChange('Error: Could not access camera')
        })

      const timeInterval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      return () => {
        clearInterval(timeInterval)
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsedTime(0)
      onStatusChange('')
    }
  }, [isActive, onStatusChange, captureAndAnalyze])

  return (
    <div className="relative aspect-video bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      {!isActive && (
        <div className="absolute inset-0 bg-[#0a0a0b] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center border border-white/10 rounded">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-stone-600 text-sm">Click Start to begin</p>
          </div>
        </div>
      )}

      {isActive && (
        <>
          {/* Scanning indicator */}
          {isScanning && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500 animate-pulse" />
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2">
              {/* Live badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded text-xs font-medium text-white">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>

              {/* Timer */}
              <div className="px-2 py-1 bg-black/50 rounded text-xs font-mono text-white">
                {formatTime(elapsedTime)}
              </div>
            </div>

            {isScanning && (
              <div className="px-2 py-1 bg-amber-600/80 rounded text-xs font-medium text-white">
                Analyzing
              </div>
            )}
          </div>

          {/* Corner markers */}
          <div className="absolute inset-3 pointer-events-none">
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-amber-500/60" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-amber-500/60" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-amber-500/60" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-amber-500/60" />
          </div>
        </>
      )}
    </div>
  )
}
