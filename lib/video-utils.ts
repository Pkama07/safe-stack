export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

export function extractFrameAtTimestamp(
  videoElement: HTMLVideoElement,
  timestamp: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    const handleSeeked = () => {
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      const frameData = canvas.toDataURL('image/jpeg', 0.9)
      const base64Data = frameData.split(',')[1]

      videoElement.removeEventListener('seeked', handleSeeked)
      resolve(base64Data)
    }

    videoElement.addEventListener('seeked', handleSeeked)
    videoElement.currentTime = timestamp

    // Timeout fallback
    setTimeout(() => {
      videoElement.removeEventListener('seeked', handleSeeked)
      reject(new Error('Frame extraction timed out'))
    }, 5000)
  })
}
