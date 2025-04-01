import axios from 'axios';
import type { Machine, SensorReading } from './types';

// Simulated JWT token - replace with actual token in production
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IksxVkRqQ2RhQUZyTExtaEgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3JrZW90aHZ2dGR5ZnV3bXN3cnFiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkMDFhZTc3ZS0yYmZhLTRjYjUtYTk3YS1hMzU0MmY0MWZlOGUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQzNDcwODM1LCJpYXQiOjE3NDM0NjcyMzUsImVtYWlsIjoic2h1dWJoYW1zaGFybWE5OEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoic2h1dWJoYW1zaGFybWE5OEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJkMDFhZTc3ZS0yYmZhLTRjYjUtYTk3YS1hMzU0MmY0MWZlOGUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0MzQ2NzIzNX1dLCJzZXNzaW9uX2lkIjoiOWQzMGUwZWEtOTFhZi00MzExLTkxZDEtMDVjYjQzNmZlM2RiIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.y0WriQemmYoA5lGQKO4G0-EIX-OsAjbT6kb_pFsMUWk';

// Machine configurations
const machines: Machine[] = [
  {
    id: '3e549d5c-b963-439a-aff8-30f0f2124b88',
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
    id: 'ce7f05a2-4e63-4225-b420-d6ea3bff371b',
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
    id: '0c5aa235-ff7d-4a7e-99d3-743a0af56868',
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