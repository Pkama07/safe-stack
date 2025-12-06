'use client'

interface DailyAlertsProps {
  totalAlerts: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
}

export default function DailyAlerts({ totalAlerts, highRisk, mediumRisk, lowRisk }: DailyAlertsProps) {
  const total = highRisk + mediumRisk + lowRisk
  const safeTotal = total > 0 ? total : 1
  const segments = [
    { label: 'High', value: highRisk, color: '#ef4444' },
    { label: 'Medium', value: mediumRisk, color: '#f97316' },
    { label: 'Low', value: lowRisk, color: '#3b82f6' },
  ]

  return (
    <div className="bg-[#0f1419] rounded-lg border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-4">Daily Alerts</h3>

      {/* Donut */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="#161b27"
              strokeWidth="18"
            />
            {(() => {
              const circumference = 2 * Math.PI * 70
              let start = 0
              return segments.map((seg) => {
                const length = (seg.value / safeTotal) * circumference
                if (length <= 0) return null
                const dasharray = `${length} ${circumference - length}`
                const offset = circumference - start
                start += length
                return (
                  <circle
                    key={seg.label}
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={dasharray}
                    strokeDashoffset={offset}
                    transform="rotate(-90 90 90)"
                  />
                )
              })
            })()}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{totalAlerts}</span>
            <span className="text-stone-400 text-sm">Alerts</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-stone-400">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-stone-400">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-stone-400">Low</span>
        </div>
      </div>
    </div>
  )
}
