'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

interface VideoPlayerProps {
  src: string | null
  onTimeUpdate?: (time: number) => void
}

export interface VideoPlayerRef {
  seekTo: (time: number) => void
  getCurrentTime: () => number
  getVideoElement: () => HTMLVideoElement | null
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ src, onTimeUpdate }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time
          videoRef.current.play()
        }
      },
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      getVideoElement: () => videoRef.current,
    }))

    useEffect(() => {
      const video = videoRef.current
      if (!video || !onTimeUpdate) return

      const handleTimeUpdate = () => {
        onTimeUpdate(video.currentTime)
      }

      video.addEventListener('timeupdate', handleTimeUpdate)
      return () => video.removeEventListener('timeupdate', handleTimeUpdate)
    }, [onTimeUpdate])

    if (!src) {
      return (
        <div className="aspect-video bg-[#0a0a0b] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center border border-white/10 rounded">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-stone-600 text-sm">No video selected</p>
          </div>
        </div>
      )
    }

    return (
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={src}
          controls
          className="w-full h-full object-contain"
        />
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
