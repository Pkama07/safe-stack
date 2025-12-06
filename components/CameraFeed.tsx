'use client'

export interface Camera {
  id: string
  name: string
  location: string
  status: 'idle' | 'analyzing' | 'alert'
  streamUrl?: string
}

interface CameraFeedProps {
  camera: Camera
  onClick?: () => void
}

export default function CameraFeed({ camera, onClick }: CameraFeedProps) {
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
            src={camera.streamUrl}
            autoPlay
            loop
            muted
            playsInline
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
        {camera.status === 'analyzing' && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            ANALYZING
          </div>
        )}

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
}
