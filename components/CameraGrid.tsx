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
      
      // Capture chunks from all cameras in parallel
      const promises = cameras.map(async (camera) => {
        const cameraRef = cameraRefs.current.get(camera.id)
        const chunk = await cameraRef?.captureVideoChunk(durationMs)
        if (chunk) {
          return { cameraId: camera.id, chunk }
        }
        return null
      })

      const results = await Promise.all(promises)
      results.forEach(result => {
        if (result) {
          chunks.push(result)
        }
      })

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
