'use client'

import { useState, useEffect, useCallback } from 'react'
import RaceControls from '@/components/RaceControls'
import F1TelemetryTable from '@/components/F1TelemetryTable'

interface CarData {
  driver_number: number
  position: number
  speed: number
  gear: number
  throttle: number
  brake: number
  rpm: number
  drs: number
  gap_to_leader: string
  timestamp: number
}

interface RaceInfo {
  session_key: string
  session_name: string
  total_laps: number
  country: string
  date: string
}

export default function Home() {
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [selectedSessionName, setSelectedSessionName] = useState<string>('')
  const [currentLap, setCurrentLap] = useState<number>(1)
  const [totalLaps, setTotalLaps] = useState<number>(57)
  const [speedFilter, setSpeedFilter] = useState<number>(0)
  const [carData, setCarData] = useState<CarData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [raceInfo, setRaceInfo] = useState<RaceInfo | null>(null)
  const [dataSource, setDataSource] = useState<string>('')

  // Determine API base URL
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api'
        : '/.netlify/functions/api'
    }
    return '/.netlify/functions/api'
  }

  // Load race info when session changes
  const loadRaceInfo = useCallback(async (sessionKey: string) => {
    if (!sessionKey) return

    try {
      const response = await fetch(`${getApiUrl()}/replay/${sessionKey}/timeline`)
      if (response.ok) {
        const info = await response.json()
        setRaceInfo(info)
        setTotalLaps(info.total_laps)
        setCurrentLap(1) // Reset to lap 1
      }
    } catch (error) {
      console.error('Error loading race info:', error)
    }
  }, [])

  // Load lap data
  const loadLapData = useCallback(async (sessionKey: string, lap: number) => {
    if (!sessionKey || lap < 1) return

    setIsLoading(true)
    try {
      const response = await fetch(`${getApiUrl()}/replay/${sessionKey}/lap/${lap}`)
      if (response.ok) {
        const data = await response.json()
        setCarData(data.cars || [])
        setDataSource(data.data_source || 'Unknown')
      } else {
        console.error('Failed to load lap data')
        setCarData([])
      }
    } catch (error) {
      console.error('Error loading lap data:', error)
      setCarData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle race selection
  const handleRaceChange = useCallback((sessionKey: string, sessionName: string) => {
    setSelectedSession(sessionKey)
    setSelectedSessionName(sessionName)
    loadRaceInfo(sessionKey)
  }, [loadRaceInfo])

  // Handle lap change
  const handleLapChange = useCallback((lap: number) => {
    setCurrentLap(lap)
    if (selectedSession) {
      loadLapData(selectedSession, lap)
    }
  }, [selectedSession, loadLapData])

  // Load data when session or lap changes
  useEffect(() => {
    if (selectedSession && currentLap) {
      loadLapData(selectedSession, currentLap)
    }
  }, [selectedSession, currentLap, loadLapData])

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ��️ F1 Live Telemetry
          </h1>
          <p className="text-lg text-gray-600">
            Real-time Formula 1 telemetry data with lap-by-lap navigation
          </p>
          {selectedSessionName && (
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                📍 {selectedSessionName}
              </span>
              {dataSource && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {dataSource.includes('Real') ? '✅' : '⚠️'} {dataSource}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Race Controls */}
        <RaceControls
          onRaceChange={handleRaceChange}
          onLapChange={handleLapChange}
          onSpeedFilterChange={setSpeedFilter}
          currentLap={currentLap}
          totalLaps={totalLaps}
          speedFilter={speedFilter}
          isLoading={isLoading}
        />

        {/* Race Information */}
        {raceInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Race Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">🏁 Race:</span>
                <span className="ml-2 text-gray-900">{raceInfo.session_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">🌍 Country:</span>
                <span className="ml-2 text-gray-900">{raceInfo.country}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">📅 Date:</span>
                <span className="ml-2 text-gray-900">{new Date(raceInfo.date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">🏃 Progress:</span>
                <span className="ml-2 text-gray-900">{currentLap} / {totalLaps} laps</span>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Table */}
        {selectedSession ? (
          <F1TelemetryTable
            carData={carData}
            speedFilter={speedFilter}
            currentTimestamp={0} // Not used in lap-based mode
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🏎️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to F1 Live Telemetry
            </h3>
            <p className="text-gray-600 mb-6">
              Select a season and Grand Prix to view real-time telemetry data
            </p>
            <div className="text-sm text-gray-500">
              <p>✅ Year and race selection</p>
              <p>✅ Lap-by-lap navigation</p>
              <p>✅ Real OpenF1 API data</p>
              <p>✅ Speed filtering</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a 
              href="https://openf1.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              OpenF1 API
            </a>
            {' '}• Built with Next.js & Netlify Functions
          </p>
        </div>
      </div>
    </main>
  )
}
