const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(express.json());
app.use(cors());

// Validate sensor reading data
function validateSensorData(data) {
  if (!data.asset_id || typeof data.asset_id !== 'string') {
    return 'Invalid asset_id';
  }

  const numericFields = ['temperature', 'pressure', 'vibration', 'energy_consumption'];
  for (const field of numericFields) {
    const value = data[field];
    if (typeof value !== 'number' || isNaN(value)) {
      return `Invalid ${field}`;
    }
  }

  // Validate ranges based on database constraints
  if (data.temperature < -50 || data.temperature > 150) {
    return 'Temperature must be between -50 and 150';
  }
  if (data.pressure < 0) {
    return 'Pressure must be non-negative';
  }
  if (data.vibration < 0) {
    return 'Vibration must be non-negative';
  }
  if (data.energy_consumption < 0) {
    return 'Energy consumption must be non-negative';
  }

  return null;
}

// Sensor data ingestion route
app.post('/api/ingest-sensor', async (req, res) => {
  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    // const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    // if (authError || !user) {
    //   return res.status(401).json({ error: 'Invalid token' });
    // }

    // Validate request body
    const sensorData = req.body;
    const validationError = validateSensorData(sensorData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Store sensor reading in database
    const { error: insertError } = await supabaseClient
      .from('sensor_readings')
      .insert({
        asset_id: sensorData.asset_id,
        temperature: sensorData.temperature,
        pressure: sensorData.pressure,
        vibration: sensorData.vibration,
        energy_consumption: sensorData.energy_consumption,
        timestamp: sensorData.timestamp || new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting sensor data:', insertError);
      return res.status(500).json({ error: 'Failed to store sensor reading' });
    }

    res.status(200).json({ message: 'Sensor reading stored successfully' });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});