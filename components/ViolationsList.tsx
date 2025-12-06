'use client'

import { Violation, getSeverityColor } from '@/lib/types'

interface ViolationsListProps {
  violations: Violation[]
  onViolationClick?: (timestamp: string) => void
  onHighlightClick?: (violation: Violation) => void
  isLoading?: boolean
}

function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'Severity 3':
      return {
        badge: 'bg-red-600 text-white',
        border: 'border-l-red-600',
      }
    case 'Severity 2':
      return {
        badge: 'bg-orange-600 text-white',
        border: 'border-l-orange-600',
      }
    default:
      return {
        badge: 'bg-amber-600 text-white',
        border: 'border-l-amber-600',
      }
  }
}

export default function ViolationsList({
  violations,
  onViolationClick,
  onHighlightClick,
  isLoading,
}: ViolationsListProps) {
  if (isLoading) {
    return (
      <div className="bg-[#141416] border border-white/10 rounded">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="font-medium text-white text-sm">Analyzing Video</h3>
        </div>
        <div className="p-6 flex items-center gap-3">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full" />
            <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-stone-400 text-sm">
            Scanning for safety violations...
          </p>
        </div>
      </div>
    )
  }

  if (violations.length === 0) {
    return (
      <div className="bg-[#141416] border border-white/10 rounded">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="font-medium text-white text-sm">Violations</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-stone-500 text-sm">
            No violations detected. Upload a video to begin analysis.
          </p>
        </div>
      </div>
    )
  }

  const sortedViolations = [...violations].sort(
    (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
  )

  return (
    <div className="bg-[#141416] border border-white/10 rounded">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-medium text-white text-sm">
          Violations
          <span className="ml-2 text-stone-500 font-mono">({violations.length})</span>
        </h3>
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-amber-600" />
            <span>S1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-orange-600" />
            <span>S2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-red-600" />
            <span>S3</span>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[80px_80px_1fr] gap-3 px-4 py-2 bg-[#0a0a0b] border-b border-white/10 text-xs text-stone-500 uppercase tracking-wider">
        <div>Time</div>
        <div>Severity</div>
        <div>Details</div>
      </div>

      {/* Violations List */}
      <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
        {sortedViolations.map((violation, index) => {
          const styles = getSeverityStyles(violation.severity)
          
          return (
            <div
              key={index}
              className={`grid grid-cols-[80px_80px_1fr] gap-3 px-4 py-3 border-l-2 ${styles.border} hover:bg-white/[0.02] transition-colors`}
            >
              {/* Timestamp */}
              <div>
                <button
                  className="px-2 py-1 bg-[#0a0a0b] hover:bg-[#1c1c1f] border border-white/10 rounded text-xs font-mono text-white transition-colors"
                  onClick={() => onViolationClick?.(violation.timestamp)}
                >
                  {violation.timestamp}
                </button>
              </div>
              
              {/* Severity */}
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${styles.badge}`}>
                  {violation.severity.replace('Severity ', 'S')}
                </span>
              </div>
              
              {/* Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white truncate">
                    {violation.policy_name}
                  </span>
                  {onHighlightClick && (
                    <button
                      className="px-2 py-0.5 bg-violet-600 hover:bg-violet-500 rounded text-xs font-medium text-white flex items-center gap-1 transition-colors flex-shrink-0"
                      onClick={() => onHighlightClick(violation)}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  )}
                </div>
                <p className="text-stone-400 text-xs mb-1 line-clamp-1">
                  {violation.description}
                </p>
                <p className="text-stone-600 text-xs line-clamp-1">
                  {violation.reasoning}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
