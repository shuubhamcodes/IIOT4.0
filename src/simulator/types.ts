export interface Machine {
  id: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  minPressure: number;
  maxPressure: number;
  minVibration: number;
  maxVibration: number;
  minEnergy: number;
  maxEnergy: number;
}

export interface SensorReading {
  asset_id: string;
  temperature: number;
  pressure: number;
  vibration: number;
  energy_consumption: number;
}