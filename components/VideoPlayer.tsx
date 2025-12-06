'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

interface VideoPlayerProps {
  src: string | null
  onTimeUpdate?: (time: number) => void
}

export interface VideoPlayerRef {
  seekTo: (time: number) => void
  getCurrentTime: () => number
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
        <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">No video selected</p>
        </div>
      )
    }

    return (
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full aspect-video bg-black rounded-xl"
      />
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
