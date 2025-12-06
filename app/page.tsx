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

    // Open modal and show loading
    setSelectedViolation(violation)
    setShowHighlightModal(true)
    setIsHighlighting(true)
    setOriginalFrame(null)
    setHighlightedFrame(null)

    try {
      // Extract frame at violation timestamp
      const timestamp = parseTimestamp(violation.timestamp)
      const frameBase64 = await extractFrameAtTimestamp(videoElement, timestamp)
      setOriginalFrame(frameBase64)

      // Call API to highlight violation
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
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Safety Violation Analyzer</h1>
          <p className="text-gray-400">
            Upload a video or use your camera to detect OSHA safety violations
            using Gemini 3 Pro
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('upload')
              setIsCameraActive(false)
              setViolations([])
              setStatus('')
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Upload Video
          </button>
          <button
            onClick={() => {
              setMode('live')
              setVideoUrl(null)
              setViolations([])
              setStatus('')
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'live'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Live Camera
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Video/Camera */}
          <div className="space-y-4">
            {mode === 'upload' ? (
              <>
                <VideoUploader
                  onVideoSelect={handleVideoSelect}
                  isAnalyzing={isAnalyzing}
                />
                <VideoPlayer ref={videoPlayerRef} src={videoUrl} />
              </>
            ) : (
              <>
                <LiveCamera
                  isActive={isCameraActive}
                  onViolationsDetected={handleLiveViolations}
                  onStatusChange={setStatus}
                />
                <button
                  onClick={toggleCamera}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    isCameraActive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>
              </>
            )}

            {/* Status */}
            {status && (
              <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
                {isAnalyzing && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                )}
                <span className="text-gray-300">{status}</span>
              </div>
            )}
          </div>

          {/* Right Column - Violations */}
          <div>
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
