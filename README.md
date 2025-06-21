# 🏎️ F1 Historic Race Replayer

A modern web application that allows users to watch and interact with historical Formula 1 races in real-time. Load any F1 race by name, then play, pause, and scrub through the race timeline to see how driver positions and race dynamics evolved throughout the event.

## ✨ Features

- **🎮 Interactive Race Playback**: Play, pause, and scrub through historical F1 races
- **📊 Real-time Telemetry**: View driver positions, speeds, gear, throttle, and brake data
- **🎯 Visual Race Track**: Canvas-based visualization showing driver positions and standings
- **⚡ Fast Data Access**: Fetches authentic race data from the OpenF1 API
- **🎨 Modern UI**: Built with Next.js and Tailwind CSS for a beautiful, responsive interface
- **☁️ Cloud Deployment**: Optimized for Netlify deployment with serverless functions

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

## 🚀 Deployment

### Netlify Deployment

1. **Build the project**
   ```bash
   cd frontend && npm run build
   ```

2. **Deploy to Netlify**
   - Connect your repository to Netlify
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/out`
   - The `netlify.toml` file is already configured

3. **Environment Setup**
   - No environment variables needed for basic functionality
   - The OpenF1 API is public and doesn't require authentication

### Manual Deployment

1. **Build for production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the `frontend/out` directory** to any static hosting provider

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

### Netlify Functions (Production)
- `POST /.netlify/functions/api/load-race?race_name=<name>`
- `GET /.netlify/functions/api/replay/{session_key}/state?t=<timestamp>`
- `GET /.netlify/functions/api/replay/{session_key}/timeline`

## 🐛 Troubleshooting

### Common Issues

1. **Race not loading**
   - Check the race name format: "Country GP Year"
   - Ensure the race exists in the OpenF1 database
   - Check browser console for API errors

2. **Blank visualization**
   - Wait for race data to fully load
   - Try refreshing the page
   - Check if browser supports Canvas API

3. **Slow performance**
   - Large race datasets may take time to load
   - Try reducing playback speed
   - Check network connection

### Development Issues

1. **Port conflicts**
   - Backend runs on port 3001
   - Frontend runs on port 3000
   - Change ports in package.json if needed

2. **Dependencies**
   - Run `npm run install-all` to install all dependencies
   - Clear node_modules and reinstall if issues persist

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚡ Performance Notes

- Race data is fetched from OpenF1 API and cached in memory
- Large datasets (full race sessions) may take 30-60 seconds to load initially
- Subsequent interactions are fast due to local caching
- For production, consider implementing additional caching strategies

## 🙏 Acknowledgments

- [OpenF1 API](https://openf1.org/) for providing authentic F1 telemetry data
- Formula 1 for the amazing sport that makes this possible
- The open-source community for the tools and libraries used

---

**Note**: This is an unofficial project and is not affiliated with Formula 1, FIA, or any F1 teams. 