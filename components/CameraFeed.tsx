'use client'

import { useRef, useImperativeHandle, forwardRef } from 'react'

export interface Camera {
  id: string
  name: string
  location: string
  status: 'idle' | 'analyzing' | 'alert'
  streamUrl?: string
}

export interface CameraFeedRef {
  captureFrame: () => string | null
  captureVideoChunk: (durationMs: number) => Promise<{ base64: string; mimeType: string } | null>
}

interface CameraFeedProps {
  camera: Camera
  onClick?: () => void
}

const CameraFeed = forwardRef<CameraFeedRef, CameraFeedProps>(({ camera, onClick }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Expose frame capture and video chunk capture methods to parent
  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return null

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      ctx.drawImage(video, 0, 0)
      // Return base64 without the data URL prefix
      return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
    },

    captureVideoChunk: async (durationMs: number): Promise<{ base64: string; mimeType: string } | null> => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return null

      try {
        // Get video stream from the video element
        const stream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream()
        
        // Determine supported MIME type
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : 'video/mp4'

        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        const chunks: Blob[] = []

        return new Promise((resolve) => {
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data)
            }
          }

          mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: mimeType })
            
            // Convert blob to base64
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1]
              resolve({ base64, mimeType: mimeType.split(';')[0] })
            }
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
          }

          mediaRecorder.onerror = () => resolve(null)

          // Start recording
          mediaRecorder.start()

          // Stop after specified duration
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
            }
          }, durationMs)
        })
      } catch (error) {
        console.error('Error capturing video chunk:', error)
        return null
      }
    }
  }))

  const getBorderStyle = () => {
    switch (camera.status) {
      case 'alert':
        return 'border-red-500 border-2'
      case 'analyzing':
        return 'border-blue-500 border-2'
      default:
        return 'border-white/10 border'
    }
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${getBorderStyle()}`}
      onClick={onClick}
    >
      {/* Camera Feed */}
      <div className="aspect-video bg-[#1a1f2e] relative">
        {camera.streamUrl ? (
          <video
            ref={videoRef}
            src={camera.streamUrl}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
            <svg className="w-12 h-12 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        {camera.status === 'alert' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            ALERT
          </div>
        )}

        {/* Recording Indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-xs font-mono">REC</span>
        </div>

      </div>

      {/* Camera Label */}
      <div className="px-3 py-2 bg-[#0f1419]">
        <p className="text-white text-sm font-medium truncate">{camera.name}</p>
      </div>
    </div>
  )
})

CameraFeed.displayName = 'CameraFeed'

export default CameraFeed
