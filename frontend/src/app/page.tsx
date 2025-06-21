'use client'

import { useState, useEffect, useCallback } from 'react'
import RaceControls from '../components/RaceControls'
import F1TelemetryTable from '../components/F1TelemetryTable'

interface CarData {
  driver_number: number
  timestamp: number
  speed: number
  gear: number
  throttle: number
  brake: number
  rpm: number
  drs: number
  x?: number
  y?: number
  z?: number
  position?: number
  lap_time?: number
  gap_to_leader?: string
}

interface LapData {
  session_key: string
  lap: number
  total_laps: number
  cars: CarData[]
  data_source?: string
}

export default function Home() {
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [currentLap, setCurrentLap] = useState(1)
  const [totalLaps, setTotalLaps] = useState(57)
  const [lapData, setLapData] = useState<LapData | null>(null)
  const [speedFilter, setSpeedFilter] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLapData = useCallback(async (sessionKey: string, lap: number) => {
    if (!sessionKey) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`http://localhost:3001/api/replay/${sessionKey}/lap/${lap}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setLapData(data)
      setTotalLaps(data.total_laps)
      
    } catch (err) {
      console.error('Error fetching lap data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch lap data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch lap data when session or lap changes
  useEffect(() => {
    if (selectedSession) {
      fetchLapData(selectedSession, currentLap)
    }
  }, [selectedSession, currentLap, fetchLapData])

  const handleSessionChange = async (sessionKey: string) => {
    setSelectedSession(sessionKey)
    setCurrentLap(1) // Reset to lap 1 when changing sessions
    setLapData(null)
  }

  const handleLapChange = (lap: number) => {
    setCurrentLap(lap)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏎️ F1 Live Telemetry
          </h1>
          <p className="text-gray-700">
            Lap-by-lap Formula 1 race data and telemetry analysis
          </p>
        </header>

        <RaceControls
          selectedSession={selectedSession}
          onSessionChange={handleSessionChange}
          speedFilter={speedFilter}
          onSpeedFilterChange={setSpeedFilter}
          currentLap={currentLap}
          onLapChange={handleLapChange}
          totalLaps={totalLaps}
        />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-700">Loading lap data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Telemetry Table */}
        {lapData && !loading && (
          <div className="mt-8">
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  Lap {lapData.lap} of {lapData.total_laps}
                </h2>
                {lapData.data_source && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    lapData.data_source.includes('Real Data') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lapData.data_source.includes('Real Data') ? '✅ Real F1 Data' : '⚠️ Simulated Data'}
                  </span>
                )}
              </div>
              <p className="text-gray-700">
                Showing telemetry data for {lapData.cars.length} drivers
                {lapData.data_source && lapData.data_source.includes('Real Data') && (
                  <span className="text-green-600 font-medium"> • Authentic OpenF1 API</span>
                )}
              </p>
            </div>
            
            <F1TelemetryTable 
              carData={lapData.cars}
              currentTimestamp={0} // Not used in lap-based mode
              speedFilter={speedFilter}
            />
          </div>
        )}

        {/* No Data State */}
        {!selectedSession && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-700 text-lg">
              Select a race session to view telemetry data
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
