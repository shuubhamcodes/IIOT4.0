export interface Plant {
  id: string;
  name: string;
  location: string;
  created_at?: string;
  updated_at?: string;
}

export interface Asset {
  id: string;
  plant_id: string;
  name: string;
  model: string;
  serial_number: string;
  status: 'operational' | 'maintenance' | 'fault' | 'offline';
  installation_date: string;
  temperature_min: number;
  temperature_max: number;
  pressure_min: number;
  pressure_max: number;
  vibration_min: number;
  vibration_max: number;
  energy_min: number;
  energy_max: number;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceTicket {
  id: string;
  alert_id: string;
  description: string;
  assigned_to: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  alert?: {
    id: string;
    asset_id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    status: 'active' | 'acknowledged' | 'resolved';
    asset?: {
      name: string;
      plant?: {
        name: string;
      };
    };
  };
}

