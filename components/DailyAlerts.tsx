'use client'

interface DailyAlertsProps {
  totalAlerts: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
}

export default function DailyAlerts({ totalAlerts, highRisk, mediumRisk, lowRisk }: DailyAlertsProps) {
  // Calculate percentages for the donut chart
  const total = highRisk + mediumRisk + lowRisk || 1
  const highPercent = (highRisk / total) * 100
  const mediumPercent = (mediumRisk / total) * 100
  const lowPercent = (lowRisk / total) * 100

  // SVG donut chart calculations
  const radius = 60
  const circumference = 2 * Math.PI * radius

  const highOffset = 0
  const mediumOffset = (highPercent / 100) * circumference
  const lowOffset = ((highPercent + mediumPercent) / 100) * circumference

  return (
    <div className="bg-[#0f1419] rounded-lg border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-4">Daily Alerts</h3>

      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#1a1f2e"
              strokeWidth="20"
            />

            {/* Low risk (blue) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (lowPercent / 100) * circumference}
              transform="rotate(-90 80 80)"
              style={{ transform: `rotate(${(highPercent + mediumPercent) * 3.6 - 90}deg)`, transformOrigin: '80px 80px' }}
            />

            {/* Medium risk (orange) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#f97316"
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (mediumPercent / 100) * circumference}
              transform="rotate(-90 80 80)"
              style={{ transform: `rotate(${highPercent * 3.6 - 90}deg)`, transformOrigin: '80px 80px' }}
            />

            {/* High risk (red) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (highPercent / 100) * circumference}
              transform="rotate(-90 80 80)"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{totalAlerts}</span>
            <span className="text-stone-400 text-sm">Alerts</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-stone-400">Daily</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-stone-400">Alerts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-stone-400">Daily</span>
        </div>
      </div>
    </div>
  )
}
