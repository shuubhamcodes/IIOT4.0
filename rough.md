import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plant } from '../types/database';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('name');

    if (error) {
      setError('Failed to fetch plants');
      return;
    }

    setPlants(data || []);
    if (data?.[0]) {
      setSelectedPlant(data[0].id);
    }
  }

  async function fetchAnalyticsData(days: number) {
    const endDate = new Date();
    const startDate =
