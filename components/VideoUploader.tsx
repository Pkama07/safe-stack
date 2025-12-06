'use client'

import { useState, useRef, DragEvent } from 'react'

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void
  isAnalyzing: boolean
}

export default function VideoUploader({ onVideoSelect, isAnalyzing }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      onVideoSelect(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      onVideoSelect(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative aspect-video cursor-pointer transition-all
        ${isDragging ? 'bg-amber-500/5' : 'bg-[#0a0a0b]'}
        ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Border */}
      <div className={`
        absolute inset-4 border-2 border-dashed rounded transition-colors
        ${isDragging ? 'border-amber-500' : 'border-white/10'}
      `} />

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        {/* Icon */}
        <div className={`
          w-12 h-12 mb-4 flex items-center justify-center rounded border transition-colors
          ${isDragging ? 'border-amber-500 text-amber-500' : 'border-white/20 text-stone-500'}
        `}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        {selectedFile && !isAnalyzing ? (
          <div className="text-center">
            <p className="text-white font-mono text-sm mb-1 truncate max-w-[240px]">
              {selectedFile.name}
            </p>
            <p className="text-stone-600 text-xs font-mono">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        ) : isAnalyzing ? (
          <div className="text-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full" />
                <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin" />
              </div>
              <span className="text-stone-400 text-sm">Analyzing...</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-stone-400 text-sm mb-1">
              Drop video here or <span className="text-amber-500">browse</span>
            </p>
            <p className="text-stone-600 text-xs font-mono">
              MP4, WebM, MOV
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
