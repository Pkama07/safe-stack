import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Safety Violation Analyzer',
  description: 'Analyze videos for OSHA safety violations using Gemini 3 Pro',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
