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
    weekday: 'short',
    month: 'short',
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
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block w-10 h-10 mb-4">
            <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-stone-500 text-sm">Loading alert...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-950/30 border border-red-900/50 rounded p-6 text-center">
          <p className="text-red-400 font-medium mb-2">Error</p>
          <p className="text-red-400/70 text-sm mb-4">{error}</p>
          <Link 
            href="/alerts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#141416] border border-white/10 text-white rounded text-sm hover:bg-white/5 transition-colors"
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
    <main className="min-h-screen">
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={selectedImage} 
            alt="Alert evidence" 
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/alerts" 
            className="inline-flex items-center gap-1.5 text-stone-500 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Alerts
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded ${getLevelBadgeColor(alert.policy_level)}`}>
                L{alert.policy_level} · {getLevelLabel(alert.policy_level)}
              </span>
              <span className="text-stone-600 text-sm font-mono">#{alert.id}</span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-white">
              {alert.policy_title}
            </h1>
          </div>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Delete
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#141416] border border-white/10 rounded p-4">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Timestamp</p>
            <p className="text-white font-mono text-sm">{formatTimestamp(alert.timestamp)}</p>
          </div>
          <div className="bg-[#141416] border border-white/10 rounded p-4">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">User</p>
            {alert.user_email ? (
              <Link 
                href={`/alerts?user_email=${encodeURIComponent(alert.user_email)}`}
                className="text-amber-400 hover:text-amber-300 font-mono text-sm transition-colors"
              >
                {alert.user_email}
              </Link>
            ) : (
              <p className="text-stone-600 font-mono text-sm">—</p>
            )}
          </div>
          <div className="bg-[#141416] border border-white/10 rounded p-4">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Policy ID</p>
            <p className="text-white font-mono text-sm">{alert.policy_id}</p>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-[#141416] border border-white/10 rounded mb-6">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-medium text-white">Violation Details</h2>
          </div>
          <div className="p-4">
            <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">
              {alert.explanation}
            </p>
          </div>
        </div>

        {/* Images */}
        {alert.image_urls && alert.image_urls.length > 0 && (
          <div className="bg-[#141416] border border-white/10 rounded">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-medium text-white">Evidence Images</h2>
              <span className="text-stone-500 text-xs font-mono">{alert.image_urls.length} file(s)</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {alert.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(url)}
                    className="group relative aspect-video bg-black rounded overflow-hidden border border-white/10 hover:border-amber-500/50 transition-colors"
                  >
                    <img 
                      src={url} 
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs font-mono rounded">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Severity Legend */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-6 text-xs text-stone-500">
            <span className="uppercase tracking-wider">Severity:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-red-600" />
              <span>L7+ Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-orange-600" />
              <span>L6 Serious</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-amber-600" />
              <span>L5 Minor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-stone-600" />
              <span>L1-4 Info</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
