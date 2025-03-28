import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface SensorReading {
  asset_id: string;
  temperature: number;
  pressure: number;
  vibration: number;
  energy_consumption: number;
  timestamp?: string;
}

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Validate sensor reading data
function validateSensorData(data: SensorReading): string | null {
  if (!data.asset_id || typeof data.asset_id !== 'string') {
    return 'Invalid asset_id';
  }

  const numericFields = ['temperature', 'pressure', 'vibration', 'energy_consumption'];
  for (const field of numericFields) {
    const value = data[field as keyof SensorReading];
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get and validate request body
    const sensorData: SensorReading = await req.json();
    const validationError = validateSensorData(sensorData);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
      return new Response(
        JSON.stringify({ error: 'Failed to store sensor reading' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Sensor reading stored successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});