'use client'

import AlertCard, { Alert } from './AlertCard'

interface AlertStreamProps {
  alerts: Alert[]
}

export default function AlertStream({ alerts }: AlertStreamProps) {
  return (
    <div className="bg-[#0f1419] rounded-lg border border-white/10 max-h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-white font-semibold">Alert Stream</h2>
        <select className="bg-[#1a1f2e] border border-white/10 rounded px-3 py-1.5 text-sm text-stone-300 focus:outline-none focus:border-blue-500">
          <option>All alerts</option>
          <option>High Risk</option>
          <option>Medium Risk</option>
          <option>Low Risk</option>
        </select>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-stone-500 text-sm">No alerts to display</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
            />
          ))
        )}
      </div>
    </div>
  )
}
