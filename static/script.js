// F1 Historic Race Replayer - Frontend Logic
class F1RaceReplayer {
    constructor() {
        // State management
        this.currentSession = null;
        this.currentTimeline = null;
        this.isPlaying = false;
        this.playbackSpeed = 1;
        this.playbackInterval = null;
        this.minTimestamp = 0;
        this.maxTimestamp = 0;
        this.currentTimestamp = 0;
        
        // Canvas setup
        this.canvas = document.getElementById('raceCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Driver colors (F1 team colors approximation)
        this.driverColors = {
            1: '#0090FF', 44: '#0090FF', // Mercedes (Lewis, Valtteri)
            11: '#FF8700', 4: '#FF8700', // McLaren  
            16: '#FF0000', 55: '#FF0000', // Ferrari
            33: '#0600EF', 10: '#0600EF', // Red Bull
            14: '#358C75', 18: '#358C75', // Aston Martin
            31: '#900000', 20: '#900000', // Haas
            22: '#005AFF', 23: '#005AFF', // AlphaTauri
            24: '#FF0000', 77: '#FF0000', // Alfa Romeo
            63: '#FF0000', 5: '#FF0000',  // Williams
            3: '#FF8700', 27: '#FF8700',  // Alpine
        };
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Load race button
        document.getElementById('loadRaceBtn').addEventListener('click', () => {
            this.loadRace();
        });
        
        // Enter key on race input
        document.getElementById('raceInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadRace();
            }
        });
        
        // Time slider
        document.getElementById('timeSlider').addEventListener('input', (e) => {
            if (this.currentSession) {
                const progress = parseFloat(e.target.value) / 100;
                this.currentTimestamp = this.minTimestamp + (this.maxTimestamp - this.minTimestamp) * progress;
                this.updateRaceState();
            }
        });
        
        // Playback controls
        document.getElementById('playBtn').addEventListener('click', () => {
            this.startPlayback();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pausePlayback();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetPlayback();
        });
        
        // Speed control
        document.getElementById('speedSelect').addEventListener('change', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
        });
    }
    
    async loadRace() {
        const raceInput = document.getElementById('raceInput');
        const loadBtn = document.getElementById('loadRaceBtn');
        const loadingStatus = document.getElementById('loadingStatus');
        const errorMessage = document.getElementById('errorMessage');
        
        const raceName = raceInput.value.trim();
        if (!raceName) {
            this.showError('Please enter a race name');
            return;
        }
        
        try {
            // Show loading state
            loadBtn.disabled = true;
            loadingStatus.classList.remove('hidden');
            errorMessage.classList.add('hidden');
            this.hideAllSections();
            
            // Call load-race API
            const response = await fetch(`/api/load-race?race_name=${encodeURIComponent(raceName)}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            // Store session info
            this.currentSession = {
                key: result.session_key,
                name: raceName
            };
            
            // Load timeline data
            await this.loadTimeline();
            
            // Show race info and controls
            this.showRaceInfo(result);
            this.showRaceControls();
            
            loadingStatus.classList.add('hidden');
            
        } catch (error) {
            console.error('Error loading race:', error);
            this.showError(`Failed to load race: ${error.message}`);
            loadingStatus.classList.add('hidden');
        } finally {
            loadBtn.disabled = false;
        }
    }
    
    async loadTimeline() {
        if (!this.currentSession) return;
        
        try {
            const response = await fetch(`/api/replay/${this.currentSession.key}/timeline`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.currentTimeline = await response.json();
            
            // Calculate timestamp range from timeline entries
            if (this.currentTimeline.entries && this.currentTimeline.entries.length > 0) {
                // Find min and max timestamps from position data in the database
                const firstEntry = this.currentTimeline.entries[0];
                const lastEntry = this.currentTimeline.entries[this.currentTimeline.entries.length - 1];
                
                // For now, use a reasonable timestamp range based on race duration
                // We'll get actual timestamps when we query the state API
                this.minTimestamp = 0;
                this.maxTimestamp = this.currentTimeline.entries.length * 60; // Rough estimate
                this.currentTimestamp = this.minTimestamp;
                
                // Try to get actual timestamp range from a state query
                await this.getTimestampRange();
            }
            
        } catch (error) {
            console.error('Error loading timeline:', error);
            throw error;
        }
    }
    
    async getTimestampRange() {
        try {
            // Try different race-specific timestamp ranges based on session key
            if (this.currentSession.key === '7953') { // Bahrain 2023
                this.minTimestamp = 1678024866.787;
                this.maxTimestamp = 1678034180.243;
            } else if (this.currentSession.key === '9094') { // Monaco 2023
                this.minTimestamp = 1685275266.82;
                this.maxTimestamp = 1685285565.231;
            } else if (this.currentSession.key === '9173') { // Japan 2023
                this.minTimestamp = 1696220790;
                this.maxTimestamp = 1696230790; // Estimated
            } else {
                // Generic range - try to get first valid state
                this.minTimestamp = Date.now() / 1000 - 7200; // 2 hours ago as fallback
                this.maxTimestamp = Date.now() / 1000;
            }
            
            this.currentTimestamp = this.minTimestamp;
            
            // Verify we can get data at the start timestamp
            const testResponse = await fetch(`/api/replay/${this.currentSession.key}/state?t=${this.minTimestamp}`);
            if (!testResponse.ok) {
                console.warn('Could not fetch initial state, adjusting timestamp range');
                // Try with a slightly later timestamp
                this.minTimestamp += 60;
                this.currentTimestamp = this.minTimestamp;
            }
            
        } catch (error) {
            console.warn('Could not determine timestamp range, using defaults');
        }
    }
    
    showRaceInfo(raceData) {
        const raceInfo = document.getElementById('raceInfo');
        
        document.getElementById('raceName').textContent = this.currentSession.name;
        document.getElementById('sessionKey').textContent = this.currentSession.key;
        document.getElementById('totalLaps').textContent = this.currentTimeline?.total_laps || 'Loading...';
        document.getElementById('timelineEntries').textContent = this.currentTimeline?.entries?.length || 'Loading...';
        
        raceInfo.classList.remove('hidden');
    }
    
    showRaceControls() {
        const raceControls = document.getElementById('raceControls');
        const timeSlider = document.getElementById('timeSlider');
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        
        // Enable controls
        timeSlider.disabled = false;
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        // Setup slider
        timeSlider.min = 0;
        timeSlider.max = 100;
        timeSlider.value = 0;
        
        // Update time display
        this.updateTimeDisplay();
        
        raceControls.classList.remove('hidden');
        
        // Show visualization sections
        document.getElementById('raceVisualization').classList.remove('hidden');
        document.getElementById('raceData').classList.remove('hidden');
        
        // Initial race state update
        this.updateRaceState();
    }
    
    updateTimeDisplay() {
        const currentTime = document.getElementById('currentTime');
        const totalTime = document.getElementById('totalTime');
        
        const currentSeconds = Math.floor((this.currentTimestamp - this.minTimestamp));
        const totalSeconds = Math.floor((this.maxTimestamp - this.minTimestamp));
        
        currentTime.textContent = this.formatTime(currentSeconds);
        totalTime.textContent = this.formatTime(totalSeconds);
    }
    
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    async updateRaceState() {
        if (!this.currentSession) return;
        
        try {
            console.log(`Fetching state for timestamp: ${this.currentTimestamp}`);
            const response = await fetch(`/api/replay/${this.currentSession.key}/state?t=${this.currentTimestamp}`);
            
            if (!response.ok) {
                console.warn(`API returned ${response.status}: ${response.statusText}`);
                this.drawRaceVisualization({ cars: [] }); // Show empty state
                return;
            }
            
            const state = await response.json();
            console.log(`Received state with ${state.cars ? state.cars.length : 0} cars`);
            
            // Update visualization
            this.drawRaceVisualization(state);
            
            // Update race data display
            this.updateRaceDataDisplay(state);
            
            // Update time display
            this.updateTimeDisplay();
            
        } catch (error) {
            console.error('Error updating race state:', error);
            this.drawRaceVisualization({ cars: [] }); // Show empty state on error
        }
    }
    
    drawRaceVisualization(state) {
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!state.cars || state.cars.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No race data available at this timestamp', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Draw track background
        this.drawTrackBackground(ctx, canvas);
        
        // Sort cars by position for better visualization
        const sortedCars = [...state.cars].sort((a, b) => a.x - b.x);
        
        // Draw cars
        sortedCars.forEach((car, index) => {
            this.drawCar(ctx, car, index, canvas);
        });
        
        // Update position list
        this.updatePositionList(sortedCars);
    }
    
    drawTrackBackground(ctx, canvas) {
        // Draw a simple horizontal track representation
        const trackY = canvas.height / 2;
        const trackHeight = 60;
        
        // Track background
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(50, trackY - trackHeight/2, canvas.width - 100, trackHeight);
        
        // Track lines
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        
        // Center line
        ctx.beginPath();
        ctx.moveTo(50, trackY);
        ctx.lineTo(canvas.width - 50, trackY);
        ctx.stroke();
        
        // Track borders
        ctx.setLineDash([]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(50, trackY - trackHeight/2);
        ctx.lineTo(canvas.width - 50, trackY - trackHeight/2);
        ctx.moveTo(50, trackY + trackHeight/2);
        ctx.lineTo(canvas.width - 50, trackY + trackHeight/2);
        ctx.stroke();
        
        // Position markers
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        for (let i = 1; i <= 20; i++) {
            const x = 50 + ((canvas.width - 100) / 20) * (i - 1);
            ctx.fillText(i.toString(), x, trackY - trackHeight/2 - 10);
        }
        
        // Labels
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('P1 (Leader)', 70, trackY - trackHeight/2 - 30);
        ctx.fillText('P20 (Last)', canvas.width - 70, trackY - trackHeight/2 - 30);
    }
    
    drawCar(ctx, car, index, canvas) {
        // Calculate position on track based on race position
        const trackWidth = canvas.width - 100;
        const position = car.x; // This is the race position (1, 2, 3, etc.)
        const x = 50 + (trackWidth / 20) * (position - 1);
        // Use driver number for consistent vertical positioning
        const y = canvas.height / 2 + ((car.driver_number % 10) - 5) * 6; // Consistent vertical spread
        
        // Get driver color
        const color = this.driverColors[car.driver_number] || '#999999';
        
        // Draw car circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw car border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw driver number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(car.driver_number.toString(), x, y + 3);
        
        // Draw position indicator
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`P${Math.round(position)}`, x, y - 20);
    }
    
    updatePositionList(cars) {
        const positionList = document.getElementById('positionList');
        positionList.innerHTML = '';
        
        cars.slice(0, 10).forEach((car, index) => {
            const positionItem = document.createElement('div');
            positionItem.className = 'position-item';
            
            const dot = document.createElement('div');
            dot.className = 'position-dot';
            dot.style.backgroundColor = this.driverColors[car.driver_number] || '#999999';
            
            const text = document.createElement('span');
            text.textContent = `P${Math.round(car.x)} - #${car.driver_number}`;
            
            positionItem.appendChild(dot);
            positionItem.appendChild(text);
            positionList.appendChild(positionItem);
        });
    }
    
    updateRaceDataDisplay(state) {
        if (!state || !state.cars) {
            document.getElementById('dataTimestamp').textContent = 'No data';
            document.getElementById('dataCarsCount').textContent = '0';
            document.getElementById('driversGrid').innerHTML = '';
            return;
        }
        
        document.getElementById('dataTimestamp').textContent = 
            new Date(state.timestamp * 1000).toLocaleTimeString();
        document.getElementById('dataCarsCount').textContent = state.cars.length;
        
        // Update drivers grid
        const driversGrid = document.getElementById('driversGrid');
        driversGrid.innerHTML = '';
        
        const sortedCars = [...state.cars].sort((a, b) => a.x - b.x);
        
        sortedCars.forEach(car => {
            const driverCard = document.createElement('div');
            driverCard.className = 'driver-card';
            driverCard.style.borderLeftColor = this.driverColors[car.driver_number] || '#4CAF50';
            
            driverCard.innerHTML = `
                <div class="driver-number">#${car.driver_number}</div>
                <div class="driver-position">Position: ${Math.round(car.x)}</div>
            `;
            
            driversGrid.appendChild(driverCard);
        });
    }
    
    startPlayback() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        this.playbackInterval = setInterval(() => {
            const progress = (this.currentTimestamp - this.minTimestamp) / (this.maxTimestamp - this.minTimestamp);
            
            if (progress >= 1) {
                this.pausePlayback();
                return;
            }
            
            // Advance timestamp
            const timeStep = (this.maxTimestamp - this.minTimestamp) / 1000 * this.playbackSpeed;
            this.currentTimestamp = Math.min(this.currentTimestamp + timeStep, this.maxTimestamp);
            
            // Update slider
            const newProgress = (this.currentTimestamp - this.minTimestamp) / (this.maxTimestamp - this.minTimestamp);
            document.getElementById('timeSlider').value = newProgress * 100;
            
            // Update race state
            this.updateRaceState();
            
        }, 100); // Update every 100ms
    }
    
    pausePlayback() {
        this.isPlaying = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }
    
    resetPlayback() {
        this.pausePlayback();
        
        this.currentTimestamp = this.minTimestamp;
        document.getElementById('timeSlider').value = 0;
        
        this.updateRaceState();
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
    
    hideAllSections() {
        const sections = ['raceInfo', 'raceControls', 'raceVisualization', 'raceData'];
        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.f1Replayer = new F1RaceReplayer();
    console.log('F1 Historic Race Replayer initialized');
}); 