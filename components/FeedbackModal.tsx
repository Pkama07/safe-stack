'use client'

import { useState } from 'react'

interface FeedbackAlert {
  id: number
  policy_title: string
  policy_level: number
}

interface FeedbackModalProps {
  alert: FeedbackAlert | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function FeedbackModal({ alert, isOpen, onClose, onSuccess }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen || !alert) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedback.trim()) {
      setError('Please provide feedback explaining why this alert is incorrect')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/amend-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert_id: alert.id,
          feedback: feedback.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSuccess(true)
      setFeedback('')

      // Auto close after success
      setTimeout(() => {
        setSuccess(false)
        onClose()
        onSuccess?.()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFeedback('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1a1f2e] rounded-xl border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Report False Positive</h2>
              <p className="text-sm text-stone-400">Help improve detection accuracy</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Policy Updated</h3>
            <p className="text-stone-400">The policy has been refined based on your feedback.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Policy Info */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Policy</div>
                <div className="text-white font-medium">{alert.policy_title}</div>
                <div className="text-xs text-stone-400 mt-1">
                  Severity Level: {alert.policy_level}
                </div>
              </div>

              {/* Feedback Input */}
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-stone-300 mb-2">
                  Explain why this alert is incorrect
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Example: The worker was wearing proper safety equipment but it wasn't visible in the camera angle..."
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none disabled:opacity-50"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Info Note */}
              <p className="text-xs text-stone-500">
                Your feedback will be used to refine the policy and prevent similar false positives in the future.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10 bg-white/5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-stone-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !feedback.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
