'use client'

import { useState, useRef, useCallback } from 'react'
import VideoUploader from '@/components/VideoUploader'
import VideoPlayer, { VideoPlayerRef } from '@/components/VideoPlayer'
import ViolationsList from '@/components/ViolationsList'
import LiveCamera from '@/components/LiveCamera'
import HighlightedFrame from '@/components/HighlightedFrame'
import { Violation } from '@/lib/types'
import { extractFrameAtTimestamp, parseTimestamp } from '@/lib/video-utils'

type Mode = 'upload' | 'live'

export default function Home() {
  const [mode, setMode] = useState<Mode>('upload')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [violations, setViolations] = useState<Violation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [status, setStatus] = useState('')
  const videoPlayerRef = useRef<VideoPlayerRef>(null)

  // Highlight modal state
  const [showHighlightModal, setShowHighlightModal] = useState(false)
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [originalFrame, setOriginalFrame] = useState<string | null>(null)
  const [highlightedFrame, setHighlightedFrame] = useState<string | null>(null)
  const [isHighlighting, setIsHighlighting] = useState(false)

  const handleVideoSelect = async (file: File) => {
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setViolations([])
    setIsAnalyzing(true)
    setStatus('Uploading and analyzing video...')

    try {
      const formData = new FormData()
      formData.append('video', file)

      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to analyze video')
      }

      const data = await response.json()
      setViolations(data.violations || [])
      setStatus(
        data.violations?.length
          ? `Found ${data.violations.length} violation(s)`
          : 'No violations detected'
      )
    } catch (error) {
      console.error('Error:', error)
      setStatus(error instanceof Error ? error.message : 'Error analyzing video')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleViolationClick = (timestamp: string) => {
    if (mode === 'upload' && videoPlayerRef.current) {
      const seconds = parseTimestamp(timestamp)
      videoPlayerRef.current.seekTo(seconds)
    }
  }

  const handleHighlightClick = async (violation: Violation) => {
    if (mode !== 'upload' || !videoPlayerRef.current) {
      setStatus('Highlighting is only available for uploaded videos')
      return
    }

    const videoElement = videoPlayerRef.current.getVideoElement()
    if (!videoElement) {
      setStatus('Video element not available')
      return
    }

    setSelectedViolation(violation)
    setShowHighlightModal(true)
    setIsHighlighting(true)
    setOriginalFrame(null)
    setHighlightedFrame(null)

    try {
      const timestamp = parseTimestamp(violation.timestamp)
      const frameBase64 = await extractFrameAtTimestamp(videoElement, timestamp)
      setOriginalFrame(frameBase64)

      const response = await fetch('/api/highlight-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frame: frameBase64,
          violation,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to highlight violation')
      }

      const data = await response.json()
      setHighlightedFrame(data.highlightedImage)
    } catch (error) {
      console.error('Error highlighting violation:', error)
      setStatus(
        error instanceof Error ? error.message : 'Error highlighting violation'
      )
    } finally {
      setIsHighlighting(false)
    }
  }

  const handleCloseHighlight = () => {
    setShowHighlightModal(false)
    setSelectedViolation(null)
    setOriginalFrame(null)
    setHighlightedFrame(null)
  }

  const handleLiveViolations = useCallback((newViolations: Violation[]) => {
    setViolations((prev) => {
      const existing = new Set(prev.map((v) => v.timestamp + v.policy_name))
      const unique = newViolations.filter(
        (v) => !existing.has(v.timestamp + v.policy_name)
      )
      return [...prev, ...unique]
    })
  }, [])

  const toggleCamera = () => {
    if (isCameraActive) {
      setIsCameraActive(false)
      setStatus('')
    } else {
      setViolations([])
      setIsCameraActive(true)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 text-xs font-medium rounded border border-amber-600/30">
                Gemini 3 Pro
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">
              Safety Violation Analyzer
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Upload footage or use live camera for real-time OSHA violation detection
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-[#141416] border border-white/10 rounded">
            <button
              onClick={() => {
                setMode('upload')
                setIsCameraActive(false)
                setViolations([])
                setStatus('')
              }}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                mode === 'upload'
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => {
                setMode('live')
                setVideoUrl(null)
                setViolations([])
                setStatus('')
              }}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                mode === 'live'
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Live Camera
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Video/Camera - 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            {/* Video Viewport */}
            <div className="device-frame">
              <div className="device-inner">
                {mode === 'upload' ? (
                  <>
                    {!videoUrl && (
                      <VideoUploader
                        onVideoSelect={handleVideoSelect}
                        isAnalyzing={isAnalyzing}
                      />
                    )}
                    {videoUrl && (
                      <VideoPlayer ref={videoPlayerRef} src={videoUrl} />
                    )}
                  </>
                ) : (
                  <LiveCamera
                    isActive={isCameraActive}
                    onViolationsDetected={handleLiveViolations}
                    onStatusChange={setStatus}
                  />
                )}
              </div>
            </div>

            {/* Controls / Status */}
            {mode === 'live' && (
              <button
                onClick={toggleCamera}
                className={`w-full py-3 rounded font-medium text-sm transition-colors ${
                  isCameraActive
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {isCameraActive ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
            )}

            {status && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#141416] border border-white/10 rounded">
                {isAnalyzing ? (
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full" />
                    <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <div className={`w-2 h-2 rounded-sm ${
                    violations.length > 0 ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                )}
                <span className="text-stone-400 text-sm">{status}</span>
              </div>
            )}
          </div>

          {/* Right: Violations - 2 cols */}
          <div className="lg:col-span-2">
            <ViolationsList
              violations={violations}
              onViolationClick={handleViolationClick}
              onHighlightClick={mode === 'upload' ? handleHighlightClick : undefined}
              isLoading={isAnalyzing}
            />
          </div>
        </div>
      </div>

      {/* Highlight Modal */}
      {showHighlightModal && (
        <HighlightedFrame
          originalFrame={originalFrame}
          highlightedFrame={highlightedFrame}
          violation={selectedViolation}
          isLoading={isHighlighting}
          onClose={handleCloseHighlight}
        />
      )}
    </main>
  )
}
