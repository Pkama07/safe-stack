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
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}
        ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {selectedFile ? (
          <div>
            <p className="text-white font-medium">{selectedFile.name}</p>
            <p className="text-gray-400 text-sm">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-white font-medium">
              Drop your video here or click to browse
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Supports MP4, WebM, MOV (up to 2 hours)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
