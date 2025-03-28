import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plant, Asset } from '../types/database';
import { PlusCircle, Edit2, Save, X } from 'lucide-react';

export default function Config() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const createDefaultAsset = (plantId: string): Asset => ({
    id: crypto.randomUUID(), // Generate a temporary ID for new assets
    plant_id: plantId,
    name: '',
    model: '',
    serial_number: '',
    status: 'operational',
    installation_date: new Date().toISOString().split('T')[0],
    temperature_min: -50,
    temperature_max: 150,
    pressure_min: 0,
    pressure_max: 200,
    vibration_min: 0,
    vibration_max: 5,
    energy_min: 0,
    energy_max: 1000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (selectedPlant) {
      fetchAssets(selectedPlant);
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
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  }

  async function fetchAssets(plantId: string) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('plant_id', plantId)
        .order('name');
      
      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  }

  function validateForm(asset: Asset): boolean {
    const errors: Record<string, string> = {};

    if (!asset.name?.trim()) {
      errors.name = 'Name is required';
    }
    if (!asset.model?.trim()) {
      errors.model = 'Model is required';
    }
    if (!asset.serial_number?.trim()) {
      errors.serial_number = 'Serial number is required';
    }
    if (!asset.installation_date) {
      errors.installation_date = 'Installation date is required';
    }

    // Validate ranges
    if (asset.temperature_min > asset.temperature_max) {
      errors.temperature = 'Minimum temperature cannot be greater than maximum';
    }
    if (asset.pressure_min > asset.pressure_max) {
      errors.pressure = 'Minimum pressure cannot be greater than maximum';
    }
    if (asset.vibration_min > asset.vibration_max) {
      errors.vibration = 'Minimum vibration cannot be greater than maximum';
    }
    if (asset.energy_min > asset.energy_max) {
      errors.energy = 'Minimum energy cannot be greater than maximum';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(asset: Asset) {
    if (!validateForm(asset)) {
      return;
    }

    try {
      const { id, created_at, updated_at, ...assetData } = asset;
      
      let error;
      if (assets.find(a => a.id === asset.id)) {
        // Update existing asset
        ({ error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', asset.id));
      } else {
        // Create new asset - remove the temporary ID
        ({ error } = await supabase
          .from('assets')
          .insert([assetData]));
      }

      if (error) throw error;

      setIsModalOpen(false);
      setEditingAsset(null);
      fetchAssets(selectedPlant);
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Plant Configuration</h1>

      {/* Plant Selection */}
      <div className="mb-8">
        <label htmlFor="plant" className="block text-sm font-medium text-gray-700">
          Select Plant
        </label>
        <select
          id="plant"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={selectedPlant}
          onChange={(e) => setSelectedPlant(e.target.value)}
        >
          <option value="">Select a plant...</option>
          {plants.map((plant) => (
            <option key={plant.id} value={plant.id}>
              {plant.name} - {plant.location}
            </option>
          ))}
        </select>
      </div>

      {/* Assets List */}
      {selectedPlant && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Machines</h3>
            <button
              onClick={() => {
                setEditingAsset(createDefaultAsset(selectedPlant));
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Machine
            </button>
          </div>

          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {assets.map((asset) => (
                <li key={asset.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{asset.name}</h4>
                      <p className="text-sm text-gray-500">
                        Model: {asset.model} | S/N: {asset.serial_number}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAsset(asset);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && editingAsset && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {assets.find(a => a.id === editingAsset.id) ? 'Edit Machine' : 'Add Machine'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-4 py-5 sm:px-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editingAsset.name}
                    onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Model</label>
                  <input
                    type="text"
                    value={editingAsset.model}
                    onChange={(e) => setEditingAsset({ ...editingAsset, model: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {formErrors.model && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.model}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <input
                    type="text"
                    value={editingAsset.serial_number}
                    onChange={(e) => setEditingAsset({ ...editingAsset, serial_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {formErrors.serial_number && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.serial_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Installation Date</label>
                  <input
                    type="date"
                    value={editingAsset.installation_date}
                    onChange={(e) => setEditingAsset({ ...editingAsset, installation_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {formErrors.installation_date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.installation_date}</p>
                  )}
                </div>
              </div>

              {/* Ranges */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Temperature Range (°C)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500">Minimum</label>
                      <input
                        type="number"
                        value={editingAsset.temperature_min}
                        onChange={(e) => setEditingAsset({ ...editingAsset, temperature_min: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Maximum</label>
                      <input
                        type="number"
                        value={editingAsset.temperature_max}
                        onChange={(e) => setEditingAsset({ ...editingAsset, temperature_max: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  {formErrors.temperature && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.temperature}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Pressure Range (PSI)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500">Minimum</label>
                      <input
                        type="number"
                        value={editingAsset.pressure_min}
                        onChange={(e) => setEditingAsset({ ...editingAsset, pressure_min: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Maximum</label>
                      <input
                        type="number"
                        value={editingAsset.pressure_max}
                        onChange={(e) => setEditingAsset({ ...editingAsset, pressure_max: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  {formErrors.pressure && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.pressure}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Vibration Range (mm/s)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500">Minimum</label>
                      <input
                        type="number"
                        value={editingAsset.vibration_min}
                        onChange={(e) => setEditingAsset({ ...editingAsset, vibration_min: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Maximum</label>
                      <input
                        type="number"
                        value={editingAsset.vibration_max}
                        onChange={(e) => setEditingAsset({ ...editingAsset, vibration_max: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  {formErrors.vibration && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.vibration}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Energy Consumption Range (kWh)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500">Minimum</label>
                      <input
                        type="number"
                        value={editingAsset.energy_min}
                        onChange={(e) => setEditingAsset({ ...editingAsset, energy_min: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Maximum</label>
                      <input
                        type="number"
                        value={editingAsset.energy_max}
                        onChange={(e) => setEditingAsset({ ...editingAsset, energy_max: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  {formErrors.energy && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.energy}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(editingAsset)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}