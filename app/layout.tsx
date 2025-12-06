import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SiteSight AI | Safety Monitoring Dashboard',
  description: 'Real-time AI-powered safety monitoring and violation detection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0c10] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
