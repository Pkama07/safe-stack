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
      if (!video) {
        console.error('Video element not found')
        return null
      }
      
      if (video.readyState < 2) {
        console.error('Video not ready, readyState:', video.readyState)
        return null
      }

      try {
        // Check if captureStream is supported
        if (!('captureStream' in video)) {
          console.error('captureStream not supported on this video element')
          return null
        }

        // Get video stream from the video element
        const stream = (video as HTMLVideoElement & { captureStream: (frameRate?: number) => MediaStream }).captureStream(30)
        
        // Check if stream has video tracks
        const videoTracks = stream.getVideoTracks()
        if (videoTracks.length === 0) {
          console.error('No video tracks in captured stream - this may be due to cross-origin restrictions')
          return null
        }
        
        console.log(`Stream captured with ${videoTracks.length} video track(s)`)
        
        // Determine supported MIME type
        let mimeType = 'video/webm'
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9'
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8'
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm'
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4'
        }
        
        console.log(`Using MIME type: ${mimeType}`)

        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        const chunks: Blob[] = []

        return new Promise((resolve) => {
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data)
              console.log(`Received chunk of size: ${event.data.size}`)
            }
          }

          mediaRecorder.onstop = async () => {
            console.log(`Recording stopped, total chunks: ${chunks.length}`)
            
            if (chunks.length === 0) {
              console.error('No data chunks recorded')
              resolve(null)
              return
            }
            
            const blob = new Blob(chunks, { type: mimeType })
            console.log(`Created blob of size: ${blob.size}`)
            
            if (blob.size === 0) {
              console.error('Blob is empty')
              resolve(null)
              return
            }
            
            // Convert blob to base64
            const reader = new FileReader()
            reader.onloadend = () => {
              const result = reader.result as string
              if (!result || !result.includes(',')) {
                console.error('Invalid FileReader result')
                resolve(null)
                return
              }
              const base64 = result.split(',')[1]
              console.log(`Converted to base64, length: ${base64.length}`)
              resolve({ base64, mimeType: mimeType.split(';')[0] })
            }
            reader.onerror = (err) => {
              console.error('FileReader error:', err)
              resolve(null)
            }
            reader.readAsDataURL(blob)
          }

          mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event)
            resolve(null)
          }

          // Start recording with timeslice to get data periodically
          mediaRecorder.start(1000) // Get data every 1 second
          console.log('MediaRecorder started')

          // Stop after specified duration
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              console.log('Stopping MediaRecorder after duration')
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
