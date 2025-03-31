import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface SensorReading {
  asset_id: string;
  temperature: number;
  pressure: number;
  vibration: number;
  energy_consumption: number;
  timestamp?: string;
}

interface Asset {
  id: string;
  temperature_min: number;
  temperature_max: number;
  pressure_min: number;
  pressure_max: number;
  vibration_min: number;
  vibration_max: number;
  energy_min: number;
  energy_max: number;
}

interface Alert {
  asset_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
}

// Validate input
function validateSensorData(data: SensorReading): string | null {
  if (!data.asset_id || typeof data.asset_id !== 'string') return 'Invalid asset_id';

  const requiredFields = ['temperature', 'pressure', 'vibration', 'energy_consumption'];
  for (const field of requiredFields) {
    const value = data[field as keyof SensorReading];
    if (typeof value !== 'number' || isNaN(value)) return `Invalid ${field}`;
  }

  if (data.temperature < -50 || data.temperature > 150) return 'Temperature out of bounds';
  if (data.pressure < 0) return 'Pressure must be >= 0';
  if (data.vibration < 0) return 'Vibration must be >= 0';
  if (data.energy_consumption < 0) return 'Energy must be >= 0';

  return null;
}

// Check thresholds and create alerts
async function checkThresholdsAndCreateAlerts(reading: SensorReading, asset: Asset) {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  const check = async (
    metric: keyof SensorReading,
    label: string,
    max: number,
    min: number
  ) => {
    const value = reading[metric];

if (typeof value === 'number') {
  if (value > max) {
    const exceedance = ((value - max) / max) * 100;
    alerts.push({
      asset_id: asset.id,
      type: `${label}_high`,
      severity: exceedance > 10 ? 'critical' : 'medium',
      message: `${label} ${value} exceeds max threshold ${max}`,
      status: 'active',
      created_at: now,
    });
  } else if (value < min) {
    const exceedance = ((min - value) / min) * 100;
    alerts.push({
      asset_id: asset.id,
      type: `${label}_low`,
      severity: exceedance > 10 ? 'critical' : 'medium',
      message: `${label} ${value} below min threshold ${min}`,
      status: 'active',
      created_at: now,
    });
  }
}


  check('temperature', 'temperature', asset.temperature_max, asset.temperature_min);
  check('pressure', 'pressure', asset.pressure_max, asset.pressure_min);
  check('vibration', 'vibration', asset.vibration_max, asset.vibration_min);
  check('energy_consumption', 'energy', asset.energy_max, asset.energy_min);

  if (alerts.length > 0) {
    const { error } = await supabase.from('alerts').insert(alerts);
    if (error) console.error('Failed to insert alerts:', error.message);
  }
}

// Ingestion route
app.post('/api/ingest-sensor', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const reading: SensorReading = req.body;
    const errorMsg = validateSensorData(reading);
    if (errorMsg) return res.status(400).json({ error: errorMsg });

    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', reading.asset_id)
      .single();

    if (assetError || !asset) return res.status(404).json({ error: 'Asset not found' });

    const { error: insertError } = await supabase
      .from('sensor_readings')
      .insert([{
        ...reading,
        timestamp: reading.timestamp || new Date().toISOString()
      }]);

    if (insertError) throw insertError;

    await checkThresholdsAndCreateAlerts(reading, asset);

    res.status(200).json({ message: 'Sensor reading stored and alerts evaluated' });
  } catch (err) {
    console.error('Ingestion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🌐 Server running at http://localhost:${port}`);
})
}
