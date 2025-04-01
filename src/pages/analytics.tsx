import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plant, Asset } from '../types/database';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Activity, Battery, AlertTriangle, Zap } from 'lucide-react';

interface AnalyticsData {
  date: string;
  uptime: number;
  energy_usage: number;
  alerts_count: number;
}

interface ErrorProneAsset {
  asset_id: string;
  name: string;
  error_count: number;
}

export default function Analytics() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [sevenDayData, setSevenDayData] = useState<AnalyticsData[]>([]);
  const [thirtyDayData, setThirtyDayData] = useState<AnalyticsData[]>([]);
  const [errorProneAssets, setErrorProneAssets] = useState<ErrorProneAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (selectedPlant) {
      fetchAnalyticsData(7);
      fetchAnalyticsData(30);
      fetchErrorProneAssets();
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

  async function fetchAnalyticsData(days: number) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get assets for the selected plant
      const { data: assets } = await supabase
        .from('assets')
        .select('id')
        .eq('plant_id', selectedPlant);

      if (!assets?.length) return;

      const assetIds = assets.map(a => a.id);

      // Fetch sensor readings
      const { data: readings } = await supabase
        .from('sensor_readings')
        .select('*')
        .in('asset_id', assetIds)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp');

      // Fetch alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select('*')
        .in('asset_id', assetIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Process data by day
      const dailyData: AnalyticsData[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayReadings = readings?.filter(r => 
          r.timestamp.startsWith(dateStr)
        ) || [];

        const dayAlerts = alerts?.filter(a =>
          a.created_at.startsWith(dateStr)
        ) || [];

        dailyData.unshift({
          date: dateStr,
          uptime: calculateUptime(dayReadings, assets.length),
          energy_usage: calculateAverageEnergy(dayReadings),
          alerts_count: dayAlerts.length
        });
      }

      if (days === 7) {
        setSevenDayData(dailyData);
      } else {
        setThirtyDayData(dailyData);
      }
    } catch (error) {
      console.error(`Error fetching ${days}-day analytics:`, error);
      setError(`Failed to fetch ${days}-day analytics`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchErrorProneAssets() {
    try {
      // Get assets for the selected plant
      const { data: assets } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          alerts (count)
        `)
        .eq('plant_id', selectedPlant);

      if (!assets) return;

      const errorProneAssets = assets
        .map(asset => ({
          asset_id: asset.id,
          name: asset.name,
          error_count: asset.alerts.length
        }))
        .sort((a, b) => b.error_count - a.error_count)
        .slice(0, 3);

      setErrorProneAssets(errorProneAssets);
    } catch (error) {
      console.error('Error fetching error-prone assets:', error);
    }
  }

  function calculateUptime(readings: any[], assetCount: number): number {
    if (!readings.length || !assetCount) return 0;
    // Simple uptime calculation: percentage of readings that are within normal ranges
    const totalReadings = readings.length;
    const normalReadings = readings.filter(r =>
      r.temperature >= -50 && r.temperature <= 150 &&
      r.pressure >= 0 && r.pressure <= 200 &&
      r.vibration >= 0 && r.vibration <= 5
    ).length;
    return (normalReadings / totalReadings) * 100;
  }

  function calculateAverageEnergy(readings: any[]): number {
    if (!readings.length) return 0;
    const total = readings.reduce((sum, r) => sum + (r.energy_consumption || 0), 0);
    return total / readings.length;
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <select
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
          <div className="text-gray-600">Loading analytics data...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Battery className="h-8 w-8 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Average Uptime</h3>
              </div>
              <p className="mt-2 text-3xl font-semibold text-gray-700">
                {sevenDayData.length > 0
                  ? `${(sevenDayData.reduce((sum, d) => sum + d.uptime, 0) / sevenDayData.length).toFixed(1)}%`
                  : '0%'}
              </p>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-yellow-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Energy Usage</h3>
              </div>
              <p className="mt-2 text-3xl font-semibold text-gray-700">
                {sevenDayData.length > 0
                  ? `${(sevenDayData.reduce((sum, d) => sum + d.energy_usage, 0) / sevenDayData.length).toFixed(1)} kWh`
                  : '0 kWh'}
              </p>
              <p className="text-sm text-gray-500">Average per day</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Total Alerts</h3>
              </div>
              <p className="mt-2 text-3xl font-semibold text-gray-700">
                {sevenDayData.reduce((sum, d) => sum + d.alerts_count, 0)}
              </p>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Error-Prone Machines</h3>
              <div className="space-y-2">
                {errorProneAssets.map((asset, index) => (
                  <div key={asset.asset_id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{asset.name}</span>
                    <span className="text-sm font-medium text-red-600">{asset.error_count} alerts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 7-Day Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">7-Day Uptime Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sevenDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="uptime"
                    stroke="#10B981"
                    name="Uptime %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">7-Day Energy Usage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sevenDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="energy_usage"
                    fill="#FBBF24"
                    name="Energy (kWh)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 30-Day Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Alert Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={thirtyDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="alerts_count"
                    stroke="#EF4444"
                    name="Alerts"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Energy Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={thirtyDayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="energy_usage"
                    stroke="#FBBF24"
                    name="Energy (kWh)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}