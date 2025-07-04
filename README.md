# 🏎️ F1 Historic Race Replayer

A modern web application that allows users to watch and interact with historical Formula 1 races in real-time. Load any F1 race by name, then play, pause, and scrub through the race timeline to see how driver positions and race dynamics evolved throughout the event.

## 🚀 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Canvas API** - For race visualization graphics

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework (for local development)
- **Netlify Functions** - Serverless backend for production
- **Axios** - HTTP client for API requests

### Data
- **OpenF1 API** - Authentic F1 telemetry and race data
- **Local Storage** - Client-side data persistence (replaces SQLite)

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd F1-copy
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install
   cd ..
   ```

3. **Start development servers**
   ```bash
   # Start both backend and frontend
   npm run dev
   
   # Or start them separately:
   # Backend (port 3001)
   npm run server
   
   # Frontend (port 3000)
   npm run frontend
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

## 🎯 Usage

### Loading a Race
1. Enter a race name in the format: `"Country GP Year"` (e.g., "Bahrain GP 2023", "Monaco 2023", "Japan GP 2023")
2. Click "Load Race" to fetch the data from OpenF1 API
3. Wait for the race data to load (this may take a few moments)

### Race Controls
- **▶️ Play**: Start the race replay
- **⏸️ Pause**: Pause the replay
- **🔄 Reset**: Reset to the beginning
- **Speed Control**: Adjust playback speed (0.5x to 10x)
- **Timeline Slider**: Scrub to any point in the race

### Race Visualization
- **Track View**: Visual representation of driver positions
- **Position List**: Real-time standings with driver numbers and speeds
- **Telemetry Data**: Detailed view of each driver's speed, gear, throttle, and brake status

## 🎮 Available Scripts

```bash
# Development
npm run dev          # Start both backend and frontend
npm run server       # Start Node.js backend only
npm run frontend     # Start Next.js frontend only

# Production
npm run build        # Build frontend for production
npm start           # Start production server

# Installation
npm run install-all  # Install all dependencies
```

## 🏁 Supported Races

The app works with any F1 race from recent years. Some examples:
- `Bahrain GP 2023`
- `Monaco 2023`
- `Japan GP 2023`
- `Brazil 2023`
- `Abu Dhabi GP 2023`

## 🔧 API Endpoints

### Backend API (Development)
- `GET /api` - API health check
- `POST /api/load-race?race_name=<name>` - Load race data
- `GET /api/replay/{session_key}/state?t=<timestamp>` - Get race state at timestamp
- `GET /api/replay/{session_key}/timeline` - Get race timeline

## 🐛 Troubleshooting

### Common Issues

1. **Race not loading**
   - Check the race name format: "Country GP Year"
   - Ensure the race exists in the OpenF1 database
   - Check browser console for API errors

### Development Issues

1. **Port conflicts**
   - Backend runs on port 3001
   - Frontend runs on port 3000
   - Change ports in package.json if needed

2. **Dependencies**
   - Run `npm run install-all` to install all dependencies
   - Clear node_modules and reinstall if issues persist

---
