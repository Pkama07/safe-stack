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
      <div className="bg-[#141416] border border-white/10 rounded-lg">
        <div className="px-5 py-3 border-b border-white/10">
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
      <div className="bg-[#141416] border border-white/10 rounded-lg">
        <div className="px-5 py-3 border-b border-white/10">
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
    <div className="bg-[#141416] border border-white/10 rounded-lg">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-medium text-white text-sm">
          Violations
          <span className="ml-2 text-stone-500 font-mono text-xs">({violations.length})</span>
        </h3>
        <div className="flex items-center gap-4 text-[10px] text-stone-500">
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
      <div className="grid grid-cols-[56px_60px_1fr] gap-6 px-4 py-2 bg-[#0a0a0b] border-b border-white/10 text-[10px] text-stone-500 uppercase tracking-wider">
        <div>Time</div>
        <div>Severity</div>
        <div>Details</div>
      </div>

      {/* Violations List */}
      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
        {sortedViolations.map((violation, index) => {
          const styles = getSeverityStyles(violation.severity)
          
          return (
            <div
              key={index}
              className={`grid grid-cols-[56px_60px_1fr] gap-6 px-4 py-3 border-l-2 ${styles.border} hover:bg-white/[0.02] transition-colors`}
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
                <div className="mb-1.5">
                  {onHighlightClick ? (
                    <button
                      className="text-sm font-medium text-white leading-snug hover:text-violet-400 transition-colors text-left"
                      onClick={() => onHighlightClick(violation)}
                    >
                      {violation.policy_name}
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-white leading-snug">
                      {violation.policy_name}
                    </span>
                  )}
                </div>
                <p className="text-stone-400 text-sm leading-relaxed mb-1">
                  {violation.description}
                </p>
                <p className="text-stone-500 text-xs leading-relaxed">
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
