import React, { ChangeEvent, useState, useEffect } from 'react'

interface RaceControlsProps {
  selectedSession: string
  onSessionChange: (sessionKey: string) => void
  speedFilter: number
  onSpeedFilterChange: (speed: number) => void
  currentLap: number
  onLapChange: (lap: number) => void
  totalLaps: number
}

export default function RaceControls({ 
  selectedSession, 
  onSessionChange, 
  speedFilter, 
  onSpeedFilterChange,
  currentLap,
  onLapChange,
  totalLaps
}: RaceControlsProps) {
  const [sessions, setSessions] = useState<Array<{session_key: string, session_name: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/sessions');
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const speedOptions = [
    { value: 0, label: 'All Speeds' },
    { value: 50, label: '≥50 km/h' },
    { value: 100, label: '≥100 km/h' },
    { value: 150, label: '≥150 km/h' },
    { value: 200, label: '≥200 km/h' },
    { value: 250, label: '≥250 km/h' },
    { value: 300, label: '≥300 km/h' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Session Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Race Session
          </label>
          <select
            value={selectedSession}
            onChange={(e) => onSessionChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
          >
            <option value="">
              {loading ? 'Loading...' : 'Select a race'}
            </option>
            {sessions.map((session) => (
              <option key={session.session_key} value={session.session_key}>
                {session.session_name}
              </option>
            ))}
          </select>
        </div>

        {/* Lap Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Lap
          </label>
          <select
            value={currentLap}
            onChange={(e) => onLapChange(parseInt(e.target.value))}
            disabled={!selectedSession}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
          >
            {Array.from({ length: totalLaps }, (_, i) => i + 1).map((lap) => (
              <option key={lap} value={lap}>
                Lap {lap}
              </option>
            ))}
          </select>
        </div>

        {/* Speed Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Speed Filter
          </label>
          <select
            value={speedFilter}
            onChange={(e) => onSpeedFilterChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
          >
            {speedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lap Info */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Race Progress
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
            {selectedSession ? `${currentLap} / ${totalLaps}` : 'No race selected'}
          </div>
        </div>
      </div>
    </div>
  );
} 