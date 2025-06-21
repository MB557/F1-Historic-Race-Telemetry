import React from 'react'

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

interface RaceInfoProps {
  session: { key: string; name: string }
  timeline: Timeline
}

export function RaceInfo({ session, timeline }: RaceInfoProps) {
  return (
    <section className="bg-white rounded-xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
          <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Race:</span>
          <span className="font-medium text-gray-900">{session.name}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
          <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Session:</span>
          <span className="font-medium text-gray-900 font-mono text-sm">{session.key}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
          <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Total Laps:</span>
          <span className="font-medium text-gray-900">{timeline.total_laps}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
          <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Timeline Entries:</span>
          <span className="font-medium text-gray-900">{timeline.entries.length}</span>
        </div>
      </div>
    </section>
  )
} 