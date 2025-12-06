'use client'

import { Violation, getSeverityColor } from '@/lib/types'

interface ViolationsListProps {
  violations: Violation[]
  onViolationClick?: (timestamp: string) => void
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

export default function ViolationsList({
  violations,
  onViolationClick,
  isLoading,
}: ViolationsListProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Analyzing Video...</h3>
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-gray-400">
            Gemini 3 Pro is scanning for safety violations...
          </p>
        </div>
      </div>
    )
  }

  if (violations.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Violations</h3>
        <p className="text-gray-400">
          No violations detected. Upload a video to begin analysis.
        </p>
      </div>
    )
  }

  const sortedViolations = [...violations].sort(
    (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
  )

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Violations ({violations.length})
        </h3>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded">
            L5 Minor
          </span>
          <span className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded">
            L6 Serious
          </span>
          <span className="px-2 py-1 bg-red-600/20 text-red-500 rounded">
            L7 Critical
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {sortedViolations.map((violation, index) => (
          <div
            key={index}
            onClick={() => onViolationClick?.(violation.timestamp)}
            className="bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start gap-3">
              <button
                className="flex-shrink-0 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-mono"
                onClick={(e) => {
                  e.stopPropagation()
                  onViolationClick?.(violation.timestamp)
                }}
              >
                {violation.timestamp}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(
                      violation.severity
                    )}`}
                  >
                    {violation.severity}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {violation.policy_name}
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-2">
                  {violation.description}
                </p>

                <p className="text-gray-400 text-xs">
                  <span className="font-medium">Reasoning:</span>{' '}
                  {violation.reasoning}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
