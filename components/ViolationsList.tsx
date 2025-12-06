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

export default function ViolationsList({
  violations,
  onViolationClick,
  onHighlightClick,
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
            Severity 1
          </span>
          <span className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded">
            Severity 2
          </span>
          <span className="px-2 py-1 bg-red-600/20 text-red-500 rounded">
            Severity 3
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {sortedViolations.map((violation, index) => (
          <div
            key={index}
            className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-mono"
                  onClick={() => onViolationClick?.(violation.timestamp)}
                >
                  {violation.timestamp}
                </button>
                {onHighlightClick && (
                  <button
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium flex items-center gap-1"
                    onClick={() => onHighlightClick(violation)}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Highlight
                  </button>
                )}
              </div>

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
