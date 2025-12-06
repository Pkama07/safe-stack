'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import CameraGrid from '@/components/CameraGrid'
import { Camera } from '@/components/CameraFeed'
import AlertStream from '@/components/AlertStream'
import { Alert } from '@/components/AlertCard'
import DailyAlerts from '@/components/DailyAlerts'
import QuickLinks from '@/components/QuickLinks'

// Camera configurations with video stream URLs
// Place video files in public/videos/ (e.g., cam1.mp4, cam2.mp4)
const mockCameras: Camera[] = [
  { id: '1', name: 'Loading Dock B - Cam 1', location: 'Loading Dock B', status: 'idle', streamUrl: 'https://ksbfdhccpkfycuyngwhv.supabase.co/storage/v1/object/public/uploads-bucket/Video_Generation_Regular_Operations_to_Oil_Spill.mp4' },
  { id: '2', name: 'Loading Dock B - Cam 2', location: 'Loading Dock B', status: 'idle', streamUrl: '/videos/cam2.mp4' },
  { id: '3', name: 'Loading Dock B - Cam 3', location: 'Loading Dock B', status: 'idle', streamUrl: '/videos/cam3.mp4' },
  { id: '4', name: 'Loading Dock B - Cam 4', location: 'Loading Dock B', status: 'analyzing', streamUrl: '/videos/cam4.mp4' },
  { id: '5', name: 'Loading Dock B - Cam 5', location: 'Loading Dock B', status: 'idle', streamUrl: '/videos/cam5.mp4' },
  { id: '6', name: 'Loading Dock B - Cam 6', location: 'Loading Dock B', status: 'idle', streamUrl: '/videos/cam6.mp4' },
]

// Mock data for alerts
const mockAlerts: Alert[] = [
  {
    id: '1',
    time: '10:42 AM',
    location: 'Loading Dock B',
    camera: 'Cam 3',
    riskLevel: 'HIGH',
    violationType: 'Proximity Violation Detected.',
    oshaCode: 'OSHA 1910.178(n).',
  },
  {
    id: '2',
    time: '10:42 AM',
    location: 'Loading Dock B',
    camera: 'Cam 3',
    riskLevel: 'HIGH',
    violationType: 'Proximity Violation Detected.',
    oshaCode: 'OSHA 1910.178(n).',
  },
  {
    id: '3',
    time: '10:42 AM',
    location: 'Loading Dock B',
    camera: 'Cam 3',
    riskLevel: 'HIGH',
    violationType: 'Proximity Violation Detected.',
    oshaCode: 'OSHA 1910.178(n).',
  },
]

export default function Home() {
  const [cameras] = useState<Camera[]>(mockCameras)
  const [alerts] = useState<Alert[]>(mockAlerts)

  // Calculate metrics
  const activeHazards = alerts.filter(a => a.riskLevel === 'HIGH').length
  const totalAlerts = 20
  const compliancePercent = 92

  const handleCameraClick = (camera: Camera) => {
    console.log('Camera clicked:', camera)
    // TODO: Open camera detail view
  }

  const handleReviewAlert = (alert: Alert) => {
    console.log('Review alert:', alert)
    // TODO: Open alert detail modal
  }

  const handleGenerateReport = () => {
    console.log('Generate report')
    // TODO: Generate shift report
  }

  const handleQuickAnalysis = () => {
    console.log('Quick analysis')
    // TODO: Start quick analysis
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <Header activeHazards={activeHazards} compliancePercent={compliancePercent} />

      <main className="p-6">
        <div className="grid grid-cols-12 gap-6 max-w-[1800px] mx-auto">
          {/* Left Column - Camera Grid (5 cols) */}
          <div className="col-span-12 lg:col-span-5">
            <CameraGrid cameras={cameras} onCameraClick={handleCameraClick} />
          </div>

          {/* Middle Column - Alert Stream (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <AlertStream alerts={alerts} onReviewClick={handleReviewAlert} />
          </div>

          {/* Right Column - Widgets (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <DailyAlerts
              totalAlerts={totalAlerts}
              highRisk={8}
              mediumRisk={7}
              lowRisk={5}
            />
            <QuickLinks
              onGenerateReport={handleGenerateReport}
              onQuickAnalysis={handleQuickAnalysis}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
