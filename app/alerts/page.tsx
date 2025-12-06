'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

interface Alert {
  id: number
  policy_id: number
  policy_title: string
  policy_level: number
  image_urls: string[]
  explanation: string
  timestamp: string
  user_email: string | null
}

function getLevelBadgeColor(level: number): string {
  if (level >= 7) return 'bg-red-600 text-white'
  if (level >= 6) return 'bg-orange-600 text-white'
  if (level >= 5) return 'bg-amber-600 text-white'
  return 'bg-stone-600 text-white'
}

function getLevelLabel(level: number): string {
  if (level >= 7) return 'Critical'
  if (level >= 6) return 'Serious'
  if (level >= 5) return 'Minor'
  return 'Info'
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatTimestamp(timestamp)
}

export default function AlertsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState(searchParams.get('user_email') || '')
  const [inputEmail, setInputEmail] = useState(searchParams.get('user_email') || '')

  const fetchAlerts = useCallback(async (email?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (email) {
        params.set('user_email', email)
      }
      
      const response = await fetch(`/api/alerts?${params.toString()}`)
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch alerts')
      }
      
      const data = await response.json()
      setAlerts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts(userEmail || undefined)
  }, [fetchAlerts, userEmail])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setUserEmail(inputEmail)
    
    const params = new URLSearchParams()
    if (inputEmail) {
      params.set('user_email', inputEmail)
    }
    router.push(`/alerts${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const clearFilter = () => {
    setInputEmail('')
    setUserEmail('')
    router.push('/alerts')
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight">Safety Alerts</h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Monitor and review safety violation alerts
            </p>
          </div>
          
          {/* Stats */}
          {!isLoading && !error && (
            <div className="flex items-center gap-3 text-sm">
              <div className="px-3 py-1.5 bg-[#141416] border border-white/10 rounded">
                <span className="text-stone-500">Total:</span>
                <span className="ml-1.5 text-white font-mono font-medium">{alerts.length}</span>
              </div>
              {alerts.length > 0 && (
                <>
                  <div className="px-3 py-1.5 bg-red-950/50 border border-red-900/50 rounded">
                    <span className="text-red-400">Critical:</span>
                    <span className="ml-1.5 text-red-300 font-mono font-medium">
                      {alerts.filter(a => a.policy_level >= 7).length}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-orange-950/50 border border-orange-900/50 rounded">
                    <span className="text-orange-400">Serious:</span>
                    <span className="ml-1.5 text-orange-300 font-mono font-medium">
                      {alerts.filter(a => a.policy_level >= 6 && a.policy_level < 7).length}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Search/Filter Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="Filter by user email..."
                className="w-full px-3 py-2 bg-[#141416] border border-white/10 rounded text-white text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
              />
            </div>
            <button type="submit" className="btn-primary btn-pill">
              Search
            </button>
            {userEmail && (
              <button type="button" onClick={clearFilter} className="btn-secondary btn-pill">
                Clear
              </button>
            )}
          </form>
          
          {userEmail && (
            <div className="mt-2 text-sm">
              <span className="text-stone-500">Filtering:</span>
              <span className="ml-2 px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs font-mono border border-amber-500/20">
                {userEmail}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-10 h-10 mb-4">
              <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-stone-500 text-sm">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/30 border border-red-900/50 rounded p-6 text-center">
            <p className="text-red-400 font-medium mb-2">Error Loading Alerts</p>
            <p className="text-red-400/70 text-sm mb-4">{error}</p>
            <button 
              onClick={() => fetchAlerts(userEmail || undefined)}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-[#141416] border border-white/10 rounded p-10 text-center">
            <p className="text-stone-400 font-medium mb-1">No Alerts Found</p>
            <p className="text-stone-600 text-sm">
              {userEmail 
                ? `No alerts found for ${userEmail}`
                : 'There are no alerts in the system yet'}
            </p>
          </div>
        ) : (
          /* Table View */
          <div className="bg-[#141416] border border-white/10 rounded overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_100px_140px_80px_40px] gap-4 px-4 py-3 bg-[#0a0a0b] border-b border-white/10 text-xs font-medium text-stone-500 uppercase tracking-wider">
              <div className="w-16">Level</div>
              <div>Alert</div>
              <div>User</div>
              <div>Time</div>
              <div>Evidence</div>
              <div></div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-white/5">
              {alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/alerts/${alert.id}`}
                  className="grid grid-cols-[auto_1fr_100px_140px_80px_40px] gap-4 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Level Badge */}
                  <div className="w-16">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getLevelBadgeColor(alert.policy_level)}`}>
                      L{alert.policy_level}
                    </span>
                  </div>
                  
                  {/* Alert Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-white group-hover:text-amber-400 transition-colors truncate">
                        {alert.policy_title}
                      </span>
                      <span className="text-stone-600 text-xs font-mono">#{alert.id}</span>
                    </div>
                    <p className="text-stone-500 text-sm truncate">
                      {alert.explanation}
                    </p>
                  </div>
                  
                  {/* User */}
                  <div className="text-sm text-stone-500 truncate font-mono">
                    {alert.user_email || '—'}
                  </div>
                  
                  {/* Time */}
                  <div className="text-sm text-stone-500 font-mono">
                    {formatRelativeTime(alert.timestamp)}
                  </div>
                  
                  {/* Evidence */}
                  <div className="text-sm text-stone-500">
                    {alert.image_urls && alert.image_urls.length > 0 ? (
                      <span className="text-stone-400">{alert.image_urls.length} img</span>
                    ) : (
                      <span className="text-stone-600">—</span>
                    )}
                  </div>
                  
                  {/* Arrow */}
                  <div className="text-stone-600 group-hover:text-amber-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
