import React, { ChangeEvent } from 'react'

interface RaceControlsProps {
  isPlaying: boolean
  playbackSpeed: number
  currentTimestamp: number
  minTimestamp: number
  maxTimestamp: number
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeedChange: (speed: number) => void
  onTimestampChange: (timestamp: number) => void
}

export function RaceControls({
  isPlaying,
  playbackSpeed,
  currentTimestamp,
  minTimestamp,
  maxTimestamp,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onTimestampChange
}: RaceControlsProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const progress = parseFloat(e.target.value) / 100
    const timestamp = minTimestamp + (maxTimestamp - minTimestamp) * progress
    onTimestampChange(timestamp)
  }

  const handleSpeedChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onSpeedChange(parseFloat(e.target.value))
  }

  const currentProgress = maxTimestamp > minTimestamp 
    ? ((currentTimestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * 100 
    : 0

  const totalDuration = maxTimestamp - minTimestamp
  const currentDuration = currentTimestamp - minTimestamp

  return (
    <section className="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex flex-col gap-6">
        {/* Time Display */}
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-800">
            <span className="text-blue-600">{formatTime(currentDuration)}</span>
            <span className="text-gray-800 mx-2">/</span>
            <span className="text-gray-900">{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="w-full">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={currentProgress}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${currentProgress}%, #E5E7EB ${currentProgress}%, #E5E7EB 100%)`
            }}
          />
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onPlay}
            disabled={isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            ▶️ Play
          </button>
          
          <button
            onClick={onPause}
            disabled={!isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            ⏸️ Pause
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-blue-600"
          >
            🔄 Reset
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="speedSelect" className="font-semibold text-gray-900">
              Speed:
            </label>
            <select
              id="speedSelect"
              value={playbackSpeed}
              onChange={handleSpeedChange}
              className="px-3 py-1 border border-gray-300 rounded-lg bg-white font-medium text-gray-900 focus:outline-none focus:border-blue-500"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  )
} 