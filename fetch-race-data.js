#!/usr/bin/env node

const DatabaseService = require('./db-service');

async function fetchRaceData() {
    const db = new DatabaseService();
    
    // Sessions to fetch data for
    const sessions = [
        '7953', // Bahrain GP 2023
        '9173', // Japan GP 2023
        '9094', // Monaco GP 2023
    ];
    
    try {
        for (const sessionKey of sessions) {
            console.log(`\n=== Fetching data for session ${sessionKey} ===`);
            
            // Check if we already have car data for this session
            const existingData = await db.getCarData(sessionKey);
            if (existingData.length > 0) {
                console.log(`Session ${sessionKey} already has ${existingData.length} car data points. Skipping...`);
                continue;
            }
            
            try {
                const result = await db.fetchAndStoreRaceData(sessionKey);
                console.log(`✅ Successfully stored data for session ${sessionKey}`);
                console.log(`   Car data points: ${result.totalCarData}`);
                console.log(`   Position data points: ${result.totalPositionData}`);
            } catch (error) {
                console.error(`❌ Failed to fetch data for session ${sessionKey}:`, error.message);
            }
        }
        
        console.log('\n=== Data fetching completed ===');
        
        // Show summary of what's in the database
        const sessions_data = await db.getSessions();
        console.log('\nSessions in database:');
        for (const session of sessions_data) {
            const carData = await db.getCarData(session.session_key);
            const positionData = await db.getPositionData(session.session_key);
            console.log(`${session.session_key}: ${session.session_name} (${session.country_name} ${session.year})`);
            console.log(`  - Car data: ${carData.length} points`);
            console.log(`  - Position data: ${positionData.length} points`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        db.close();
    }
}

// Run if called directly
if (require.main === module) {
    fetchRaceData();
}

module.exports = { fetchRaceData }; 