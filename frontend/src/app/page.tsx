'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RaceLoader } from '@/components/RaceLoader'
import { RaceInfo } from '@/components/RaceInfo'
import { RaceControls } from '@/components/RaceControls'
import { RaceVisualization } from '@/components/RaceVisualization'
import { RaceDataDisplay } from '@/components/RaceDataDisplay'

interface CarState {
  driver_number: number
  x: number
  y: number
  speed: number
  gear?: number
  throttle?: number
  brake?: boolean
  timestamp: number
}

interface ReplayState {
  timestamp: number
  cars: CarState[]
}

interface TimelineEntry {
  lap: number
  driver_number: number
  sector1_time?: number
  sector2_time?: number
  sector3_time?: number
  lap_time?: number
  pit_stop: boolean
}

interface Timeline {
  session_key: string
  total_laps: number
  entries: TimelineEntry[]
}

interface LoadRaceResponse {
  success: boolean
  message: string
  session_key?: string
  endpoints?: {
    state: string
    timeline: string
  }
  example_usage?: {
    state: string
    timeline: string
  }
}

export default function F1RaceReplayer() {
  // State management
  const [currentSession, setCurrentSession] = useState<{key: string, name: string} | null>(null)
  const [currentTimeline, setCurrentTimeline] = useState<Timeline | null>(null)
  const [currentState, setCurrentState] = useState<ReplayState | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [minTimestamp, setMinTimestamp] = useState(0)
  const [maxTimestamp, setMaxTimestamp] = useState(0)
  const [currentTimestamp, setCurrentTimestamp] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playbackInterval = useRef<NodeJS.Timeout | null>(null)

  // API endpoints
  const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : ''

  const loadRace = async (raceName: string) => {
    if (!raceName.trim()) {
      setError('Please enter a race name')
      return
    }

    try {
      setLoading(true)
      setError(null)
      hideAllSections()

      const response = await fetch(`${API_BASE}/api/load-race?race_name=${encodeURIComponent(raceName)}`, {
        method: 'POST'
      })

      const result: LoadRaceResponse = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      // Store session info
      setCurrentSession({
        key: result.session_key!,
        name: raceName
      })

      // Load timeline data
      await loadTimeline(result.session_key!)

    } catch (error) {
      console.error('Error loading race:', error)
      setError(`Failed to load race: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async (sessionKey: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/replay/${sessionKey}/timeline`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const timeline: Timeline = await response.json()
      setCurrentTimeline(timeline)

      // Set timestamp range
      await getTimestampRange(sessionKey)

    } catch (error) {
      console.error('Error loading timeline:', error)
      throw error
    }
  }

  const getTimestampRange = async (sessionKey: string) => {
    try {
      // Known timestamp ranges for demo sessions
      let minTs, maxTs
      
      if (sessionKey === '7953') { // Bahrain 2023
        minTs = 1678024866.787
        maxTs = 1678034180.243
      } else if (sessionKey === '9094') { // Monaco 2023
        minTs = 1685275266.82
        maxTs = 1685285565.231
      } else if (sessionKey === '9173') { // Japan 2023
        minTs = 1696220790
        maxTs = 1696230790
      } else {
        // Generic range - try to get first valid state
        minTs = Date.now() / 1000 - 7200
        maxTs = Date.now() / 1000
      }

      setMinTimestamp(minTs)
      setMaxTimestamp(maxTs)
      setCurrentTimestamp(minTs)

      // Verify we can get data at the start timestamp
      const testResponse = await fetch(`${API_BASE}/api/replay/${sessionKey}/state?t=${minTs}`)
      if (!testResponse.ok) {
        console.warn('Could not fetch initial state, adjusting timestamp range')
        setMinTimestamp(minTs + 60)
        setCurrentTimestamp(minTs + 60)
      }

    } catch {
      console.warn('Could not determine timestamp range, using defaults')
    }
  }

  const updateRaceState = useCallback(async () => {
    if (!currentSession) return

    try {
      const response = await fetch(`${API_BASE}/api/replay/${currentSession.key}/state?t=${currentTimestamp}`)
      
      if (!response.ok) {
        console.warn(`Could not fetch state for timestamp ${currentTimestamp}`)
        return
      }

      const state: ReplayState = await response.json()
      setCurrentState(state)

    } catch (error) {
      console.error('Error updating race state:', error)
    }
  }, [currentSession, currentTimestamp, API_BASE])

  const startPlayback = () => {
    if (isPlaying) return
    
    setIsPlaying(true)
    playbackInterval.current = setInterval(() => {
      setCurrentTimestamp(prev => {
        const next = prev + playbackSpeed
        if (next >= maxTimestamp) {
          setIsPlaying(false)
          if (playbackInterval.current) {
            clearInterval(playbackInterval.current)
          }
          return maxTimestamp
        }
        return next
      })
    }, 1000)
  }

  const pausePlayback = () => {
    setIsPlaying(false)
    if (playbackInterval.current) {
      clearInterval(playbackInterval.current)
      playbackInterval.current = null
    }
  }

  const resetPlayback = () => {
    pausePlayback()
    setCurrentTimestamp(minTimestamp)
  }

  const hideAllSections = () => {
    setCurrentSession(null)
    setCurrentTimeline(null)
    setCurrentState(null)
  }

  // Update race state when timestamp changes
  useEffect(() => {
    if (currentSession && currentTimestamp >= minTimestamp && currentTimestamp <= maxTimestamp) {
      updateRaceState()
    }
  }, [currentTimestamp, currentSession, minTimestamp, maxTimestamp, updateRaceState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🏎️ F1 Historic Race Replayer</h1>
          <p className="text-lg opacity-90">Load and replay Formula 1 races with real telemetry data</p>
        </header>

        {/* Race Loader */}
        <RaceLoader
          onLoadRace={loadRace}
          loading={loading}
          error={error}
        />

        {/* Race Info */}
        {currentSession && currentTimeline && (
          <RaceInfo
            session={currentSession}
            timeline={currentTimeline}
          />
        )}

        {/* Race Controls */}
        {currentSession && (
          <RaceControls
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            currentTimestamp={currentTimestamp}
            minTimestamp={minTimestamp}
            maxTimestamp={maxTimestamp}
            onPlay={startPlayback}
            onPause={pausePlayback}
            onReset={resetPlayback}
            onSpeedChange={setPlaybackSpeed}
            onTimestampChange={setCurrentTimestamp}
          />
        )}

        {/* Race Visualization */}
        {currentState && (
          <RaceVisualization
            state={currentState}
          />
        )}

        {/* Race Data Display */}
        {currentState && (
          <RaceDataDisplay
            state={currentState}
          />
        )}

        {/* Footer */}
        <footer className="text-center text-white mt-12 opacity-75">
          <p>Data provided by <a href="https://openf1.org/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-100">OpenF1 API</a></p>
          <p>This is an unofficial project - not affiliated with Formula 1</p>
        </footer>
      </div>
    </div>
  )
}
