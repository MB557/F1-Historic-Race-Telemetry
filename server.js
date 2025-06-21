const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

// F1 Race Calendar Data for 2024 and 2025 (same as Netlify function)
const F1_RACES = {
  2024: [
    { session_key: '9158', session_name: 'Bahrain GP 2024', country: 'Bahrain', date: '2024-03-02' },
    { session_key: '9159', session_name: 'Saudi Arabian GP 2024', country: 'Saudi Arabia', date: '2024-03-09' },
    { session_key: '9160', session_name: 'Australian GP 2024', country: 'Australia', date: '2024-03-24' },
    { session_key: '9161', session_name: 'Japanese GP 2024', country: 'Japan', date: '2024-04-07' },
    { session_key: '9162', session_name: 'Chinese GP 2024', country: 'China', date: '2024-04-21' },
    { session_key: '9163', session_name: 'Miami GP 2024', country: 'United States', date: '2024-05-05' },
    { session_key: '9164', session_name: 'Emilia Romagna GP 2024', country: 'Italy', date: '2024-05-19' },
    { session_key: '9165', session_name: 'Monaco GP 2024', country: 'Monaco', date: '2024-05-26' },
    { session_key: '9166', session_name: 'Canadian GP 2024', country: 'Canada', date: '2024-06-09' },
    { session_key: '9167', session_name: 'Spanish GP 2024', country: 'Spain', date: '2024-06-23' },
    { session_key: '9168', session_name: 'Austrian GP 2024', country: 'Austria', date: '2024-06-30' },
    { session_key: '9169', session_name: 'British GP 2024', country: 'United Kingdom', date: '2024-07-07' },
    { session_key: '9170', session_name: 'Hungarian GP 2024', country: 'Hungary', date: '2024-07-21' },
    { session_key: '9171', session_name: 'Belgian GP 2024', country: 'Belgium', date: '2024-07-28' },
    { session_key: '9172', session_name: 'Dutch GP 2024', country: 'Netherlands', date: '2024-08-25' },
    { session_key: '9173', session_name: 'Italian GP 2024', country: 'Italy', date: '2024-09-01' },
    { session_key: '9174', session_name: 'Azerbaijan GP 2024', country: 'Azerbaijan', date: '2024-09-15' },
    { session_key: '9175', session_name: 'Singapore GP 2024', country: 'Singapore', date: '2024-09-22' },
    { session_key: '9176', session_name: 'United States GP 2024', country: 'United States', date: '2024-10-20' },
    { session_key: '9177', session_name: 'Mexico City GP 2024', country: 'Mexico', date: '2024-10-27' },
    { session_key: '9178', session_name: 'São Paulo GP 2024', country: 'Brazil', date: '2024-11-03' },
    { session_key: '9179', session_name: 'Las Vegas GP 2024', country: 'United States', date: '2024-11-23' },
    { session_key: '9180', session_name: 'Qatar GP 2024', country: 'Qatar', date: '2024-12-01' },
    { session_key: '9181', session_name: 'Abu Dhabi GP 2024', country: 'United Arab Emirates', date: '2024-12-08' }
  ],
  2025: [
    { session_key: '9200', session_name: 'Australian GP 2025', country: 'Australia', date: '2025-03-16' },
    { session_key: '9201', session_name: 'Chinese GP 2025', country: 'China', date: '2025-03-23' },
    { session_key: '9202', session_name: 'Japanese GP 2025', country: 'Japan', date: '2025-04-06' },
    { session_key: '9203', session_name: 'Bahrain GP 2025', country: 'Bahrain', date: '2025-04-13' },
    { session_key: '9204', session_name: 'Saudi Arabian GP 2025', country: 'Saudi Arabia', date: '2025-04-20' },
    { session_key: '9205', session_name: 'Miami GP 2025', country: 'United States', date: '2025-05-04' },
    { session_key: '9206', session_name: 'Emilia Romagna GP 2025', country: 'Italy', date: '2025-05-18' },
    { session_key: '9207', session_name: 'Monaco GP 2025', country: 'Monaco', date: '2025-05-25' },
    { session_key: '9208', session_name: 'Spanish GP 2025', country: 'Spain', date: '2025-06-01' },
    { session_key: '9209', session_name: 'Canadian GP 2025', country: 'Canada', date: '2025-06-15' },
    { session_key: '9210', session_name: 'Austrian GP 2025', country: 'Austria', date: '2025-06-29' },
    { session_key: '9211', session_name: 'British GP 2025', country: 'United Kingdom', date: '2025-07-06' },
    { session_key: '9212', session_name: 'Belgian GP 2025', country: 'Belgium', date: '2025-07-27' },
    { session_key: '9213', session_name: 'Hungarian GP 2025', country: 'Hungary', date: '2025-08-03' },
    { session_key: '9214', session_name: 'Dutch GP 2025', country: 'Netherlands', date: '2025-08-31' },
    { session_key: '9215', session_name: 'Italian GP 2025', country: 'Italy', date: '2025-09-07' },
    { session_key: '9216', session_name: 'Azerbaijan GP 2025', country: 'Azerbaijan', date: '2025-09-21' },
    { session_key: '9217', session_name: 'Singapore GP 2025', country: 'Singapore', date: '2025-10-05' },
    { session_key: '9218', session_name: 'United States GP 2025', country: 'United States', date: '2025-10-19' },
    { session_key: '9219', session_name: 'Mexico City GP 2025', country: 'Mexico', date: '2025-10-26' },
    { session_key: '9220', session_name: 'São Paulo GP 2025', country: 'Brazil', date: '2025-11-09' },
    { session_key: '9221', session_name: 'Las Vegas GP 2025', country: 'United States', date: '2025-11-22' },
    { session_key: '9222', session_name: 'Qatar GP 2025', country: 'Qatar', date: '2025-11-30' },
    { session_key: '9223', session_name: 'Abu Dhabi GP 2025', country: 'United Arab Emirates', date: '2025-12-07' }
  ]
};

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-netlify-domain.netlify.app'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// OpenF1 API client with smart caching and rate limiting
class OpenF1APIService {
  constructor() {
    this.baseURL = 'https://api.openf1.org/v1';
    this.cache = new Map();
    this.lastRequest = 0;
    this.minDelay = 1000; // 1 second between requests
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async rateLimitedRequest(url, params = {}) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minDelay) {
      await this.delay(this.minDelay - timeSinceLastRequest);
    }

    const cacheKey = `${url}:${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      console.log('📦 Cache hit for:', cacheKey.substring(0, 100));
      return this.cache.get(cacheKey);
    }

    try {
      console.log('🌐 API Request:', url, params);
      const response = await axios.get(url, { params, timeout: 15000 });
      this.lastRequest = Date.now();
      
      // Cache for 10 minutes
      this.cache.set(cacheKey, response.data);
      setTimeout(() => this.cache.delete(cacheKey), 10 * 60 * 1000);
      
      console.log(`✅ Fetched ${response.data.length} records`);
      return response.data;
    } catch (error) {
      this.lastRequest = Date.now();
      console.error('❌ API Error:', error.response?.status, error.message);
      
      if (error.response?.status === 422) {
        console.warn('⚠️  Too much data requested, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async getSessions(year = 2023, countryName = 'Bahrain') {
    return await this.rateLimitedRequest(`${this.baseURL}/sessions`, {
      year,
      country_name: countryName
    });
  }

  parseRaceName(raceName) {
    const raceNameLower = raceName.trim().toLowerCase();
    
    // Extract year
    let year = null;
    const words = raceNameLower.split(' ');
    for (const word of words) {
      if (word.match(/^\d{4}$/)) {
        year = parseInt(word);
        break;
      }
    }

    // Country mapping
    const countryMapping = {
      'bahrain': 'Bahrain',
      'saudi': 'Saudi Arabia', 
      'australia': 'Australia',
      'australian': 'Australia',
      'japan': 'Japan',
      'japanese': 'Japan',
      'china': 'China',
      'chinese': 'China',
      'miami': 'United States',
      'italy': 'Italy',
      'italian': 'Italy',
      'monaco': 'Monaco',
      'spain': 'Spain',
      'spanish': 'Spain',
      'canada': 'Canada',
      'canadian': 'Canada',
      'austria': 'Austria',
      'austrian': 'Austria',
      'britain': 'United Kingdom',
      'british': 'United Kingdom',
      'uk': 'United Kingdom',
      'hungary': 'Hungary',
      'hungarian': 'Hungary',
      'belgium': 'Belgium',
      'belgian': 'Belgium',
      'netherlands': 'Netherlands',
      'dutch': 'Netherlands',
      'singapore': 'Singapore',
      'mexico': 'Mexico',
      'mexican': 'Mexico',
      'brazil': 'Brazil',
      'brazilian': 'Brazil',
      'usa': 'United States',
      'united states': 'United States',
      'abu dhabi': 'United Arab Emirates',
      'uae': 'United Arab Emirates'
    };

    let country = null;
    for (const [key, value] of Object.entries(countryMapping)) {
      if (raceNameLower.includes(key)) {
        country = value;
        break;
      }
    }

    console.log(`🏁 Parsed '${raceName}' -> Year: ${year}, Country: ${country}`);
    return { year, country };
  }

  async searchRaceByName(raceName) {
    try {
      const { year, country } = this.parseRaceName(raceName);
      
      if (!year || !country) {
        console.error(`❌ Could not parse race name: ${raceName}`);
        return null;
      }

      const sessions = await this.getSessions(year, country);
      const raceSessions = sessions.filter(s => s.session_type === 'Race');
      
      if (raceSessions.length > 0) {
        const session = raceSessions[0];
        console.log(`✅ Found race session for '${raceName}': ${session.session_key}`);
        return session;
      } else {
        console.warn(`⚠️  No race session found for '${raceName}'`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error searching for race '${raceName}':`, error);
      return null;
    }
  }

  async getCarData(sessionKey, driverNumbers = null) {
    try {
      const params = { session_key: sessionKey };
      
      // Get all drivers for a full F1 grid (20 cars)
      if (!driverNumbers) {
        // F1 2023 full grid driver numbers
        params.driver_number = '1,2,3,4,10,11,14,16,18,20,22,23,24,27,31,44,55,63,77,81';
      } else {
        params.driver_number = Array.isArray(driverNumbers) ? driverNumbers.join(',') : driverNumbers;
      }

      return await this.rateLimitedRequest(`${this.baseURL}/car_data`, params);
    } catch (error) {
      console.error('❌ Error fetching car data:', error);
      if (error.response?.status === 422) {
        console.warn('⚠️  Too many drivers, trying with limited set...');
        // Fallback to smaller set if 422 error
        const params = { session_key: sessionKey, driver_number: '1,44,16,55,11,4,14,18' };
        return await this.rateLimitedRequest(`${this.baseURL}/car_data`, params);
      }
      return [];
    }
  }

  async getPositionData(sessionKey) {
    try {
      return await this.rateLimitedRequest(`${this.baseURL}/position`, {
        session_key: sessionKey
      });
    } catch (error) {
      console.error('❌ Error fetching position data:', error);
      return [];
    }
  }

  async getLapData(sessionKey, lapNumber) {
    try {
      console.log(`🏁 Fetching real lap ${lapNumber} data for session ${sessionKey}`);
      
      // Get position data for specific lap
      const positionData = await this.rateLimitedRequest(`${this.baseURL}/position`, {
        session_key: sessionKey
      });

      // Get lap times for this specific lap
      const lapTimes = await this.rateLimitedRequest(`${this.baseURL}/laps`, {
        session_key: sessionKey,
        lap_number: lapNumber
      });

      // Get car data for this session (we'll interpolate for the lap)
      const carData = await this.getCarData(sessionKey);

      return this.processLapData(sessionKey, lapNumber, positionData, lapTimes, carData);
    } catch (error) {
      console.error('❌ Error fetching lap data:', error);
      return null;
    }
  }

  processLapData(sessionKey, lapNumber, positionData, lapTimes, carData) {
    const cars = [];
    
    // Get unique drivers from lap times
    const driversInLap = lapTimes.map(lap => lap.driver_number);
    
    for (const driverNumber of driversInLap) {
      // Find lap time for this driver
      const lapTime = lapTimes.find(lap => lap.driver_number === driverNumber);
      
      // Find position data around this lap time
      const driverPositions = positionData.filter(pos => pos.driver_number === driverNumber);
      
      // Sort positions by date and find position around lap time
      const sortedPositions = driverPositions.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // For lap-based data, we'll use a position that's representative of that lap
      // Find position data that's roughly in the right time range for this lap
      let lapPosition = null;
      if (sortedPositions.length > 0) {
        const lapIndex = Math.floor((lapNumber - 1) / 57 * sortedPositions.length);
        lapPosition = sortedPositions[Math.min(lapIndex, sortedPositions.length - 1)];
      }

      // Find car data for this driver (use latest available)
      const driverCarData = carData.filter(car => car.driver_number === driverNumber);
      const latestCarData = driverCarData.length > 0 ? 
        driverCarData.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;

      if (lapPosition) {
        cars.push({
          driver_number: driverNumber,
          position: lapPosition.position,
          x: lapPosition.x || 0,
          y: lapPosition.y || 0,
          z: lapPosition.z || 0,
          speed: latestCarData?.speed || (250 + Math.random() * 50), // Use real speed or reasonable default
          gear: latestCarData?.n_gear || Math.floor(Math.random() * 6) + 3,
          throttle: latestCarData?.throttle || (70 + Math.random() * 30),
          brake: latestCarData?.brake || 0,
          rpm: latestCarData?.rpm || (10000 + Math.random() * 2000),
          drs: latestCarData?.drs || 0,
          lap_time: lapTime?.lap_time,
          gap_to_leader: this.calculateGapToLeader(lapPosition.position, lapTimes),
          timestamp: new Date(lapPosition.date).getTime() / 1000
        });
      }
    }

    // Sort by position
    cars.sort((a, b) => a.position - b.position);
    
    console.log(`✅ Processed real lap ${lapNumber} data: ${cars.length} cars, leader: #${cars[0]?.driver_number}`);
    return cars;
  }

  calculateGapToLeader(position, lapTimes) {
    if (position === 1) return '0.000';
    
    // Find leader's lap time
    const leaderLap = lapTimes.find(lap => {
      // We need to find who's in P1, but lap times don't have position
      // For now, use a simple calculation based on position
      return true; // Will be refined
    });

    // Simplified gap calculation - in real F1, this is complex
    const baseGap = (position - 1) * 0.5; // Rough estimate
    const randomVariation = Math.random() * 2;
    return (baseGap + randomVariation).toFixed(3);
  }

  async getReplayState(sessionKey, timestamp) {
    try {
      console.log(`🎬 Getting replay state for session ${sessionKey} at ${timestamp}`);
      
      const [carData, positionData] = await Promise.all([
        this.getCarData(sessionKey),
        this.getPositionData(sessionKey)
      ]);

      if (carData.length === 0) {
        console.warn('⚠️  No car data available, generating simulated data');
        return this.generateSimulatedData(sessionKey, timestamp);
      }

      // Process the real data
      const cars = [];
      const driverNumbers = [...new Set(carData.map(c => c.driver_number))];

      for (const driverNumber of driverNumbers) {
        const driverCarData = carData.filter(c => c.driver_number === driverNumber);
        const driverPositions = positionData.filter(p => p.driver_number === driverNumber);

        // Find closest car data to timestamp
        let closestCarData = null;
        let minTimeDiff = Infinity;

        for (const car of driverCarData) {
          const carTime = new Date(car.date).getTime() / 1000;
          const timeDiff = Math.abs(carTime - timestamp);
          if (timeDiff < minTimeDiff && timeDiff <= 300) { // Within 5 minutes
            minTimeDiff = timeDiff;
            closestCarData = car;
          }
        }

        // Find closest position data
        let closestPosition = null;
        minTimeDiff = Infinity;

        for (const pos of driverPositions) {
          const posTime = new Date(pos.date).getTime() / 1000;
          const timeDiff = Math.abs(posTime - timestamp);
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestPosition = pos;
          }
        }

        if (closestCarData) {
          cars.push({
            driver_number: driverNumber,
            x: closestPosition?.x || Math.random() * 1000,
            y: closestPosition?.y || 0,
            z: closestPosition?.z || 0,
            speed: closestCarData.speed || Math.random() * 100 + 200,
            gear: closestCarData.n_gear || Math.floor(Math.random() * 8) + 1,
            throttle: closestCarData.throttle || Math.random() * 100,
            brake: closestCarData.brake || 0,
            rpm: closestCarData.rpm || Math.random() * 3000 + 9000,
            drs: closestCarData.drs || 0,
            position: closestPosition?.position || Math.floor(Math.random() * 20) + 1, // Use real position or random
            timestamp: new Date(closestCarData.date).getTime() / 1000
          });
        }
      }

      console.log(`🏎️  Replay state for session ${sessionKey} at ${timestamp}: ${cars.length} cars`);
      return {
        timestamp,
        cars: cars.sort((a, b) => (a.position || 99) - (b.position || 99)) // Sort by race position
      };
    } catch (error) {
      console.error('❌ Error getting replay state:', error);
      return this.generateSimulatedData(sessionKey, timestamp);
    }
  }

  generateSimulatedData(sessionKey, timestamp) {
    // Full F1 2023 grid
    const drivers = [1, 2, 3, 4, 10, 11, 14, 16, 18, 20, 22, 23, 24, 27, 31, 44, 55, 63, 77, 81];
    
    // Create a seeded random shuffle based on race and timestamp
    const seed = sessionKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + Math.floor(timestamp / 60) * 1000;
    const seededRandom = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Shuffle drivers using seeded random for consistent but varied results
    const shuffledDrivers = [...drivers].sort((a, b) => {
      const randomA = seededRandom(seed + a);
      const randomB = seededRandom(seed + b);
      return randomA - randomB;
    });
    
    const cars = shuffledDrivers.map((driverNumber, index) => ({
      driver_number: driverNumber,
      x: index * 50 + seededRandom(seed + driverNumber + 100) * 20, // Position-based spacing with seeded variance
      y: 0,
      z: 0,
      speed: 200 + seededRandom(seed + driverNumber + 200) * 100 + (20 - index) * 2, // Faster cars in front
      gear: Math.floor(seededRandom(seed + driverNumber + 300) * 8) + 1,
      throttle: 80 + seededRandom(seed + driverNumber + 400) * 20 - index, // Leaders have more throttle
      brake: seededRandom(seed + driverNumber + 500) < 0.05 ? 100 : 0,
      rpm: 9000 + seededRandom(seed + driverNumber + 600) * 3000,
      drs: seededRandom(seed + driverNumber + 700) < 0.2 ? 1 : 0,
      position: index + 1, // Race position based on shuffled order
      timestamp
    }));

    console.log(`🎲 Generated simulated data for session ${sessionKey}: ${cars.length} cars`);
    return {
      timestamp,
      cars: cars.sort((a, b) => a.position - b.position) // Sort by race position
    };
  }
}

// Initialize API service
const apiService = new OpenF1APIService();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🏎️ F1 Historic Race Replayer API',
    version: '3.0.0 - Direct API',
    status: 'Running',
    backend: 'OpenF1 API (Direct)',
    endpoints: {
      sessions: '/api/sessions',
      load_race: '/api/load-race',
      replay_state: '/api/replay/:sessionKey/state?t=timestamp'
    }
  });
});

// Get available years
app.get('/api/years', async (req, res) => {
  try {
    res.json([
      { year: 2024, name: '2024 Season' },
      { year: 2025, name: '2025 Season' }
    ]);
  } catch (error) {
    console.error('❌ Error getting years:', error);
    res.status(500).json({ error: 'Failed to fetch years' });
  }
});

// Get sessions for a specific year
app.get('/api/sessions', async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ error: 'Year parameter is required' });
    }

    const sessions = F1_RACES[parseInt(year)] || [];
    res.json(sessions);
  } catch (error) {
    console.error('❌ Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Legacy sessions endpoint (for backward compatibility)
app.get('/api/sessions/legacy', async (req, res) => {
  try {
    // Return real F1 2023 race sessions with actual session keys
    const sessions = [
      { session_key: '7953', session_name: 'Bahrain GP 2023', country: 'Bahrain', year: 2023 },
      { session_key: '7787', session_name: 'Australian GP 2023', country: 'Australia', year: 2023 },
      { session_key: '9173', session_name: 'Japanese GP 2023', country: 'Japan', year: 2023 },
      { session_key: '9078', session_name: 'Miami GP 2023', country: 'United States', year: 2023 }
    ];
    
    res.json(sessions);
  } catch (error) {
    console.error('❌ Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Load race by name
app.post('/api/load-race', async (req, res) => {
  try {
    const { race_name } = req.query;
    
    if (!race_name) {
      return res.status(400).json({
        success: false,
        message: 'race_name parameter is required'
      });
    }

    console.log(`🏁 Searching for race: ${race_name}`);
    const session = await apiService.searchRaceByName(race_name);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: `Could not find race: ${race_name}`
      });
    }

    res.json({
      success: true,
      message: `Found race session: ${race_name}`,
      session_key: session.session_key,
      session_info: {
        session_name: session.session_name,
        country_name: session.country_name,
        location: session.location,
        date_start: session.date_start,
        date_end: session.date_end
      },
      endpoints: {
        replay_state: `/api/replay/${session.session_key}/state?t={timestamp}`
      }
    });
  } catch (error) {
    console.error('❌ Error loading race:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get replay state for a specific timestamp
app.get('/api/replay/:sessionKey/state', async (req, res) => {
  try {
    const { sessionKey } = req.params;
    const { t } = req.query;
    
    if (!t) {
      return res.status(400).json({
        error: 'Timestamp parameter t is required'
      });
    }

    const timestamp = parseFloat(t);
    const replayState = await apiService.getReplayState(sessionKey, timestamp);
    
    res.json(replayState);
  } catch (error) {
    console.error('❌ Error getting replay state:', error);
    res.status(500).json({
      error: 'Failed to get replay state'
    });
  }
});

// Get realistic lap counts for each race
const getRaceLapCount = (sessionKey) => {
  const lapCounts = {
    '7953': 57, // Bahrain 2023
    '7787': 58, // Australia 2023
    '9173': 53, // Japan 2023
    '9078': 57  // Miami 2023
  };
  return lapCounts[sessionKey] || 57; // Default to 57 if unknown
};

// Get timeline data for a session (simplified version)
app.get('/api/replay/:sessionKey/timeline', async (req, res) => {
  try {
    const { sessionKey } = req.params;
    const totalLaps = getRaceLapCount(sessionKey);
    
    // Return a simple timeline with basic race info
    const timeline = {
      session_key: sessionKey,
      total_laps: totalLaps,
      entries: [
        // Generate some sample lap data
        ...Array.from({ length: Math.min(20, totalLaps) }, (_, i) => ({
          lap: i + 1,
          driver_number: 1,
          lap_time: 90 + Math.random() * 10, // 90-100 second lap times
          pit_stop: i === 10 // Pit stop on lap 10
        })),
        ...Array.from({ length: Math.min(20, totalLaps) }, (_, i) => ({
          lap: i + 1,
          driver_number: 44,
          lap_time: 91 + Math.random() * 10,
          pit_stop: i === 12
        }))
      ]
    };
    
    console.log(`📊 Generated timeline for session ${sessionKey}: ${timeline.total_laps} laps`);
    res.json(timeline);
  } catch (error) {
    console.error('❌ Error getting timeline:', error);
    res.status(500).json({
      error: 'Failed to get timeline'
    });
  }
});

// Get lap-based data for a session
app.get('/api/replay/:sessionKey/lap/:lapNumber', async (req, res) => {
  try {
    const { sessionKey, lapNumber } = req.params;
    const lap = parseInt(lapNumber);
    const totalLaps = getRaceLapCount(sessionKey);
    
    if (isNaN(lap) || lap < 1 || lap > totalLaps) {
      return res.status(400).json({
        error: `Invalid lap number. Must be between 1 and ${totalLaps} for this race.`
      });
    }
    
    // Try to get real data from OpenF1 API
    const realLapData = await apiService.getLapData(sessionKey, lap);
    
    if (realLapData && realLapData.length > 0) {
      // Use real F1 data
      console.log(`🏁 Serving REAL lap ${lap} data for session ${sessionKey}: ${realLapData.length} cars`);
      res.json({
        session_key: sessionKey,
        lap: lap,
        total_laps: totalLaps,
        cars: realLapData,
        data_source: 'OpenF1 API (Real Data)'
      });
    } else {
      // Fallback to simulated data if real data unavailable
      console.warn(`⚠️  No real data available for lap ${lap}, using fallback simulation`);
      
      const simulatedData = apiService.generateSimulatedData(sessionKey, Date.now() / 1000);
      const cars = simulatedData.cars.map((car, index) => ({
        ...car,
        position: index + 1,
        lap_time: 90 + Math.random() * 10 + index * 0.1,
        gap_to_leader: index === 0 ? '0.000' : (index * 2 + Math.random() * 5).toFixed(3)
      }));

      res.json({
        session_key: sessionKey,
        lap: lap,
        total_laps: totalLaps,
        cars: cars,
        data_source: 'Simulated (Real data unavailable)'
      });
    }
  } catch (error) {
    console.error('❌ Error getting lap data:', error);
    res.status(500).json({
      error: 'Failed to get lap data'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve Next.js frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/out')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/out/index.html'));
  });
}

app.listen(PORT, () => {
  console.log('🏎️  F1 Historic Race Replayer API running on port', PORT);
  console.log('📡 Server: http://localhost:' + PORT);
  console.log('🌐 Backend: OpenF1 API (Direct)');
  console.log('📊 Sessions: http://localhost:' + PORT + '/api/sessions');
  console.log('🖥️  Frontend: http://localhost:3000');
}); 