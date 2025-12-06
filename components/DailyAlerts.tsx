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

  const highLength = (highPercent / 100) * circumference
  const mediumLength = (mediumPercent / 100) * circumference
  const lowLength = (lowPercent / 100) * circumference

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
              stroke="#1c2230"
              strokeWidth="20"
            />

            {/* High risk (red) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeDasharray={`${highLength} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              transform="rotate(-90 80 80)"
            />

            {/* Medium risk (orange) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#f97316"
              strokeWidth="20"
              strokeDasharray={`${mediumLength} ${circumference}`}
              strokeDashoffset={circumference * 0.25 + highLength}
              transform="rotate(-90 80 80)"
            />

            {/* Low risk (blue) */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="20"
              strokeDasharray={`${lowLength} ${circumference}`}
              strokeDashoffset={circumference * 0.25 + highLength + mediumLength}
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
