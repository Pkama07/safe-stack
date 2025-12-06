'use client'

import { Violation, getSeverityColor } from '@/lib/types'

interface HighlightedFrameProps {
  originalFrame: string | null
  highlightedFrame: string | null
  violation: Violation | null
  isLoading: boolean
  onClose: () => void
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'Severity 3':
      return 'bg-red-600 text-white'
    case 'Severity 2':
      return 'bg-orange-600 text-white'
    default:
      return 'bg-amber-600 text-white'
  }
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-[#141416] border border-white/10 rounded"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a0b]">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityBadge(violation.severity)}`}>
              {violation.severity}
            </span>
            <h2 className="font-medium text-white text-sm">{violation.policy_name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-10 h-10 mb-4">
                <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin" />
              </div>
              <p className="text-stone-400 text-sm">Analyzing frame...</p>
            </div>
          ) : (
            <>
              {/* Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-stone-500 text-xs uppercase tracking-wider mb-2">Original Frame</p>
                  {originalFrame ? (
                    <div className="bg-black rounded overflow-hidden border border-white/10">
                      <img
                        src={`data:image/jpeg;base64,${originalFrame}`}
                        alt="Original frame"
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-[#0a0a0b] rounded border border-white/10 flex items-center justify-center">
                      <p className="text-stone-600 text-sm">Loading...</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-stone-500 text-xs uppercase tracking-wider mb-2">Highlighted Violation</p>
                  {highlightedFrame ? (
                    <div className="bg-black rounded overflow-hidden border border-amber-500/50">
                      <img
                        src={`data:image/png;base64,${highlightedFrame}`}
                        alt="Highlighted violation"
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-[#0a0a0b] rounded border border-white/10 flex items-center justify-center">
                      <p className="text-stone-600 text-sm">Not available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4 bg-[#0a0a0b] rounded p-4 border border-white/5">
                <div>
                  <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Timestamp</p>
                  <p className="font-mono text-white text-sm">{violation.timestamp}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Description</p>
                  <p className="text-stone-300 text-sm">{violation.description}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">AI Reasoning</p>
                  <p className="text-stone-400 text-sm">{violation.reasoning}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-white/10 bg-[#0a0a0b]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded text-sm text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
