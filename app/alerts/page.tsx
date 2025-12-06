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

function getLevelColor(level: number): string {
  if (level >= 7) return 'from-red-500 to-rose-600'
  if (level >= 6) return 'from-orange-500 to-amber-600'
  if (level >= 5) return 'from-yellow-500 to-amber-500'
  return 'from-slate-500 to-slate-600'
}

function getLevelBadgeColor(level: number): string {
  if (level >= 7) return 'bg-red-500/20 text-red-300 border-red-500/30'
  if (level >= 6) return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  if (level >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
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
    
    // Update URL params
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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
          >
            <svg 
              className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analyzer
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Safety Alerts</h1>
              <p className="text-slate-400 mt-1">
                Monitor and review safety violation alerts
              </p>
            </div>
          </div>
        </div>

        {/* Search/Filter Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="Filter by user email..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            >
              Search
            </button>
            {userEmail && (
              <button
                type="button"
                onClick={clearFilter}
                className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors border border-slate-600/50"
              >
                Clear
              </button>
            )}
          </form>
          
          {userEmail && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-slate-400">Filtering by:</span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                {userEmail}
              </span>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        {!isLoading && !error && (
          <div className="mb-6 flex items-center gap-4">
            <div className="px-4 py-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <span className="text-slate-400 text-sm">Total Alerts:</span>
              <span className="ml-2 text-white font-semibold">{alerts.length}</span>
            </div>
            {alerts.length > 0 && (
              <>
                <div className="px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-red-400 text-sm">Critical:</span>
                  <span className="ml-2 text-red-300 font-semibold">
                    {alerts.filter(a => a.policy_level >= 7).length}
                  </span>
                </div>
                <div className="px-4 py-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <span className="text-orange-400 text-sm">Serious:</span>
                  <span className="ml-2 text-orange-300 font-semibold">
                    {alerts.filter(a => a.policy_level >= 6 && a.policy_level < 7).length}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-700 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-6 text-slate-400">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-300 mb-2">Error Loading Alerts</h3>
            <p className="text-red-400/80">{error}</p>
            <button 
              onClick={() => fetchAlerts(userEmail || undefined)}
              className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-700/30 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Alerts Found</h3>
            <p className="text-slate-500">
              {userEmail 
                ? `No alerts found for ${userEmail}`
                : 'There are no alerts in the system yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <Link
                key={alert.id}
                href={`/alerts/${alert.id}`}
                className="block group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative overflow-hidden bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-5 transition-all duration-300 hover:bg-slate-800/60 hover:border-slate-600/50 hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-0.5">
                  {/* Gradient accent line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${getLevelColor(alert.policy_level)}`} />
                  
                  <div className="flex items-start gap-4 pl-3">
                    {/* Alert icon */}
                    <div className={`flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br ${getLevelColor(alert.policy_level)} shadow-lg`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                          {alert.policy_title}
                        </h3>
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getLevelBadgeColor(alert.policy_level)}`}>
                          L{alert.policy_level} · {getLevelLabel(alert.policy_level)}
                        </span>
                      </div>
                      
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                        {alert.explanation}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatRelativeTime(alert.timestamp)}
                        </span>
                        {alert.user_email && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {alert.user_email}
                          </span>
                        )}
                        {alert.image_urls && alert.image_urls.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {alert.image_urls.length} image{alert.image_urls.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-slate-600">
                          #{alert.id}
                        </span>
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="flex-shrink-0 text-slate-600 group-hover:text-blue-400 transition-colors">
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

