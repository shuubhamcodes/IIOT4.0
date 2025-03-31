import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MaintenanceTicket } from '../types/database';
import { Wrench, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface Alert {
  id: string;
  asset_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  asset: {
    name: string;
    plant: {
      name: string;
    };
  };
}

interface User {
  id: string;
  email: string;
}

export default function Maintenance() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [selectedAlert, setSelectedAlert] = useState<string>('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTickets();
    fetchAlerts();
    fetchUsers();
  }, []);

  async function fetchTickets() {
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select(`
          *,
          alert:alerts (
            *,
            asset:assets (
              name,
              plant:plants (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to fetch maintenance tickets');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAlerts() {
    try {
      const { data, error } = await supabase
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
        .in('status', ['active', 'acknowledged'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to fetch alerts');
    }
  }

  async function fetchUsers() {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'engineer']);

      if (rolesError) throw rolesError;

      const userIds = roles.map(role => role.user_id);
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      if (usersError) throw usersError;
      setUsers(users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!selectedAlert) {
      errors.alert = 'Please select an alert';
    }
    if (!description.trim()) {
      errors.description = 'Description is required';
    }
    if (!assignedTo) {
      errors.assignedTo = 'Please assign the ticket to a user';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .insert({
          alert_id: selectedAlert,
          description,
          assigned_to: assignedTo,
          status: 'open',
        });

      if (error) throw error;

      // Reset form
      setSelectedAlert('');
      setDescription('');
      setAssignedTo('');
      setIsModalOpen(false);

      // Refresh tickets
      fetchTickets();
    } catch (error) {
      console.error('Error creating maintenance ticket:', error);
      setError('Failed to create maintenance ticket');
    }
  }

  async function handleStatusUpdate(ticketId: string, newStatus: MaintenanceTicket['status']) {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  }

  const getStatusIcon = (status: MaintenanceTicket['status']) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusColor = (status: MaintenanceTicket['status']) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Wrench className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Create Ticket
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading tickets...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No maintenance tickets found</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {ticket.alert?.asset?.name} - {ticket.alert?.asset?.plant?.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Alert: {ticket.alert?.message}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Created: {new Date(ticket.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {ticket.status !== 'resolved' && (
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleStatusUpdate(
                          ticket.id,
                          ticket.status === 'open' ? 'in_progress' : 'resolved'
                        )}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                      >
                        {ticket.status === 'open' ? (
                          <>
                            Start Work
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Mark Resolved
                            <CheckCircle className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="px-4 py-5 sm:px-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Create Maintenance Ticket</h3>
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-5 sm:px-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Alert</label>
                <select
                  value={selectedAlert}
                  onChange={(e) => setSelectedAlert(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select an alert...</option>
                  {alerts.map((alert) => (
                    <option key={alert.id} value={alert.id}>
                      {alert.asset.name} - {alert.message}
                    </option>
                  ))}
                </select>
                {formErrors.alert && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.alert}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
                {formErrors.assignedTo && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.assignedTo}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}