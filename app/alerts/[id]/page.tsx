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

function getSeverityClass(level: number): string {
  if (level >= 3) return 'severity-critical'
  if (level >= 2) return 'severity-serious'
  return 'severity-minor'
}

function getSeverityColors(level: number) {
  if (level >= 3) return { 
    bg: 'bg-[var(--color-critical-glow)]', 
    border: 'border-[var(--color-critical)]/30',
    text: 'text-[var(--color-critical)]',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]'
  }
  if (level >= 2) return { 
    bg: 'bg-[var(--color-serious-glow)]', 
    border: 'border-[var(--color-serious)]/30',
    text: 'text-[var(--color-serious)]',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]'
  }
  return { 
    bg: 'bg-[var(--color-minor-glow)]', 
    border: 'border-[var(--color-minor)]/30',
    text: 'text-[var(--color-minor)]',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]'
  }
}

function getSeverityLabel(level: number): string {
  if (level >= 3) return 'HIGH RISK'
  if (level >= 2) return 'MEDIUM RISK'
  return 'LOW RISK'
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
      window.alert(err instanceof Error ? err.message : 'Failed to delete')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0a0c10] mesh-bg flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-2 border-[var(--border-subtle)] rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-[var(--color-amber)] rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="mt-6 text-[var(--text-secondary)] font-display">Loading alert details...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0c10] mesh-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full card-dark p-8 text-center animate-scale-in relative overflow-hidden">
          <div className="severity-bar severity-critical" />
          <div className="w-16 h-16 mx-auto mb-6 bg-[var(--color-critical-glow)] rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-critical)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-display font-semibold text-[var(--color-critical)] mb-3">Error</h2>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <Link 
            href="/alerts"
            className="btn-secondary inline-flex items-center gap-2"
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

  const severityColors = getSeverityColors(alert.policy_level)

  return (
    <main className="min-h-screen bg-[#0a0c10] gradient-mesh">
      {/* Subtle decorative glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-30 bg-[var(--color-amber-glow)]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 bg-[var(--color-amber-glow)]" />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
        {/* Navigation Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in-up">
          <Link 
            href="/" 
            className="inline-flex items-center gap-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <svg 
              className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-display">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-lg font-display font-semibold text-white">SiteSight AI</span>
          </div>
        </header>

        {/* Main Alert Card */}
        <div className={`card-dark relative overflow-hidden p-6 mb-6 animate-fade-in-up delay-1 ${severityColors.glow}`}>
          {/* Severity bar */}
          <div className={`severity-bar ${getSeverityClass(alert.policy_level)}`} />
          
          <div className="pl-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-3 rounded-lg ${severityColors.bg} ${severityColors.border} border`}>
                  <svg className={`w-6 h-6 ${severityColors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-1 text-xs font-mono font-medium rounded ${severityColors.bg} ${severityColors.text} ${severityColors.border} border`}>
                      {getSeverityLabel(alert.policy_level)}
                    </span>
                    <span className="text-[var(--text-muted)] text-sm font-mono">
                      #{alert.id}
                    </span>
                  </div>
                  <h1 className="text-2xl font-display font-semibold text-[var(--text-primary)]">
                    {alert.policy_title}
                  </h1>
                </div>
              </div>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-shrink-0 p-2.5 text-[var(--color-critical)] hover:bg-[var(--color-critical-glow)] rounded-lg transition-all disabled:opacity-50"
                title="Delete alert"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-[var(--color-critical)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-5 text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg className="w-4 h-4 text-[var(--color-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono text-xs">{formatTimestamp(alert.timestamp)}</span>
              </div>
              
              {alert.user_email && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <svg className="w-4 h-4 text-[var(--color-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <Link 
                    href={`/alerts?user_email=${encodeURIComponent(alert.user_email)}`}
                    className="font-mono text-xs hover:text-[var(--color-amber)] transition-colors underline underline-offset-2"
                  >
                    {alert.user_email}
                  </Link>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <svg className="w-4 h-4 text-[var(--color-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-mono text-xs">Policy #{alert.policy_id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation Section */}
        <div className="card-dark p-6 mb-6 animate-fade-in-up delay-2">
          <h2 className="flex items-center gap-3 text-lg font-display font-semibold text-[var(--text-primary)] mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-amber-glow)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--color-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Violation Details
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap pl-11">
            {alert.explanation}
          </p>
        </div>

        {/* Images Section */}
        {alert.image_urls && alert.image_urls.length > 0 && (
          <div className="card-dark p-6 animate-fade-in-up delay-3">
            <h2 className="flex items-center gap-3 text-lg font-display font-semibold text-[var(--text-primary)] mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-clear-glow)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--color-clear)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Evidence Images
              <span className="ml-2 px-2 py-0.5 bg-[var(--color-charcoal-lighter)] text-[var(--text-muted)] text-xs font-mono rounded">
                {alert.image_urls.length}
              </span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pl-11">
              {alert.image_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(url)}
                  className="device-frame group relative aspect-video overflow-hidden"
                >
                  <div className="device-inner w-full h-full">
                    <img 
                      src={url} 
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--color-amber)]/20 backdrop-blur-sm rounded-lg">
                      <svg className="w-5 h-5 text-[var(--color-amber)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-mono rounded">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Severity Legend */}
        <div className="mt-6 p-4 border border-[var(--border-subtle)] rounded-lg animate-fade-in-up delay-4">
          <h3 className="text-xs font-display font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Risk Levels</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-[var(--color-critical)] to-red-700" />
              <span className="text-xs text-[var(--text-muted)] font-mono">HIGH RISK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-[var(--color-serious)] to-orange-700" />
              <span className="text-xs text-[var(--text-muted)] font-mono">MEDIUM RISK</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-[var(--color-minor)] to-yellow-700" />
              <span className="text-xs text-[var(--text-muted)] font-mono">LOW RISK</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
