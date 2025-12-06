'use client'

import Link from 'next/link'

export interface Alert {
  id: number
  policy_id: number
  policy_title: string
  policy_level: number
  severity: string
  video_timestamp: string
  explanation: string
  reasoning: string
  image_urls: string[]
  timestamp: string
}

interface AlertCardProps {
  alert: Alert
  onFeedbackClick?: () => void
}

export default function AlertCard({ alert, onFeedbackClick }: AlertCardProps) {
  const getRiskStyle = () => {
    // Map policy_level to risk display
    switch (alert.policy_level) {
      case 3:
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'RISK: HIGH' }
      case 2:
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'RISK: MEDIUM' }
      case 1:
      default:
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'RISK: LOW' }
    }
  }

  const riskStyle = getRiskStyle()

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    if (!timestamp) return ''
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return timestamp
    }
  }

  return (
    <Link
      href={`/alerts/${alert.id}`}
      className="block bg-[#1a1f2e] rounded-lg p-4 border border-white/5 cursor-pointer hover:bg-[#1f2536] hover:border-white/10 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-stone-400">{formatTime(alert.timestamp)}</span>
          {alert.video_timestamp && (
            <>
              <span className="text-stone-600">|</span>
              <span className="text-blue-400">@{alert.video_timestamp}</span>
            </>
          )}
          <span className="text-stone-600">|</span>
          <span className={riskStyle.text}>{riskStyle.label}</span>
        </div>
        {onFeedbackClick && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onFeedbackClick()
            }}
            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 p-1 rounded transition-colors"
            title="Report false positive"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-4">
        {/* Thumbnail - use actual image if available */}
        <div className="w-32 h-20 rounded overflow-hidden flex-shrink-0 relative">
          {alert.image_urls && alert.image_urls.length > 0 ? (
            <img
              src={alert.image_urls[0]}
              alt="Violation"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-stone-700 to-stone-800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium mb-1">{alert.policy_title}</h4>
          <p className="text-stone-400 text-sm line-clamp-2">{alert.explanation}</p>
          {alert.severity && (
            <p className="text-stone-500 text-xs mt-1">{alert.severity}</p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-3 flex items-center text-blue-400 text-sm font-medium group">
        <span>View Details</span>
        <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
