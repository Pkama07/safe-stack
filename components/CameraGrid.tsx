'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import CameraFeed, { Camera, CameraFeedRef } from './CameraFeed'

export interface CameraGridRef {
  captureFrame: (cameraId: string) => string | null
  captureAllFrames: () => Array<{ cameraId: string; frame: string }>
  captureVideoChunk: (cameraId: string, durationMs: number) => Promise<{ base64: string; mimeType: string } | null>
  captureAllVideoChunks: (durationMs: number) => Promise<Array<{ cameraId: string; chunk: { base64: string; mimeType: string } }>>
}

interface CameraGridProps {
  cameras: Camera[]
  onCameraClick?: (camera: Camera) => void
}

const CameraGrid = forwardRef<CameraGridRef, CameraGridProps>(({ cameras, onCameraClick }, ref) => {
  const cameraRefs = useRef<Map<string, CameraFeedRef>>(new Map())

  useImperativeHandle(ref, () => ({
    captureFrame: (cameraId: string) => {
      const cameraRef = cameraRefs.current.get(cameraId)
      return cameraRef?.captureFrame() || null
    },
    captureAllFrames: () => {
      const frames: Array<{ cameraId: string; frame: string }> = []
      cameras.forEach(camera => {
        const cameraRef = cameraRefs.current.get(camera.id)
        const frame = cameraRef?.captureFrame()
        if (frame) {
          frames.push({ cameraId: camera.id, frame })
        }
      })
      return frames
    },
    captureVideoChunk: async (cameraId: string, durationMs: number) => {
      const cameraRef = cameraRefs.current.get(cameraId)
      return cameraRef?.captureVideoChunk(durationMs) || null
    },
    captureAllVideoChunks: async (durationMs: number) => {
      const chunks: Array<{ cameraId: string; chunk: { base64: string; mimeType: string } }> = []
      
      console.log(`Starting video capture from ${cameras.length} cameras for ${durationMs}ms each`)
      
      // Capture chunks from all cameras SEQUENTIALLY to avoid overwhelming the browser
      // This is more reliable than parallel capture which can cause issues with MediaRecorder
      for (const camera of cameras) {
        console.log(`[Camera ${camera.id}] Starting capture...`)
        const cameraRef = cameraRefs.current.get(camera.id)
        
        if (!cameraRef) {
          console.error(`[Camera ${camera.id}] No ref found in cameraRefs map`)
          continue
        }
        
        try {
          const chunk = await cameraRef.captureVideoChunk(durationMs)
          if (chunk) {
            console.log(`[Camera ${camera.id}] Capture successful, base64 length: ${chunk.base64.length}`)
            chunks.push({ cameraId: camera.id, chunk })
          } else {
            console.error(`[Camera ${camera.id}] Capture returned null`)
          }
        } catch (error) {
          console.error(`[Camera ${camera.id}] Capture error:`, error)
        }
        
        // Small delay between captures to let browser resources settle
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`Video capture complete: ${chunks.length}/${cameras.length} cameras successful`)
      return chunks
    }
  }))

  return (
    <div className="grid grid-cols-2 gap-4">
      {cameras.map((camera) => (
        <CameraFeed
          key={camera.id}
          ref={(el) => {
            if (el) {
              cameraRefs.current.set(camera.id, el)
            } else {
              cameraRefs.current.delete(camera.id)
            }
          }}
          camera={camera}
          onClick={() => onCameraClick?.(camera)}
        />
      ))}
    </div>
  )
})

CameraGrid.displayName = 'CameraGrid'

export default CameraGrid
