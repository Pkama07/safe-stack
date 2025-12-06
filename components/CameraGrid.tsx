'use client'

import CameraFeed, { Camera } from './CameraFeed'

interface CameraGridProps {
  cameras: Camera[]
  onCameraClick?: (camera: Camera) => void
}

export default function CameraGrid({ cameras, onCameraClick }: CameraGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {cameras.map((camera) => (
        <CameraFeed
          key={camera.id}
          camera={camera}
          onClick={() => onCameraClick?.(camera)}
        />
      ))}
    </div>
  )
}
