'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/Header'
import CameraGrid, { CameraGridRef } from '@/components/CameraGrid'
import { Camera } from '@/components/CameraFeed'
import AlertStream from '@/components/AlertStream'
import { Alert } from '@/components/AlertCard'
import DailyAlerts from '@/components/DailyAlerts'
import QuickLinks from '@/components/QuickLinks'

// Initial camera configurations with video stream URLs
const initialCameras: Camera[] = [
  { id: '1', name: 'Loading Dock B - Cam 1', location: 'Loading Dock B', status: 'idle', streamUrl: 'https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/object/public/uploads-bucket/cam1_video.mp4' },
  { id: '2', name: 'Loading Dock B - Cam 2', location: 'Loading Dock B', status: 'idle', streamUrl: 'https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/object/public/uploads-bucket/cam2_video.mp4' },
  { id: '3', name: 'Loading Dock B - Cam 3', location: 'Loading Dock B', status: 'idle', streamUrl: 'https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/object/public/uploads-bucket/cam3_video.mp4' },
  { id: '4', name: 'Loading Dock B - Cam 4', location: 'Loading Dock B', status: 'idle', streamUrl: 'https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/object/public/uploads-bucket/cam4_video.mp4' },
  { id: '5', name: 'Loading Dock B - Cam 5', location: 'Loading Dock B', status: 'idle', streamUrl: 'https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/object/public/uploads-bucket/cam5_video.mp4' },
  { id: '6', name: 'Loading Dock B - Cam 6', location: 'Loading Dock B', status: 'idle', streamUrl: 'https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/object/public/uploads-bucket/cam6_video.mp4' },
]

export default function Home() {
  const [cameras, setCameras] = useState<Camera[]>(initialCameras)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [error, setError] = useState<string | null>(null)

  const cameraGridRef = useRef<CameraGridRef>(null)
  const isAnalyzingRef = useRef(false)

  // Fetch alerts from the backend
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts?limit=50')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data)
      }
    } catch (err) {
      console.error('Error fetching alerts:', err)
    }
  }, [])

  // Analyze frames from all cameras
  const analyzeFrames = useCallback(async () => {
    if (isAnalyzingRef.current || !cameraGridRef.current) return
    isAnalyzingRef.current = true

    try {
      // Capture frames from all cameras
      const frames = cameraGridRef.current.captureAllFrames()

      // Analyze each frame
      for (const { cameraId, frame } of frames) {
        const camera = cameras.find(c => c.id === cameraId)
        if (!camera) continue

        try {
          const response = await fetch('/api/analyze-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              frame,
              camera_id: cameraId,
              camera_name: camera.name,
            }),
          })

          if (response.ok) {
            const result = await response.json()

            // Update camera status if violations found
            if (result.alerts_created > 0) {
              setCameras(prev =>
                prev.map(c =>
                  c.id === cameraId ? { ...c, status: 'alert' as const } : c
                )
              )
            }
          }
        } catch (err) {
          console.error(`Error analyzing camera ${cameraId}:`, err)
        }
      }

      // Refresh alerts after analysis
      await fetchAlerts()
    } finally {
      isAnalyzingRef.current = false
    }
  }, [cameras, fetchAlerts])

  // Run frame analysis every 5 seconds
  useEffect(() => {
    // Initial delay to let videos load
    const initialTimer = setTimeout(() => {
      analyzeFrames()
    }, 3000)

    // Then run every 5 seconds
    const interval = setInterval(analyzeFrames, 5000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [analyzeFrames])

  // Fetch alerts on mount and periodically
  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 5000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  // Calculate metrics from real alerts
  const highRiskAlerts = alerts.filter(a => a.policy_level === 3).length
  const mediumRiskAlerts = alerts.filter(a => a.policy_level === 2).length
  const lowRiskAlerts = alerts.filter(a => a.policy_level === 1).length
  const totalAlerts = alerts.length
  const compliancePercent = totalAlerts > 0
    ? Math.round(100 - (highRiskAlerts / totalAlerts) * 100)
    : 100

  const handleCameraClick = (camera: Camera) => {
    console.log('Camera clicked:', camera)
  }

  const handleReviewAlert = (alert: Alert) => {
    console.log('Review alert:', alert)
    if (alert.image_urls && alert.image_urls.length > 0) {
      window.open(alert.image_urls[0], '_blank')
    }
  }

  const handleGenerateReport = () => {
    console.log('Generate report')
  }

  const handleQuickAnalysis = async () => {
    // Trigger immediate analysis
    await analyzeFrames()
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <Header activeHazards={highRiskAlerts} compliancePercent={compliancePercent} />

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="p-6">
        <div className="grid grid-cols-12 gap-6 max-w-[1800px] mx-auto">
          {/* Left Column - Camera Grid (5 cols) */}
          <div className="col-span-12 lg:col-span-5">
            <CameraGrid
              ref={cameraGridRef}
              cameras={cameras}
              onCameraClick={handleCameraClick}
            />
          </div>

          {/* Middle Column - Alert Stream (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <AlertStream alerts={alerts} onReviewClick={handleReviewAlert} />
          </div>

          {/* Right Column - Widgets (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <DailyAlerts
              totalAlerts={totalAlerts}
              highRisk={highRiskAlerts}
              mediumRisk={mediumRiskAlerts}
              lowRisk={lowRiskAlerts}
            />
            <QuickLinks
              onGenerateReport={handleGenerateReport}
              onQuickAnalysis={handleQuickAnalysis}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
