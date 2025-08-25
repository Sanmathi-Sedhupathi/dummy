import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Plus, Filter, Download, Calendar, MapPin, User, DollarSign, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import CreateOrderModal from './CreateOrderModal';

interface Order {
  id: number;
  service_type: string;
  location_details: string;
  preferred_date: string;
  preferred_time: string;
  special_requirements: string;
  voiceover_script: string;
  background_music_licensed: boolean;
  branding_overlay: boolean;
  multiple_revisions: boolean;
  num_floors: number;
  area_sqft: number;
  base_cost: number;
  floor_cost: number;
  addon_cost: number;
  final_cost: number;
  pilot_earnings: number;
  editor_earnings: number;
  referral_earnings: number;
  hmx_earnings: number;
  gateway_fees: number;
  status: string;
  payment_status: string;
  created_at: string;
  client_name: string;
  business_name: string;
  client_email: string;
  client_phone: string;
  pilot_name: string;
  pilot_email: string;
  editor_name: string;
  editor_email: string;
  referral_name: string;
  referral_email: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch orders');
      setOrders([]);
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toString().includes(term) ||
        order.client_name.toLowerCase().includes(term) ||
        order.business_name.toLowerCase().includes(term) ||
        order.service_type.toLowerCase().includes(term) ||
        order.location_details.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const handleExportCSV = () => {
    const headers = [
      'Order ID', 'Client Name', 'Business Name', 'Service Type', 'Location', 
      'Area (sq ft)', 'Floors', 'Base Cost', 'Final Cost', 'Status', 'Payment Status',
      'Pilot', 'Editor', 'Referral', 'Created Date'
    ];
    
    const csvData = filteredOrders.map(order => [
      `HMX${order.id.toString().padStart(4, '0')}`,
      order.client_name,
      order.business_name,
      order.service_type,
      order.location_details,
      order.area_sqft,
      order.num_floors,
      order.base_cost,
      order.final_cost,
      order.status,
      order.payment_status,
      order.pilot_name || 'Not assigned',
      order.editor_name || 'Not assigned',
      order.referral_name || 'Direct',
      new Date(order.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Order ID, client name, business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Summary Stats */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <div>Total: {filteredOrders.length} orders</div>
              <div>Revenue: {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.final_cost, 0))}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No orders found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            HMX{order.id.toString().padStart(4, '0')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.preferred_date ? new Date(order.preferred_date).toLocaleDateString() : 'Date TBD'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.area_sqft} sq ft • {order.num_floors} floor(s)
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.client_name}</div>
                          <div className="text-sm text-gray-500">{order.business_name}</div>
                          <div className="text-xs text-gray-400">{order.client_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.service_type}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{order.location_details}</div>
                          {(order.special_requirements || order.voiceover_script || 
                            order.background_music_licensed || order.branding_overlay || 
                            order.multiple_revisions) && (
                            <div className="text-xs text-blue-600 mt-1">Enhanced features included</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="font-medium">Pilot:</span> {order.pilot_name || 'Not assigned'}
                        </div>
                        <div>
                          <span className="font-medium">Editor:</span> {order.editor_name || 'Not assigned'}
                        </div>
                        <div>
                          <span className="font-medium">Referral:</span> {order.referral_name || 'Direct'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.final_cost)}
                          </div>
                          <div className="flex items-center mt-1">
                            {getStatusIcon(order.status)}
                            <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Payment: {order.payment_status}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Order Details - HMX{selectedOrder.id.toString().padStart(4, '0')}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.service_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.location_details}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Date & Time</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedOrder.preferred_date ? new Date(selectedOrder.preferred_date).toLocaleDateString() : 'Not set'}
                    {selectedOrder.preferred_time && ` at ${selectedOrder.preferred_time}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area & Floors</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedOrder.area_sqft} sq ft, {selectedOrder.num_floors} floor(s)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1">{selectedOrder.status.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>

              {/* Enhanced Features */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Enhanced Features</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Requirements</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.special_requirements || 'None'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Voiceover Script</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.voiceover_script || 'None'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Licensed Music:</span>
                    <span className={`text-sm ${selectedOrder.background_music_licensed ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedOrder.background_music_licensed ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Branding Overlay:</span>
                    <span className={`text-sm ${selectedOrder.branding_overlay ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedOrder.branding_overlay ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Multiple Revisions:</span>
                    <span className={`text-sm ${selectedOrder.multiple_revisions ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedOrder.multiple_revisions ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cost & Team */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Cost & Team</h4>
                
                {/* Cost Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Cost Breakdown</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Cost:</span>
                      <span>{formatCurrency(selectedOrder.base_cost)}</span>
                    </div>
                    {selectedOrder.floor_cost > 0 && (
                      <div className="flex justify-between">
                        <span>Additional Floors:</span>
                        <span>{formatCurrency(selectedOrder.floor_cost)}</span>
                      </div>
                    )}
                    {selectedOrder.addon_cost > 0 && (
                      <div className="flex justify-between">
                        <span>Add-ons:</span>
                        <span>{formatCurrency(selectedOrder.addon_cost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1 font-semibold">
                      <span>Total:</span>
                      <span className="text-primary-600">{formatCurrency(selectedOrder.final_cost)}</span>
                    </div>
                  </div>
                </div>

                {/* Earnings Distribution */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Earnings Distribution</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Pilot (50%):</span>
                      <span>{formatCurrency(selectedOrder.pilot_earnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Editor (15%):</span>
                      <span>{formatCurrency(selectedOrder.editor_earnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Referral (12.5%):</span>
                      <span>{formatCurrency(selectedOrder.referral_earnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HMX (20%):</span>
                      <span>{formatCurrency(selectedOrder.hmx_earnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gateway (2.5%):</span>
                      <span>{formatCurrency(selectedOrder.gateway_fees)}</span>
                    </div>
                  </div>
                </div>

                {/* Team Assignment */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Team Assignment</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Pilot:</span> {selectedOrder.pilot_name || 'Not assigned'}
                      {selectedOrder.pilot_email && (
                        <div className="text-xs text-gray-500">{selectedOrder.pilot_email}</div>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Editor:</span> {selectedOrder.editor_name || 'Not assigned'}
                      {selectedOrder.editor_email && (
                        <div className="text-xs text-gray-500">{selectedOrder.editor_email}</div>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Referral:</span> {selectedOrder.referral_name || 'Direct booking'}
                      {selectedOrder.referral_email && (
                        <div className="text-xs text-gray-500">{selectedOrder.referral_email}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOrderCreated={() => {
          setShowCreateModal(false);
          fetchOrders();
        }}
      />
    </div>
  );
};

const NewBookingContent: React.FC<{ onBookingCreated: () => void }> = ({ onBookingCreated }) => {
  // Implementation moved to main component above
  return <div>New Booking Content</div>;
};

const PaymentsContent: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
    <div className="text-center text-gray-500 py-8">No payments to display</div>
  </div>
);

const MessagesContent: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
    <div className="text-center text-gray-500 py-8">No messages to display</div>
  </div>
);

const SettingsContent: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
    <div className="text-center text-gray-500 py-8">Settings panel coming soon</div>
  </div>
);

export default ClientDashboard;