const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// OpenF1 API client
class OpenF1Client {
  constructor() {
    this.baseURL = 'https://api.openf1.org/v1';
  }

  async getSessions(year = 2023, countryName = 'Bahrain') {
    try {
      const response = await axios.get(`${this.baseURL}/sessions`, {
        params: { year, country_name: countryName }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  async getRaceSession(year = 2023, countryName = 'Bahrain') {
    const sessions = await this.getSessions(year, countryName);
    const raceSessions = sessions.filter(s => s.session_type === 'Race');
    return raceSessions.length > 0 ? raceSessions[0] : null;
  }

  async searchRaceByName(raceName) {
    try {
      const { year, country } = this.parseRaceName(raceName);
      
      if (!year || !country) {
        console.error(`Could not parse race name: ${raceName}`);
        return null;
      }

      const sessions = await this.getSessions(year, country);
      const raceSessions = sessions.filter(s => s.session_type === 'Race');
      
      if (raceSessions.length > 0) {
        const session = raceSessions[0];
        console.log(`Found race session for '${raceName}': ${session.session_key}`);
        return session;
      } else {
        console.warn(`No race session found for '${raceName}'`);
        return null;
      }
    } catch (error) {
      console.error(`Error searching for race '${raceName}':`, error);
      return null;
    }
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
      'japan': 'Japan',
      'china': 'China',
      'miami': 'United States',
      'italy': 'Italy',
      'monaco': 'Monaco',
      'spain': 'Spain',
      'canada': 'Canada',
      'austria': 'Austria',
      'britain': 'United Kingdom',
      'uk': 'United Kingdom',
      'hungary': 'Hungary',
      'belgium': 'Belgium',
      'netherlands': 'Netherlands',
      'singapore': 'Singapore',
      'mexico': 'Mexico',
      'brazil': 'Brazil',
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

    console.log(`Parsed '${raceName}' -> Year: ${year}, Country: ${country}`);
    return { year, country };
  }

  async getPositionData(sessionKey) {
    try {
      const response = await axios.get(`${this.baseURL}/position`, {
        params: { session_key: sessionKey }
      });
      console.log(`Fetched ${response.data.length} position records for session ${sessionKey}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching position data:', error);
      throw error;
    }
  }

  async getCarData(sessionKey) {
    try {
      const response = await axios.get(`${this.baseURL}/car_data`, {
        params: { session_key: sessionKey }
      });
      console.log(`Fetched ${response.data.length} car data records for session ${sessionKey}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching car data:', error);
      throw error;
    }
  }

  async getLapTimes(sessionKey) {
    try {
      const response = await axios.get(`${this.baseURL}/laps`, {
        params: { session_key: sessionKey }
      });
      console.log(`Fetched ${response.data.length} lap records for session ${sessionKey}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lap times:', error);
      throw error;
    }
  }

  async fetchAllSessionData(sessionKey) {
    try {
      const [positionData, lapTimes] = await Promise.all([
        this.getPositionData(sessionKey),
        this.getLapTimes(sessionKey)
      ]);

      let carData = [];
      try {
        carData = await this.getCarData(sessionKey);
      } catch (error) {
        console.warn('Could not fetch car data, continuing without it:', error.message);
      }

      return {
        position: positionData,
        car_data: carData,
        lap_times: lapTimes
      };
    } catch (error) {
      console.error('Error fetching session data:', error);
      throw error;
    }
  }
}

// Data service using localStorage (client-side) simulation
class DataService {
  constructor() {
    this.openf1Client = new OpenF1Client();
    this.sessionStorage = new Map(); // In-memory storage for demo
  }

  convertTimestamp(dateStr) {
    try {
      return new Date(dateStr).getTime() / 1000;
    } catch (error) {
      console.warn(`Could not parse timestamp: ${dateStr}`);
      return 0;
    }
  }

  processRawData(rawData) {
    const processed = {};

    if (rawData.position) {
      processed.position = rawData.position.map(record => ({
        ...record,
        date: this.convertTimestamp(record.date)
      }));
    }

    if (rawData.car_data) {
      processed.car_data = rawData.car_data.map(record => ({
        ...record,
        date: this.convertTimestamp(record.date)
      }));
    }

    if (rawData.lap_times) {
      processed.lap_times = rawData.lap_times;
    }

    return processed;
  }

  async fetchAndStoreSessionData(sessionKey, sessionName = 'Unknown Race', countryName = 'Unknown') {
    try {
      console.log(`Starting data fetch for session ${sessionKey}`);

      if (this.sessionStorage.has(sessionKey)) {
        console.log(`Session ${sessionKey} already exists in storage`);
        return true;
      }

      const sessionData = await this.openf1Client.fetchAllSessionData(sessionKey);
      const processedData = this.processRawData(sessionData);

      this.sessionStorage.set(sessionKey, {
        sessionInfo: {
          session_key: sessionKey,
          session_name: sessionName,
          session_type: 'Race',
          country_name: countryName,
          year: 2023
        },
        data: processedData
      });

      console.log(`Successfully stored data for session ${sessionKey}`);
      return true;
    } catch (error) {
      console.error('Error fetching and storing session data:', error);
      return false;
    }
  }

  getReplayState(sessionKey, timestamp) {
    const sessionData = this.sessionStorage.get(sessionKey);
    if (!sessionData) return null;

    const { position, car_data } = sessionData.data;
    
    // Find closest position data to the timestamp
    const cars = [];
    const driverNumbers = [...new Set(position.map(p => p.driver_number))];

    for (const driverNumber of driverNumbers) {
      const driverPositions = position.filter(p => p.driver_number === driverNumber);
      const driverCarData = car_data.filter(c => c.driver_number === driverNumber);

      // Find closest position record
      let closestPosition = null;
      let minTimeDiff = Infinity;

      for (const pos of driverPositions) {
        const timeDiff = Math.abs(pos.date - timestamp);
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestPosition = pos;
        }
      }

      // Find closest car data
      let closestCarData = null;
      minTimeDiff = Infinity;

      for (const car of driverCarData) {
        const timeDiff = Math.abs(car.date - timestamp);
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestCarData = car;
        }
      }

      if (closestPosition) {
        cars.push({
          driver_number: driverNumber,
          x: closestPosition.position || 0,
          y: 0,
          speed: closestCarData?.speed || 0,
          gear: closestCarData?.n_gear || 1,
          throttle: closestCarData?.throttle || 0,
          brake: closestCarData?.brake || false,
          timestamp: closestPosition.date
        });
      }
    }

    return {
      timestamp,
      cars: cars.sort((a, b) => a.x - b.x)
    };
  }

  getSessionTimeline(sessionKey) {
    const sessionData = this.sessionStorage.get(sessionKey);
    if (!sessionData) return null;

    const { lap_times } = sessionData.data;
    const entries = [];

    for (const lap of lap_times) {
      entries.push({
        lap: lap.lap_number || 0,
        driver_number: lap.driver_number || 0,
        sector1_time: lap.sector_1_time,
        sector2_time: lap.sector_2_time,
        sector3_time: lap.sector_3_time,
        lap_time: lap.lap_time,
        pit_stop: Boolean(lap.pit_in_time || lap.pit_out_time)
      });
    }

    const totalLaps = Math.max(...lap_times.map(l => l.lap_number || 0));

    return {
      session_key: sessionKey,
      total_laps: totalLaps,
      entries
    };
  }

  async initializeRaceByName(raceName) {
    try {
      const raceSession = await this.openf1Client.searchRaceByName(raceName);
      
      if (!raceSession) {
        console.error(`Could not find race session for '${raceName}'`);
        return null;
      }

      const sessionKey = String(raceSession.session_key);
      const sessionName = raceSession.session_name || raceName;
      const countryName = raceSession.country_name || 'Unknown';

      console.log(`Found race session for '${raceName}': ${sessionKey}`);

      const success = await this.fetchAndStoreSessionData(sessionKey, sessionName, countryName);

      if (success) {
        console.log(`Race session initialized: ${sessionKey} (${raceName})`);
        return sessionKey;
      } else {
        console.error(`Failed to initialize race session for '${raceName}'`);
        return null;
      }
    } catch (error) {
      console.error(`Error initializing race session for '${raceName}':`, error);
      return null;
    }
  }
}

const dataService = new DataService();

// Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'F1 Historic Race Replayer API',
    version: '2.0.0',
    backend: 'Node.js'
  });
});

app.get('/api/replay/:sessionKey/state', (req, res) => {
  const { sessionKey } = req.params;
  const { t } = req.query;

  if (!t) {
    return res.status(400).json({ error: 'Timestamp parameter t is required' });
  }

  const timestamp = parseFloat(t);
  const replayState = dataService.getReplayState(sessionKey, timestamp);

  if (!replayState) {
    return res.status(404).json({ 
      error: `No data found for session ${sessionKey} at timestamp ${timestamp}` 
    });
  }

  res.json(replayState);
});

app.get('/api/replay/:sessionKey/timeline', (req, res) => {
  const { sessionKey } = req.params;
  const timeline = dataService.getSessionTimeline(sessionKey);

  if (!timeline) {
    return res.status(404).json({ 
      error: `No timeline data found for session ${sessionKey}` 
    });
  }

  res.json(timeline);
});

app.post('/api/load-race', async (req, res) => {
  const { race_name } = req.query;

  if (!race_name) {
    return res.status(400).json({ 
      success: false, 
      message: 'Race name parameter is required' 
    });
  }

  try {
    const sessionKey = await dataService.initializeRaceByName(race_name);

    if (sessionKey) {
      res.json({
        success: true,
        message: `Successfully loaded race: ${race_name}`,
        session_key: sessionKey,
        endpoints: {
          state: `/api/replay/${sessionKey}/state?t={timestamp}`,
          timeline: `/api/replay/${sessionKey}/timeline`
        },
        example_usage: {
          state: `/api/replay/${sessionKey}/state?t=1678024866`,
          timeline: `/api/replay/${sessionKey}/timeline`
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Could not find or load race: ${race_name}`
      });
    }
  } catch (error) {
    console.error('Error loading race:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Serve Next.js frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/out')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/out/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🏎️  F1 Historic Race Replayer API running on port ${PORT}`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🖥️  Frontend: http://localhost:3000`);
  }
}); 