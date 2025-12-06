'use client'

export interface Alert {
  id: string
  time: string
  location: string
  camera: string
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  violationType: string
  oshaCode: string
}

interface AlertCardProps {
  alert: Alert
  onReviewClick?: () => void
}

export default function AlertCard({ alert, onReviewClick }: AlertCardProps) {
  const getRiskStyle = () => {
    switch (alert.riskLevel) {
      case 'HIGH':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'RISK: HIGH (Red)' }
      case 'MEDIUM':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'RISK: MEDIUM (Orange)' }
      case 'LOW':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'RISK: LOW (Yellow)' }
    }
  }

  const riskStyle = getRiskStyle()

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-400">{alert.time}</span>
          <span className="text-stone-600">|</span>
          <span className="text-stone-400">{alert.location}</span>
          <span className="text-stone-600">|</span>
          <span className={riskStyle.text}>{riskStyle.label}</span>
        </div>
        <button className="text-stone-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex gap-4">
        {/* Thumbnail with colored overlay */}
        <div className="w-32 h-20 rounded overflow-hidden flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-stone-700 to-stone-800" />
          {/* Simulated highlight overlay - colored silhouettes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-12 bg-purple-500/60 rounded" />
            <div className="w-10 h-8 bg-green-500/60 rounded ml-2" />
            <div className="w-6 h-10 bg-orange-500/60 rounded ml-2" />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium mb-1">{alert.violationType}</h4>
          <p className="text-stone-400 text-sm">{alert.oshaCode}</p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onReviewClick}
        className="mt-3 px-4 py-2 bg-[#2a3142] hover:bg-[#353d52] text-white text-sm font-medium rounded transition-colors"
      >
        Review Analysis
      </button>
    </div>
  )
}
