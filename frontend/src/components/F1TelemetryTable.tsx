'use client';

import React, { useMemo } from 'react';

interface CarData {
  driver_number: number;
  timestamp: number;
  speed: number;
  gear: number;
  throttle: number;
  brake: number;
  rpm: number;
  drs: number;
  x?: number;
  y?: number;
  z?: number;
  position?: number;
  lap_time?: number;
  gap_to_leader?: string;
}

interface F1TelemetryTableProps {
  carData: CarData[];
  currentTimestamp: number;
  speedFilter: number;
}

const F1TelemetryTable: React.FC<F1TelemetryTableProps> = ({ 
  carData, 
  speedFilter 
}) => {

  // Filter cars by speed if speedFilter is set
  const filteredData = useMemo(() => {
    return speedFilter > 0 
      ? carData.filter(car => car.speed >= speedFilter)
      : carData;
  }, [carData, speedFilter]);

  // Sort by race position (if available), otherwise by driver number
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (a.position && b.position) {
        return a.position - b.position;
      }
      return a.driver_number - b.driver_number;
    });
  }, [filteredData]);

  const getSpeedColor = (speed: number) => {
    if (speed === 0) return 'text-gray-500';
    if (speed < 100) return 'text-red-600';
    if (speed < 200) return 'text-yellow-600';
    if (speed < 300) return 'text-green-600';
    return 'text-blue-600';
  };

  const getBrakeStatus = (brake: number) => {
    return brake > 0 ? '🔴' : '⚫';
  };

  const getDRSStatus = (drs: number) => {
    return drs > 0 ? '✅' : '❌';
  };

  if (sortedData.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-yellow-800 font-medium">No data available</div>
        <div className="text-yellow-600 text-sm mt-1">
          No telemetry data found for this lap.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          F1 Telemetry Data
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Cars: {sortedData.length}
          {speedFilter > 0 && ` | Speed Filter: ≥${speedFilter} km/h`}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                Speed (km/h)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                Gear
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                Throttle %
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                Brake
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                RPM
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                DRS
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                Gap
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((car) => (
              <tr key={car.driver_number} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">
                      {car.position || '?'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {car.driver_number}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`text-sm font-semibold ${getSpeedColor(car.speed)}`}>
                    {car.speed ? Math.round(car.speed) : 0}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {car.gear || 'N'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {car.throttle ? Math.round(car.throttle) : 0}%
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className="text-lg">{getBrakeStatus(car.brake)}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {car.rpm ? Math.round(car.rpm).toLocaleString() : 0}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className="text-sm">{getDRSStatus(car.drs)}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {car.gap_to_leader ? `+${car.gap_to_leader}s` : (car.position === 1 ? 'Leader' : 'N/A')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {speedFilter > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t text-sm text-gray-600">
          Showing {sortedData.length} of {carData.length} cars with speed ≥ {speedFilter} km/h
        </div>
      )}
    </div>
  );
};

export default F1TelemetryTable; 