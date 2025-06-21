import React from 'react'

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

interface RaceDataDisplayProps {
  state: ReplayState
}

export function RaceDataDisplay({ state }: RaceDataDisplayProps) {
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleTimeString()
  }

  // Sort cars by position
  const sortedCars = [...state.cars].sort((a, b) => (a.x || 0) - (b.x || 0))

  return (
    <section className="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Current Race State</h3>
      
      {/* Race State Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="font-semibold text-gray-600">Timestamp:</span>
          <span className="font-mono text-sm text-gray-900">
            {formatTimestamp(state.timestamp)}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="font-semibold text-gray-600">Cars on Track:</span>
          <span className="font-semibold text-gray-900">{state.cars.length}</span>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedCars.map((car, index) => (
          <div
            key={car.driver_number}
            className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300"
          >
            {/* Driver Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  #{car.driver_number}
                </div>
                <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  P{index + 1}
                </div>
              </div>
            </div>

            {/* Telemetry Data */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Speed:</span>
                <span className="font-semibold">{Math.round(car.speed)} km/h</span>
              </div>
              
              {car.gear !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gear:</span>
                  <span className="font-semibold font-mono">{car.gear}</span>
                </div>
              )}
              
              {car.throttle !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Throttle:</span>
                  <span className="font-semibold">{Math.round(car.throttle)}%</span>
                </div>
              )}
              
              {car.brake !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Brake:</span>
                  <span className={`font-semibold ${car.brake ? 'text-red-600' : 'text-green-600'}`}>
                    {car.brake ? 'ON' : 'OFF'}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Position:</span>
                <span className="font-semibold">{car.x || index + 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
} 