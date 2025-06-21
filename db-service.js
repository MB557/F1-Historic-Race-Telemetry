const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');

class DatabaseService {
    constructor() {
        this.db = new sqlite3.Database('./f1_data.db');
    }

    // Get all sessions
    getSessions() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM sessions ORDER BY year DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get car data for a session
    getCarData(sessionKey) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM car_data 
                WHERE session_key = ? 
                ORDER BY timestamp, driver_number
            `;
            this.db.all(query, [sessionKey], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get position data for a session
    getPositionData(sessionKey) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM position_data 
                WHERE session_key = ? 
                ORDER BY timestamp, driver_number
            `;
            this.db.all(query, [sessionKey], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get lap times for a session
    getLapTimes(sessionKey) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM lap_times 
                WHERE session_key = ? 
                ORDER BY lap_number, driver_number
            `;
            this.db.all(query, [sessionKey], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Insert or update session
    upsertSession(sessionData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO sessions 
                (session_key, session_name, session_type, date_start, date_end, country_name, year, total_laps)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            this.db.run(query, [
                sessionData.session_key,
                sessionData.session_name,
                sessionData.session_type,
                sessionData.date_start,
                sessionData.date_end,
                sessionData.country_name,
                sessionData.year,
                sessionData.total_laps
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Batch insert car data
    insertCarData(carDataArray) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO car_data 
                (session_key, driver_number, timestamp, speed, gear, throttle, brake, rpm, drs)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const stmt = this.db.prepare(query);
            let completed = 0;
            let hasError = false;

            if (carDataArray.length === 0) {
                resolve(0);
                return;
            }

            carDataArray.forEach((data) => {
                stmt.run([
                    data.session_key,
                    data.driver_number,
                    data.timestamp,
                    data.speed,
                    data.gear,
                    data.throttle,
                    data.brake,
                    data.rpm,
                    data.drs
                ], function(err) {
                    if (err && !hasError) {
                        hasError = true;
                        reject(err);
                        return;
                    }
                    
                    completed++;
                    if (completed === carDataArray.length) {
                        stmt.finalize();
                        resolve(completed);
                    }
                });
            });
        });
    }

    // Batch insert position data
    insertPositionData(positionDataArray) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO position_data 
                (session_key, driver_number, timestamp, x, y, z)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const stmt = this.db.prepare(query);
            let completed = 0;
            let hasError = false;

            if (positionDataArray.length === 0) {
                resolve(0);
                return;
            }

            positionDataArray.forEach((data) => {
                stmt.run([
                    data.session_key,
                    data.driver_number,
                    data.timestamp,
                    data.x,
                    data.y,
                    data.z
                ], function(err) {
                    if (err && !hasError) {
                        hasError = true;
                        reject(err);
                        return;
                    }
                    
                    completed++;
                    if (completed === positionDataArray.length) {
                        stmt.finalize();
                        resolve(completed);
                    }
                });
            });
        });
    }

    // Fetch data from OpenF1 API in chunks to avoid 422 errors
    async fetchAndStoreRaceData(sessionKey) {
        console.log(`Fetching race data for session ${sessionKey}...`);
        
        try {
            // First, get session info
            const sessionResponse = await axios.get('https://api.openf1.org/v1/sessions', {
                params: { session_key: sessionKey }
            });
            
            if (sessionResponse.data.length > 0) {
                const sessionInfo = sessionResponse.data[0];
                await this.upsertSession({
                    session_key: sessionKey,
                    session_name: sessionInfo.session_name,
                    session_type: sessionInfo.session_type,
                    date_start: sessionInfo.date_start,
                    date_end: sessionInfo.date_end,
                    country_name: sessionInfo.country_name,
                    year: sessionInfo.year || new Date(sessionInfo.date_start).getFullYear(),
                    total_laps: sessionInfo.total_laps
                });
                console.log(`Session info stored for ${sessionInfo.session_name}`);
            }

            // Get list of drivers for this session
            const driversResponse = await axios.get('https://api.openf1.org/v1/drivers', {
                params: { session_key: sessionKey }
            });
            
            const drivers = driversResponse.data.map(d => d.driver_number);
            console.log(`Found ${drivers.length} drivers:`, drivers);

            // Fetch car data for each driver separately to avoid 422 errors
            let totalCarData = 0;
            let totalPositionData = 0;

            for (const driverNumber of drivers) {
                console.log(`Fetching data for driver ${driverNumber}...`);
                
                try {
                    // Fetch car data for this driver
                    const carDataResponse = await axios.get('https://api.openf1.org/v1/car_data', {
                        params: { 
                            session_key: sessionKey,
                            driver_number: driverNumber
                        },
                        timeout: 30000
                    });

                    if (carDataResponse.data.length > 0) {
                        const carData = carDataResponse.data.map(item => ({
                            session_key: sessionKey,
                            driver_number: item.driver_number,
                            timestamp: new Date(item.date).getTime() / 1000,
                            speed: item.speed,
                            gear: item.n_gear,
                            throttle: item.throttle,
                            brake: item.brake,
                            rpm: item.rpm,
                            drs: item.drs
                        }));

                        await this.insertCarData(carData);
                        totalCarData += carData.length;
                        console.log(`Stored ${carData.length} car data points for driver ${driverNumber}`);
                    }

                    // Fetch position data for this driver
                    const positionResponse = await axios.get('https://api.openf1.org/v1/position', {
                        params: { 
                            session_key: sessionKey,
                            driver_number: driverNumber
                        },
                        timeout: 30000
                    });

                    if (positionResponse.data.length > 0) {
                        const positionData = positionResponse.data.map(item => ({
                            session_key: sessionKey,
                            driver_number: item.driver_number,
                            timestamp: new Date(item.date).getTime() / 1000,
                            x: item.x,
                            y: item.y,
                            z: item.z
                        }));

                        await this.insertPositionData(positionData);
                        totalPositionData += positionData.length;
                        console.log(`Stored ${positionData.length} position points for driver ${driverNumber}`);
                    }

                    // Add delay between requests to be respectful to the API
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`Error fetching data for driver ${driverNumber}:`, error.message);
                    // Continue with next driver
                }
            }

            console.log(`Completed fetching data for session ${sessionKey}`);
            console.log(`Total car data points: ${totalCarData}`);
            console.log(`Total position data points: ${totalPositionData}`);

            return { totalCarData, totalPositionData };

        } catch (error) {
            console.error('Error fetching race data:', error.message);
            throw error;
        }
    }

    close() {
        this.db.close();
    }
}

module.exports = DatabaseService; 