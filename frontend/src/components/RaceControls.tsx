import React, { useState, useEffect } from 'react'

interface Race {
  session_key: string;
  session_name: string;
  country: string;
  date: string;
}

interface Year {
  year: number;
  name: string;
}

interface RaceControlsProps {
  onRaceChange: (sessionKey: string, sessionName: string) => void;
  onLapChange: (lap: number) => void;
  onSpeedFilterChange: (filter: number) => void;
  currentLap: number;
  totalLaps: number;
  speedFilter: number;
  isLoading: boolean;
}

const RaceControls: React.FC<RaceControlsProps> = ({
  onRaceChange,
  onLapChange,
  onSpeedFilterChange,
  currentLap,
  totalLaps,
  speedFilter,
  isLoading
}) => {
  const [years, setYears] = useState<Year[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRace, setSelectedRace] = useState<string>('');
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingRaces, setLoadingRaces] = useState(false);

  // Determine API base URL
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api'
        : '/.netlify/functions/api';
    }
    return '/.netlify/functions/api';
  };

  // Load available years on component mount
  useEffect(() => {
    const loadYears = async () => {
      setLoadingYears(true);
      try {
        const response = await fetch(`${getApiUrl()}/years`);
        if (response.ok) {
          const yearsData = await response.json();
          setYears(yearsData);
          // Default to 2024
          if (yearsData.length > 0) {
            setSelectedYear(2024);
          }
        }
      } catch (error) {
        console.error('Error loading years:', error);
      } finally {
        setLoadingYears(false);
      }
    };

    loadYears();
  }, []);

  // Load races when year changes
  useEffect(() => {
    if (selectedYear) {
      const loadRaces = async () => {
        setLoadingRaces(true);
        try {
          const response = await fetch(`${getApiUrl()}/sessions?year=${selectedYear}`);
          if (response.ok) {
            const racesData = await response.json();
            setRaces(racesData);
            setSelectedRace(''); // Reset race selection
          }
        } catch (error) {
          console.error('Error loading races:', error);
        } finally {
          setLoadingRaces(false);
        }
      };

      loadRaces();
    }
  }, [selectedYear]);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    setSelectedYear(year);
  };

  const handleRaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sessionKey = event.target.value;
    setSelectedRace(sessionKey);
    
    if (sessionKey) {
      const race = races.find(r => r.session_key === sessionKey);
      if (race) {
        onRaceChange(sessionKey, race.session_name);
      }
    }
  };

  const handleLapChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const lap = parseInt(event.target.value);
    onLapChange(lap);
  };

  const handleSpeedFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const filter = parseInt(event.target.value);
    onSpeedFilterChange(filter);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">🏎️ F1 Live Telemetry Controls</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Year Selection */}
        <div>
          <label htmlFor="year-select" className="block text-sm font-medium text-gray-800 mb-2">
            📅 Season
          </label>
          <select
            id="year-select"
            value={selectedYear || ''}
            onChange={handleYearChange}
            disabled={loadingYears}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="">
              {loadingYears ? 'Loading...' : 'Select Season'}
            </option>
            {years.map((year) => (
              <option key={year.year} value={year.year} className="text-gray-900">
                {year.name}
              </option>
            ))}
          </select>
        </div>

        {/* Race Selection */}
        <div>
          <label htmlFor="race-select" className="block text-sm font-medium text-gray-800 mb-2">
            🏁 Grand Prix
          </label>
          <select
            id="race-select"
            value={selectedRace}
            onChange={handleRaceChange}
            disabled={!selectedYear || loadingRaces || isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="">
              {loadingRaces ? 'Loading...' : !selectedYear ? 'Select Season First' : 'Select Grand Prix'}
            </option>
            {races.map((race) => (
              <option key={race.session_key} value={race.session_key} className="text-gray-900">
                {race.session_name}
              </option>
            ))}
          </select>
        </div>

        {/* Lap Navigation */}
        <div>
          <label htmlFor="lap-slider" className="block text-sm font-medium text-gray-800 mb-2">
            🏃 Lap: {currentLap} / {totalLaps}
          </label>
          <input
            id="lap-slider"
            type="range"
            min="1"
            max={totalLaps || 1}
            value={currentLap}
            onChange={handleLapChange}
            disabled={!selectedRace || isLoading}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Lap 1</span>
            <span>Lap {totalLaps}</span>
          </div>
        </div>

        {/* Speed Filter */}
        <div>
          <label htmlFor="speed-filter" className="block text-sm font-medium text-gray-800 mb-2">
            ⚡ Speed Filter
          </label>
          <select
            id="speed-filter"
            value={speedFilter}
            onChange={handleSpeedFilterChange}
            disabled={!selectedRace || isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value={0} className="text-gray-900">All Speeds</option>
            <option value={50} className="text-gray-900">≥ 50 km/h</option>
            <option value={100} className="text-gray-900">≥ 100 km/h</option>
            <option value={150} className="text-gray-900">≥ 150 km/h</option>
            <option value={200} className="text-gray-900">≥ 200 km/h</option>
            <option value={250} className="text-gray-900">≥ 250 km/h</option>
            <option value={300} className="text-gray-900">≥ 300 km/h</option>
          </select>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="mt-4 flex flex-wrap gap-2">
        {loadingYears && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Loading seasons...
          </span>
        )}
        {loadingRaces && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Loading races...
          </span>
        )}
        {isLoading && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Loading telemetry...
          </span>
        )}
        {selectedRace && !isLoading && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Ready
          </span>
        )}
      </div>
    </div>
  );
};

export default RaceControls; 