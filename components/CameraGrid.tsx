'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import CameraFeed, { Camera, CameraFeedRef } from './CameraFeed'

export interface CameraGridRef {
  captureFrame: (cameraId: string) => string | null
  captureAllFrames: () => Array<{ cameraId: string; frame: string }>
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
