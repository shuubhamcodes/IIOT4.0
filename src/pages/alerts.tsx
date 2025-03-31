import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plant } from '../types/database';
import { AlertTriangle, CheckCircle2, Bell, Filter } from 'lucide-react';

interface Alert {
  id: string;
  asset_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  asset: {
    name: string;
    plant: {
      name: string;
    };
  };
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    fetchPlants();
    fetchAlerts();
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [selectedPlant, selectedSeverity, selectedStatus]);

  async function fetchPlants() {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setPlants(data || []);
    } catch (error) {
      console.error('Error fetching plants:', error);
      setError('Failed to fetch plants');
    }
  }

  async function fetchAlerts() {
    try {
      setLoading(true);
      let query = supabase
        .from('alerts')
        .select(`
          *,
          asset:assets (
            name,
            plant:plants (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedPlant) {
        query = query.eq('assets.plant_id', selectedPlant);
      }
      if (selectedSeverity) {
        query = query.eq('severity', selectedSeverity);
      }
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(alertId: string) {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'acknowledged' })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  async function handleResolve(alertId: string) {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: supabase.auth.getUser().then(({ data }) => data.user?.id)
        })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Bell className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
          >
            <option value="">All Plants</option>
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading alerts...</div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No alerts found</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <li key={alert.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {alert.asset.name} - {alert.asset.plant.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </p>
                        <p className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {alert.message}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Created: {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {alert.status === 'active' && (
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-500"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}