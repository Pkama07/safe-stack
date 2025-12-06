'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/Header'
import CameraGrid, { CameraGridRef } from '@/components/CameraGrid'
import { Camera } from '@/components/CameraFeed'
import AlertStream from '@/components/AlertStream'
import { Alert } from '@/components/AlertCard'
import DailyAlerts from '@/components/DailyAlerts'
import { mergeAlerts } from '@/lib/alerts'

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

  const cameraGridRef = useRef<CameraGridRef>(null)
  const camerasRef = useRef<Camera[]>(initialCameras)
  const queueRef = useRef<ChunkJob[]>([])
  const activeUploadsRef = useRef(0)
  const chunkCountersRef = useRef<Record<string, number>>({})
  const captureInProgressRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Duration for video chunk capture (5 seconds)
  const CHUNK_DURATION_MS = 5000
  const CHUNK_INTERVAL_MS = 15000
  const MAX_PARALLEL_UPLOADS = Number.POSITIVE_INFINITY
  const UPLOAD_TIMEOUT_MS = 120000

  type ChunkJob = {
    cameraId: string
    base64: string
    mimeType: string
    chunkIndex: number
    startedAt: number
    durationMs: number
  }

  const base64ToBlob = (base64Data: string, mimeType: string) => {
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // Keep camera ref updated for async callbacks
  useEffect(() => {
    camerasRef.current = cameras
  }, [cameras])

  // Fetch alerts from the backend
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts?limit=100', {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setAlerts(data)
        // Cache each alert for instant detail page loading
        data.forEach((alert: Alert) => {
          sessionStorage.setItem(`alert-${alert.id}`, JSON.stringify(alert))
        })
      }
    } catch (err) {
      console.error('Error fetching alerts:', err)
    }
  }, [])

  const drainQueue = useCallback(() => {
    const startUpload = (job: ChunkJob) => {
      activeUploadsRef.current += 1

      const formData = new FormData()
      const blob = base64ToBlob(job.base64, job.mimeType)
      const filename = `camera-${job.cameraId}-chunk-${job.chunkIndex}.${job.mimeType.includes('mp4') ? 'mp4' : 'webm'}`
      formData.append('video', blob, filename)
      formData.append('mime_type', job.mimeType)
      formData.append('camera_id', job.cameraId)
      formData.append('chunk_index', String(job.chunkIndex))
      formData.append('chunk_started_at', new Date(job.startedAt).toISOString())
      formData.append('chunk_duration_ms', String(job.durationMs))

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

      fetch('/api/analyze-video', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}))
            throw new Error(payload.error || `Upload failed with status ${response.status}`)
          }

          const result = await response.json()

          if (result.alerts_created > 0) {
            setCameras((prev) =>
              prev.map((c) => (c.id === job.cameraId ? { ...c, status: 'alert' as const } : c))
            )
            // Merge returned alerts immediately for faster UI updates
            if (Array.isArray(result.alerts)) {
              const mapped = result.alerts
                .map(mapBackendAlertToUI)
                .filter((a: Alert | null) => Boolean(a))
              if (mapped.length > 0) {
                setAlerts((prev) => {
                  const next = mergeAlerts(prev, mapped)
                  next.forEach((alert) =>
                    sessionStorage.setItem(`alert-${alert.id}`, JSON.stringify(alert))
                  )
                  return next
                })
              }
            }
            // Still poll frequently to reconcile with backend
            fetchAlerts()
          } else {
            setCameras((prev) =>
              prev.map((c) => (c.id === job.cameraId ? { ...c, status: 'idle' as const } : c))
            )
          }
        })
        .catch((err) => {
          console.error(`[Camera ${job.cameraId}] upload error:`, err)
          setCameras((prev) =>
            prev.map((c) => (c.id === job.cameraId ? { ...c, status: 'idle' as const } : c))
          )
        })
        .finally(() => {
          clearTimeout(timeout)
          activeUploadsRef.current -= 1
          if (activeUploadsRef.current < 0) activeUploadsRef.current = 0
          // Kick off next queued uploads, if any
          if (queueRef.current.length > 0) {
            drainQueue()
          }
        })
    }

    while (activeUploadsRef.current < MAX_PARALLEL_UPLOADS && queueRef.current.length > 0) {
      const nextJob = queueRef.current.shift()
      if (nextJob) {
        startUpload(nextJob)
      }
    }
  }, [fetchAlerts])

  const enqueueJob = useCallback(
    (job: ChunkJob) => {
      queueRef.current.push(job)
      drainQueue()
    },
    [drainQueue]
  )

  const mapBackendAlertToUI = (incoming: any): Alert | null => {
    if (!incoming) return null
    const id = incoming.alert_id ?? incoming.id
    if (!id) return null
    return {
      id,
      policy_id: incoming.policy_id ?? -1,
      policy_title: incoming.policy_name ?? incoming.policy_title ?? 'Unknown Policy',
      policy_level: incoming.policy_level ?? 0,
      severity: incoming.severity ?? '',
      video_timestamp: incoming.video_timestamp ?? '',
      explanation: incoming.description ?? incoming.explanation ?? '',
      reasoning: incoming.reasoning ?? '',
      image_urls: incoming.image_url ? [incoming.image_url] : incoming.image_urls ?? [],
      amended_images: incoming.amended_image_url
        ? [incoming.amended_image_url]
        : incoming.amended_images ?? [],
      timestamp: incoming.timestamp ?? new Date().toISOString(),
    }
  }

  // Analyze video chunks from all cameras in parallel
  const captureChunkCycle = useCallback(async () => {
    if (captureInProgressRef.current || !cameraGridRef.current) return
    captureInProgressRef.current = true

    const captureStartedAt = Date.now()

    try {
      console.log(`Capturing parallel video chunks for ${camerasRef.current.length} cameras (${CHUNK_DURATION_MS}ms each)`)
      setCameras((prev) => prev.map((c) => ({ ...c, status: 'analyzing' as const })))

      await Promise.all(
        camerasRef.current.map(async (camera) => {
          const cameraId = camera.id

          try {
            const chunk = await cameraGridRef.current!.captureVideoChunk(cameraId, CHUNK_DURATION_MS)

            if (!chunk) {
              console.error(`[Camera ${cameraId}] Failed to capture video chunk`)
              setCameras((prev) =>
                prev.map((c) => (c.id === cameraId ? { ...c, status: 'idle' as const } : c))
              )
              return
            }

            const chunkIndex = (chunkCountersRef.current[cameraId] || 0) + 1
            chunkCountersRef.current[cameraId] = chunkIndex

            enqueueJob({
              cameraId,
              base64: chunk.base64,
              mimeType: chunk.mimeType,
              chunkIndex,
              startedAt: captureStartedAt,
              durationMs: CHUNK_DURATION_MS,
            })
          } catch (err) {
            console.error(`[Camera ${cameraId}] Error:`, err)
            setCameras((prev) =>
              prev.map((c) => (c.id === cameraId ? { ...c, status: 'idle' as const } : c))
            )
          }
        })
      )

      console.log('Chunk capture complete, queued uploads:', queueRef.current.length)
    } finally {
      captureInProgressRef.current = false
    }
  }, [enqueueJob])

  // Start recurring capture cycle
  useEffect(() => {
    // Small delay to let videos load
    const startTimer = setTimeout(() => {
      captureChunkCycle()
      intervalRef.current = setInterval(captureChunkCycle, CHUNK_INTERVAL_MS)
    }, 3000)

    return () => {
      clearTimeout(startTimer)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [captureChunkCycle])

  // Fetch alerts on mount and periodically
  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 2000)
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

  const handleGenerateReport = () => {
    console.log('Generate report')
  }

  const handleQuickAnalysis = async () => {
    await captureChunkCycle()
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <Header activeHazards={highRiskAlerts} compliancePercent={compliancePercent} />

      {/* Error Banner */}
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
            <AlertStream alerts={alerts} />
          </div>

          {/* Right Column - Widgets (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <DailyAlerts
              totalAlerts={totalAlerts}
              highRisk={highRiskAlerts}
              mediumRisk={mediumRiskAlerts}
              lowRisk={lowRiskAlerts}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
