'use client'

interface QuickLinksProps {
  onGenerateReport?: () => void
  onQuickAnalysis?: () => void
}

export default function QuickLinks({ onGenerateReport, onQuickAnalysis }: QuickLinksProps) {
  return (
    <div className="bg-[#0f1419] rounded-lg border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-4">Quick Links</h3>

      <div className="space-y-2">
        <button
          onClick={onGenerateReport}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#252b3b] rounded-lg transition-colors text-left"
        >
          <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-white text-sm">Generate Shift Report</span>
        </button>

        <button
          onClick={onGenerateReport}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#252b3b] rounded-lg transition-colors text-left"
        >
          <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-white text-sm">Generate Shift Report</span>
        </button>

        <button
          onClick={onGenerateReport}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#252b3b] rounded-lg transition-colors text-left"
        >
          <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-white text-sm">Generate Shift Report</span>
        </button>

        <button
          onClick={onQuickAnalysis}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#252b3b] rounded-lg transition-colors text-left"
        >
          <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-white text-sm">Quick Analysis</span>
          <svg className="w-4 h-4 text-stone-500 ml-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
