import axios from 'axios';
import type { Machine, SensorReading } from './types';

// Simulated JWT token - replace with actual token in production
const JWT_TOKEN = 'your-jwt-token';

// Machine configurations
const machines: Machine[] = [
  {
    id: 'machine-001',
    name: 'Hydraulic Press',
    minTemp: 20,
    maxTemp: 85,
    minPressure: 50,
    maxPressure: 200,
    minVibration: 0.1,
    maxVibration: 2.0,
    minEnergy: 250,
    maxEnergy: 800
  },
  {
    id: 'machine-002',
    name: 'CNC Mill',
    minTemp: 18,
    maxTemp: 95,
    minPressure: 30,
    maxPressure: 150,
    minVibration: 0.2,
    maxVibration: 3.0,
    minEnergy: 300,
    maxEnergy: 1000
  },
  {
    id: 'machine-003',
    name: 'Industrial Furnace',
    minTemp: 100,
    maxTemp: 140,
    minPressure: 10,
    maxPressure: 80,
    minVibration: 0.05,
    maxVibration: 1.0,
    minEnergy: 500,
    maxEnergy: 1500
  }
];

// Generate random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Generate sensor reading for a machine
function generateReading(machine: Machine): SensorReading {
  return {
    asset_id: machine.id,
    temperature: randomBetween(machine.minTemp, machine.maxTemp),
    pressure: randomBetween(machine.minPressure, machine.maxPressure),
    vibration: randomBetween(machine.minVibration, machine.maxVibration),
    energy_consumption: randomBetween(machine.minEnergy, machine.maxEnergy)
  };
}

// Send sensor reading to API
async function sendReading(reading: SensorReading): Promise<void> {
  try {
    await axios.post('http://localhost:3000/api/ingest-sensor', reading, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Sent reading for ${reading.asset_id}:`, reading);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Error sending reading for ${reading.asset_id}:`, error.response?.data || error.message);
    } else {
      console.error(`❌ Error sending reading for ${reading.asset_id}:`, error);
    }
  }
}

// Main simulation loop
function startSimulation(): void {
  console.log('🔄 Starting sensor data simulation...');
  console.log('📡 Monitoring machines:', machines.map(m => m.name).join(', '));

  setInterval(() => {
    machines.forEach(machine => {
      const reading = generateReading(machine);
      sendReading(reading);
    });
  }, 5000);
}

// Start the simulation
startSimulation();