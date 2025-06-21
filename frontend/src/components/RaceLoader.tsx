import React, { useState, KeyboardEvent } from 'react'

interface RaceLoaderProps {
  onLoadRace: (raceName: string) => void
  loading: boolean
  error: string | null
}

export function RaceLoader({ onLoadRace, loading, error }: RaceLoaderProps) {
  const [raceName, setRaceName] = useState('Bahrain GP 2023')

  const handleLoadRace = () => {
    onLoadRace(raceName)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLoadRace()
    }
  }

  return (
    <section className="bg-white rounded-xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <label htmlFor="raceInput" className="font-semibold text-gray-900 min-w-[140px]">
          Enter Race Name:
        </label>
        <input
          id="raceInput"
          type="text"
          value={raceName}
          onChange={(e) => setRaceName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., Bahrain GP 2023, Monaco 2023, Japan GP 2023"
          className="flex-1 min-w-[300px] px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 focus:outline-none focus:border-green-500 focus:ring-0"
          disabled={loading}
        />
        <button
          onClick={handleLoadRace}
          disabled={loading}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-green-600 hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Loading...' : 'Load Race'}
        </button>
      </div>

      {loading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
          Loading race data...
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
          {error}
        </div>
      )}
    </section>
  )
} 