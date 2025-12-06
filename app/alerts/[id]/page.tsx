'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

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

function getLevelBgColor(level: number): string {
  if (level >= 7) return 'bg-red-500/10 border-red-500/30'
  if (level >= 6) return 'bg-orange-500/10 border-orange-500/30'
  if (level >= 5) return 'bg-yellow-500/10 border-yellow-500/30'
  return 'bg-slate-500/10 border-slate-500/30'
}

function getLevelTextColor(level: number): string {
  if (level >= 7) return 'text-red-400'
  if (level >= 6) return 'text-orange-400'
  if (level >= 5) return 'text-yellow-400'
  return 'text-slate-400'
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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export default function AlertDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  
  const [alert, setAlert] = useState<Alert | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchAlert = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/alerts/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Alert not found')
          }
          const data = await response.json()
          throw new Error(data.error || 'Failed to fetch alert')
        }
        
        const data = await response.json()
        setAlert(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAlert()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this alert?')) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete alert')
      }
      
      router.push('/alerts')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 border-4 border-slate-700 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="mt-6 text-slate-400 text-lg">Loading alert details...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-300 mb-3">Error</h2>
          <p className="text-red-400/80 mb-6">{error}</p>
          <Link 
            href="/alerts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Alerts
          </Link>
        </div>
      </main>
    )
  }

  if (!alert) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${getLevelColor(alert.policy_level)}`} />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 text-white/60 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={selectedImage} 
            alt="Alert evidence" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href="/alerts" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <svg 
              className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Alerts
          </Link>
        </div>

        {/* Header Card */}
        <div className={`relative overflow-hidden rounded-3xl border ${getLevelBgColor(alert.policy_level)} p-8 mb-8`}>
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${getLevelColor(alert.policy_level)} opacity-5`} />
          
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br ${getLevelColor(alert.policy_level)} shadow-lg`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-gradient-to-r ${getLevelColor(alert.policy_level)} text-white shadow-lg`}>
                      Level {alert.policy_level} · {getLevelLabel(alert.policy_level)}
                    </span>
                    <span className="text-slate-500 text-sm">
                      Alert #{alert.id}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    {alert.policy_title}
                  </h1>
                </div>
              </div>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-shrink-0 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                title="Delete alert"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTimestamp(alert.timestamp)}</span>
              </div>
              
              {alert.user_email && (
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <Link 
                    href={`/alerts?user_email=${encodeURIComponent(alert.user_email)}`}
                    className="hover:text-blue-400 transition-colors underline underline-offset-2"
                  >
                    {alert.user_email}
                  </Link>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Policy ID: {alert.policy_id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation Section */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6 mb-8">
          <h2 className="flex items-center gap-3 text-xl font-semibold text-white mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Violation Details
          </h2>
          <div className="prose prose-invert prose-slate max-w-none">
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {alert.explanation}
            </p>
          </div>
        </div>

        {/* Images Section */}
        {alert.image_urls && alert.image_urls.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-6">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-white mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Evidence Images
              <span className="ml-2 px-2 py-0.5 bg-slate-700/50 text-slate-400 text-sm font-normal rounded-full">
                {alert.image_urls.length}
              </span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {alert.image_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(url)}
                  className="group relative aspect-video bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/30 hover:border-blue-500/50 transition-all"
                >
                  <img 
                    src={url} 
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/20 backdrop-blur-sm rounded-full">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-xs rounded-md">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Severity Legend */}
        <div className="mt-8 p-4 bg-slate-800/20 border border-slate-700/20 rounded-xl">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Severity Levels</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-rose-600" />
              <span className="text-xs text-slate-500">L7+ Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-600" />
              <span className="text-xs text-slate-500">L6 Serious</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500" />
              <span className="text-xs text-slate-500">L5 Minor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-500 to-slate-600" />
              <span className="text-xs text-slate-500">L1-4 Info</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

