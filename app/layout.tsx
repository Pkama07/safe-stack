import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SafeStack | AI Safety Violation Analyzer',
  description: 'Detect OSHA safety violations in real-time using advanced AI vision',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0b] text-[#fafaf9] min-h-screen">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0b]/95 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-display font-semibold text-white">SafeStack</span>
              </Link>

              {/* Nav Links */}
              <div className="flex items-center gap-1">
                <Link 
                  href="/"
                  className="px-3 py-1.5 text-sm text-stone-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                >
                  Analyzer
                </Link>
                <Link 
                  href="/alerts"
                  className="px-3 py-1.5 text-sm text-stone-400 hover:text-white rounded hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  Alerts
                  <span className="w-1.5 h-1.5 rounded-sm bg-amber-500" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  )
}
