'use client'

interface HeaderProps {
  activeHazards: number
  compliancePercent: number
}

export default function Header({ activeHazards, compliancePercent }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">SiteSight AI</span>
        </div>

        {/* Notification Bell */}
        <button className="ml-4 p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {activeHazards > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
              {activeHazards}
            </span>
          )}
        </button>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-6">
        {/* Active Hazards */}
        <div className="flex items-center gap-2">
          <span className="text-stone-400 text-sm">Active Hazards:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold">{activeHazards}</span>
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 22h20L12 2zm0 4l7.53 14H4.47L12 6zm-1 6v4h2v-4h-2zm0 6v2h2v-2h-2z" />
            </svg>
          </div>
        </div>

        {/* Compliance */}
        <div className="flex items-center gap-2">
          <span className="text-stone-400 text-sm">Compliance:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold">{compliancePercent}%</span>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}
