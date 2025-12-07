'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import FeedbackModal from '@/components/FeedbackModal'

interface Alert {
  id: number
  policy_id: number
  policy_title: string
  policy_level: number
  image_urls: string[]
  amended_images: string[]
  explanation: string
  timestamp: string
  user_email: string | null
}

function getRiskStyle(level: number) {
  if (level >= 3) return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'HIGH RISK' }
  if (level >= 2) return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'MEDIUM RISK' }
  return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'LOW RISK' }
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
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [isPollingAmendedImages, setIsPollingAmendedImages] = useState(false)

  useEffect(() => {
    // Try cached alert first for instant render
    const cached = sessionStorage.getItem(`alert-${id}`)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Alert
        setAlert(parsed)
        setIsLoading(false)
      } catch (e) {
        console.warn('Failed to parse cached alert', e)
      }
    }

    const fetchAlert = async () => {
      try {
        const response = await fetch(`/api/alerts/${id}`, { cache: 'no-store' })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Alert not found')
          }
          const data = await response.json()
          throw new Error(data.error || 'Failed to fetch alert')
        }

        const data = await response.json()
        setAlert(data)
        sessionStorage.setItem(`alert-${id}`, JSON.stringify(data))
        setError(null)
      } catch (err) {
        // If we already have a cached alert, don't block UI on errors
        if (!alert) {
          setError(err instanceof Error ? err.message : 'An error occurred')
          setIsLoading(false)
        }
        console.error('Failed to fetch alert', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlert()
  }, [id])

  // Poll for amended_images if not available
  useEffect(() => {
    // Check if we need to poll (alert loaded but no amended_images)
    const hasAmendedImages = alert?.amended_images && Array.isArray(alert.amended_images) && alert.amended_images.length > 0
    
    if (!alert || hasAmendedImages) {
      setIsPollingAmendedImages(false)
      return
    }

    // Start polling
    setIsPollingAmendedImages(true)
    
    const POLL_INTERVAL = 3000 // 3 seconds
    const MAX_POLL_DURATION = 120000 // 2 minutes timeout
    const startTime = Date.now()

    const pollForAmendedImages = async () => {
      try {
        const response = await fetch(`/api/alerts/${id}`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          if (data.amended_images && Array.isArray(data.amended_images) && data.amended_images.length > 0) {
            setAlert(data)
            sessionStorage.setItem(`alert-${id}`, JSON.stringify(data))
            setIsPollingAmendedImages(false)
            return true // Stop polling
          }
        }
      } catch (err) {
        console.error('Error polling for amended images:', err)
      }
      return false // Continue polling
    }

    const intervalId = setInterval(async () => {
      // Check timeout
      if (Date.now() - startTime > MAX_POLL_DURATION) {
        setIsPollingAmendedImages(false)
        clearInterval(intervalId)
        return
      }

      const success = await pollForAmendedImages()
      if (success) {
        clearInterval(intervalId)
      }
    }, POLL_INTERVAL)

    return () => {
      clearInterval(intervalId)
    }
  }, [alert, id])

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

      router.push('/')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10]">
        <Header activeHazards={0} compliancePercent={100} />
        <main className="p-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-12 h-12 border-2 border-white/10 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-stone-400">Loading alert details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0c10]">
        <Header activeHazards={0} compliancePercent={100} />
        <main className="p-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="bg-[#0f1419] rounded-lg border border-white/10 p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-stone-400 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!alert) return null

  const riskStyle = getRiskStyle(alert.policy_level)

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <Header activeHazards={alert.policy_level >= 3 ? 1 : 0} compliancePercent={100} />

      {/* Feedback Modal */}
      <FeedbackModal
        alert={alert ? { id: alert.id, policy_title: alert.policy_title, policy_level: alert.policy_level } : null}
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 text-stone-400 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Alert evidence"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white transition-colors mb-6 group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          {/* Main Alert Card */}
          <div className="bg-[#0f1419] rounded-lg border border-white/10 p-6 mb-6">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-3 rounded-lg ${riskStyle.bg}`}>
                  <svg className={`w-6 h-6 ${riskStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded ${riskStyle.bg} ${riskStyle.text}`}>
                      {riskStyle.label}
                    </span>
                    <span className="text-stone-500 text-sm">
                      #{alert.id}
                    </span>
                  </div>
                  <h1 className="text-xl font-semibold text-white">
                    {alert.policy_title}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="p-2.5 text-orange-400 hover:bg-orange-500/20 rounded-lg transition-colors"
                  title="Report false positive"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
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
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-stone-400">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTimestamp(alert.timestamp)}</span>
              </div>

              {alert.user_email && (
                <div className="flex items-center gap-2 text-stone-400">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{alert.user_email}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-stone-400">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Policy #{alert.policy_id}</span>
              </div>
            </div>
          </div>

          {/* Violation Details */}
          <div className="bg-[#0f1419] rounded-lg border border-white/10 p-6 mb-6">
            <h2 className="flex items-center gap-3 text-white font-semibold mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Violation Details
            </h2>
            <p className="text-stone-400 leading-relaxed whitespace-pre-wrap pl-11">
              {alert.explanation}
            </p>
          </div>

          {/* Evidence Images */}
          {alert.image_urls && alert.image_urls.length > 0 && (
            <div className="bg-[#0f1419] rounded-lg border border-white/10 p-6 mb-6">
              <h2 className="flex items-center gap-3 text-white font-semibold mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Evidence Images
                <span className="ml-2 px-2 py-0.5 bg-white/5 text-stone-500 text-xs rounded">
                  {alert.image_urls.length}
                </span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pl-11">
                {alert.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(url)}
                    className="group relative aspect-video rounded-lg overflow-hidden bg-[#1a1f2e] border border-white/5 hover:border-white/20 transition-colors"
                  >
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-blue-500/20 backdrop-blur-sm rounded-lg">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs rounded">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amended Images (AI-Generated Fix) */}
          {isPollingAmendedImages && (
            <div className="bg-[#0f1419] rounded-lg border border-white/10 p-6">
              <h2 className="flex items-center gap-3 text-white font-semibold mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                AI-Generated Fix
              </h2>

              <div className="pl-11">
                <div className="flex items-center gap-3 text-stone-400">
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-white/10 rounded-full" />
                    <div className="absolute inset-0 w-5 h-5 border-2 border-green-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <span>Generating image...</span>
                </div>
              </div>
            </div>
          )}

          {alert.amended_images && Array.isArray(alert.amended_images) && alert.amended_images.length > 0 && (
            <div className="bg-[#0f1419] rounded-lg border border-white/10 p-6">
              <h2 className="flex items-center gap-3 text-white font-semibold mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                AI-Generated Fix
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                  After
                </span>
              </h2>

              <p className="text-stone-400 text-sm mb-4 pl-11">
                This AI-generated image shows how the scene should look after correcting the violation.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pl-11">
                {alert.amended_images.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(url)}
                    className="group relative aspect-video rounded-lg overflow-hidden bg-[#1a1f2e] border border-green-500/20 hover:border-green-500/40 transition-colors"
                  >
                    <img
                      src={url}
                      alt={`Corrected ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23475569" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-green-500/20 backdrop-blur-sm rounded-lg">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-green-500/70 backdrop-blur-sm text-white text-xs rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Fixed
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Risk Level Legend */}
          <div className="mt-6 p-4 bg-[#0f1419] rounded-lg border border-white/10">
            <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">Risk Levels</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-xs text-stone-500">HIGH RISK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-orange-500" />
                <span className="text-xs text-stone-500">MEDIUM RISK</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                <span className="text-xs text-stone-500">LOW RISK</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
