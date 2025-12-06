'use client'

import { Violation, getSeverityColor } from '@/lib/types'

interface HighlightedFrameProps {
  originalFrame: string | null
  highlightedFrame: string | null
  violation: Violation | null
  isLoading: boolean
  onClose: () => void
}

export default function HighlightedFrame({
  originalFrame,
  highlightedFrame,
  violation,
  isLoading,
  onClose,
}: HighlightedFrameProps) {
  if (!violation) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(
                violation.severity
              )}`}
            >
              {violation.severity}
            </span>
            <h2 className="text-lg font-semibold">{violation.policy_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
              <p className="text-gray-400">
                Nano Banana Pro is highlighting the violation...
              </p>
            </div>
          ) : (
            <>
              {/* Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Original Frame</p>
                  {originalFrame && (
                    <img
                      src={`data:image/jpeg;base64,${originalFrame}`}
                      alt="Original frame"
                      className="w-full rounded-lg"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    Highlighted Violation
                  </p>
                  {highlightedFrame ? (
                    <img
                      src={`data:image/png;base64,${highlightedFrame}`}
                      alt="Highlighted violation"
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Highlight not available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Violation Details */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="mb-3">
                  <p className="text-sm text-gray-400">Timestamp</p>
                  <p className="font-mono text-blue-400">{violation.timestamp}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-gray-200">{violation.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Reasoning</p>
                  <p className="text-gray-200">{violation.reasoning}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
