import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plant } from '../types/database';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';

interface SensorReading {
  asset_id: string;
  temperature: number;
  pressure: number;
  vibration: number;
  energy_consumption: number;
  timestamp: string;
}

interface AssetStatus {
  asset_id: string;
  name: string;
  uptime: number;
}

interface ChartData {
  timestamp: string;
  temperature: number;
  pressure: number;
  vibration: number;
  energy_consumption: number;
}

export default function Dashboard() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [sensorData, setSensorData] = useState<ChartData[]>([]);
  const [assetStatuses, setAssetStatuses] = useState<AssetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (selectedPlant) {
      fetchSensorData();
      fetchAssetStatuses();
    }
  }, [selectedPlant]);

  async function fetchPlants() {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setPlants(data || []);
      if (data?.[0]) {
        setSelectedPlant(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
      setError('Failed to fetch plants');
    }
  }

  async function fetchSensorData() {
    try {
      setLoading(true);
      // Get assets for the selected plant
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('id')
        .eq('plant_id', selectedPlant);

      if (assetsError) throw assetsError;
      
      if (!assets?.length) {
        setSensorData([]);
        return;
      }

      const assetIds = assets.map(a => a.id);

      // Get latest sensor readings for these assets
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .in('asset_id', assetIds)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Process data for charts
      const chartData = (data || []).map(reading => ({
        timestamp: new Date(reading.timestamp).toLocaleTimeString(),
        temperature: reading.temperature,
        pressure: reading.pressure,
        vibration: reading.vibration,
        energy_consumption: reading.energy_consumption
      })).reverse();

      setSensorData(chartData);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      setError('Failed to fetch sensor data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAssetStatuses() {
    try {
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, status')
        .eq('plant_id', selectedPlant);

      if (assetsError) throw assetsError;

      // Calculate mock uptime percentages (in a real app, this would come from actual monitoring data)
      const statuses = assets?.map(asset => ({
        asset_id: asset.id,
        name: asset.name,
        uptime: asset.status === 'operational' ? 98.5 : 85.2
      })) || [];

      setAssetStatuses(statuses);
    } catch (error) {
      console.error('Error fetching asset statuses:', error);
      setError('Failed to fetch asset statuses');
    }
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plant Dashboard</h1>
        
        <div className="mt-4">
          <label htmlFor="plant" className="block text-sm font-medium text-gray-700">
            Select Plant
          </label>
          <select
            id="plant"
            className="mt-1 block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
          >
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name} - {plant.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading data...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Temperature and Pressure Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Temperature Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sensorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#8884d8"
                    name="Temperature (°C)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pressure Readings</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sensorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="pressure"
                    fill="#82ca9d"
                    name="Pressure (PSI)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vibration and Energy Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vibration Levels</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sensorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="vibration"
                    stroke="#ff7300"
                    name="Vibration (mm/s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Energy Consumption</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sensorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="energy_consumption"
                    fill="#8884d8"
                    name="Energy (kWh)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Asset Uptime Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Uptime</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetStatuses}
                    dataKey="uptime"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {assetStatuses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                {assetStatuses.map((asset, index) => (
                  <div key={asset.asset_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-600">{asset.name}</span>
                    </div>
                    <span className="font-medium">{asset.uptime.toFixed(1)}% Uptime</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}