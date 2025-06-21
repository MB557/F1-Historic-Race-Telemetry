import React, { useEffect, useRef, useCallback } from 'react'

interface CarState {
  driver_number: number
  x: number
  y: number
  speed: number
  gear?: number
  throttle?: number
  brake?: boolean
  timestamp: number
}

interface ReplayState {
  timestamp: number
  cars: CarState[]
}

interface RaceVisualizationProps {
  state: ReplayState
}

export function RaceVisualization({ state }: RaceVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Driver colors (F1 team colors approximation)
  const driverColors: Record<number, string> = {
    1: '#0090FF', 44: '#0090FF', // Mercedes
    11: '#FF8700', 4: '#FF8700', // McLaren
    16: '#FF0000', 55: '#FF0000', // Ferrari
    33: '#0600EF', 10: '#0600EF', // Red Bull
    14: '#358C75', 18: '#358C75', // Aston Martin
    31: '#900000', 20: '#900000', // Haas
    22: '#005AFF', 23: '#005AFF', // AlphaTauri
    24: '#FF0000', 77: '#FF0000', // Alfa Romeo
    63: '#FF0000', 5: '#FF0000', // Williams
    3: '#FF8700', 27: '#FF8700', // Alpine
  }

  const drawRaceVisualization = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw track background
    drawTrackBackground(ctx, canvas)

    // Draw cars
    state.cars.forEach((car, index) => drawCar(ctx, car, index, canvas))
  }, [state])

  const drawTrackBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const { width, height } = canvas

    // Draw track outline
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(50, 50, width - 100, height - 100, 20)
    ctx.stroke()

    // Draw start/finish line
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 4
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(50, height / 2 - 50)
    ctx.lineTo(50, height / 2 + 50)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw position markers
    ctx.fillStyle = '#666666'
    ctx.font = '12px Arial'
    for (let i = 1; i <= 20; i++) {
      const y = 80 + (i - 1) * ((height - 160) / 19)
      ctx.fillText(`P${i}`, 20, y + 5)
    }
  }

  const drawCar = (
    ctx: CanvasRenderingContext2D,
    car: CarState,
    index: number,
    canvas: HTMLCanvasElement
  ) => {
    const { width, height } = canvas

    // Calculate position based on race position (x field represents position)
    const position = car.x || (index + 1)
    const y = 80 + (position - 1) * ((height - 160) / 19)
    const x = 80 + (index * 30) % (width - 200) // Spread cars horizontally for visibility

    // Get driver color
    const color = driverColors[car.driver_number] || '#999999'

    // Draw car body
    ctx.fillStyle = color
    ctx.fillRect(x - 15, y - 8, 30, 16)

    // Draw car outline
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(x - 15, y - 8, 30, 16)

    // Draw driver number
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(car.driver_number.toString(), x, y + 4)

    // Draw speed indicator
    if (car.speed > 0) {
      const speedBarHeight = Math.max(4, (car.speed / 350) * 40) // Normalize to max speed, minimum 4px
      // Color based on speed - red (slow) to green (fast)
      const speedRatio = Math.min(car.speed / 300, 1) // Normalize to 0-1
      const red = Math.floor(255 * (1 - speedRatio))
      const green = Math.floor(255 * speedRatio)
      ctx.fillStyle = `rgb(${red}, ${green}, 0)`
      ctx.fillRect(x + 20, y - speedBarHeight / 2, 4, speedBarHeight)
    }
  }

  // Update visualization when state changes
  useEffect(() => {
    drawRaceVisualization()
  }, [state, drawRaceVisualization])

  // Sort cars by position for the position list
  const sortedCars = [...state.cars].sort((a, b) => (a.x || 0) - (b.x || 0))

  return (
    <section className="bg-white rounded-xl p-6 mb-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Race Positions</h3>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas Visualization */}
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-gray-300 rounded-lg w-full max-w-full h-auto"
            style={{ maxHeight: '600px' }}
          />
          <p className="text-sm text-gray-800 mt-2 text-center">
            🏁 Track positions showing driver race standings
          </p>
        </div>

        {/* Position List */}
        <div className="lg:w-80">
          <h4 className="font-semibold mb-3 text-gray-900">Current Positions</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedCars.map((car, index) => (
              <div
                key={car.driver_number}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: driverColors[car.driver_number] || '#999999' }}
                />
                <span className="font-mono text-sm font-semibold">
                  P{index + 1}
                </span>
                <span className="font-semibold">#{car.driver_number}</span>
                <div className="ml-auto text-sm text-gray-800 font-medium">
                  {Math.round(car.speed || 0)} km/h
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 