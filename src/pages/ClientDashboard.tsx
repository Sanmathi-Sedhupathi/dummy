import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Settings, LogOut, BarChart3, MessageSquare, Award, MapPin, Menu, X, ChevronRight, Plus, CreditCard, FileText, Eye, DollarSign } from 'lucide-react';
import axios from 'axios';
import { authService } from '../services/api';
import PhonePePayment from '../components/PhonePePayment';

interface Booking {
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
  status: string;
  payment_status: string;
  created_at: string;
  client_name: string;
  business_name: string;
  pilot_name: string;
  editor_name: string;
  referral_name: string;
}

const ClientDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalSpent: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
        await fetchStats();
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const bookings = response.data || [];
      const completedBookings = bookings.filter((b: any) => b.status === 'completed');
      const pendingBookings = bookings.filter((b: any) => b.status !== 'completed' && b.status !== 'cancelled');

      const stats = {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: pendingBookings.length,
        totalSpent: bookings.reduce((sum: number, b: any) => sum + (b.final_cost || 0), 0)
      };
      setStats(stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const menuItems = [
    { path: '/client', icon: <BarChart3 size={20} />, label: 'Dashboard', component: <DashboardContent stats={stats} /> },
    { path: '/client/bookings', icon: <Calendar size={20} />, label: 'My Bookings', component: <BookingsContent /> },
    { path: '/client/new-booking', icon: <Plus size={20} />, label: 'New Booking', component: <NewBookingContent onBookingCreated={fetchStats} /> },
    { path: '/client/payments', icon: <CreditCard size={20} />, label: 'Payments', component: <PaymentsContent /> },
    { path: '/client/messages', icon: <MessageSquare size={20} />, label: 'Messages', component: <MessagesContent /> },
    { path: '/client/settings', icon: <Settings size={20} />, label: 'Settings', component: <SettingsContent /> },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  if (isLoading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const userInitial = userData.contact_name ? userData.contact_name.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-primary-950 text-white ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
        <div className="p-4 border-b border-primary-800">
          <h2 className={`font-heading font-bold ${isSidebarOpen ? 'text-xl' : 'text-center text-2xl'}`}>
            {isSidebarOpen ? 'HMX Client' : 'HMX'}
          </h2>
        </div>
        
        <div className="p-4 border-b border-primary-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center">
              {userInitial}
            </div>
            {isSidebarOpen && (
              <div>
                <p className="font-medium text-white">{userData.contact_name || 'Client'}</p>
                <p className="text-sm text-gray-400">{userData.business_name || userData.email}</p>
              </div>
            )}
          </div>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-900 text-white'
                  : 'text-gray-300 hover:bg-primary-900 hover:text-white'
              }`}
            >
              {item.icon}
              {isSidebarOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-primary-900 hover:text-white transition-colors mt-4"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-50"
            >
              <ChevronRight size={20} className={`transform transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <Routes>
            {menuItems.map((item) => (
              <Route key={item.path} path={item.path.replace('/client', '')} element={item.component} />
            ))}
          </Routes>
        </div>
      </main>
    </div>
  );
};

// Dashboard Components
const DashboardContent: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Total Bookings', value: stats.totalBookings, icon: <Calendar className="text-blue-500" /> },
        { label: 'Completed', value: stats.completedBookings, icon: <Award className="text-green-500" /> },
        { label: 'Pending', value: stats.pendingBookings, icon: <FileText className="text-yellow-500" /> },
        { label: 'Total Spent', value: `₹${stats.totalSpent.toLocaleString('en-IN')}`, icon: <DollarSign className="text-purple-500" /> },
      ].map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-gray-50">
              {stat.icon}
            </div>
          </div>
          <h3 className="mt-4 text-gray-500 text-sm font-medium">{stat.label}</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>

    {/* Recent Bookings */}
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-center py-4">No recent bookings to show</p>
      </div>
    </div>
  </div>
);

const BookingsContent: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bookings');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  HMX{booking.id.toString().padStart(4, '0')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.service_type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {booking.location_details}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'Not set'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(booking.final_cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowDetailsModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye size={16} />
                  </button>
                  {booking.payment_status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowPaymentModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      <CreditCard size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Booking Details - HMX{selectedBooking.id.toString().padStart(4, '0')}</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.service_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.location_details}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Date & Time</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.preferred_date ? new Date(selectedBooking.preferred_date).toLocaleDateString() : 'Not set'}
                    {selectedBooking.preferred_time && ` at ${selectedBooking.preferred_time}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area & Floors</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.area_sqft} sq ft, {selectedBooking.num_floors} floor(s)
                  </p>
                </div>
              </div>

              {/* Enhanced Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Enhanced Features</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Requirements</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.special_requirements || 'None'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Voiceover Script</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.voiceover_script || 'None'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Licensed Music</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.background_music_licensed ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Branding Overlay</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.branding_overlay ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Multiple Revisions</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.multiple_revisions ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Cost Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Base Cost:</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedBooking.base_cost)}</span>
                  </div>
                  {selectedBooking.floor_cost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Additional Floors:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedBooking.floor_cost)}</span>
                    </div>
                  )}
                  {selectedBooking.addon_cost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Add-ons:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedBooking.addon_cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-semibold text-gray-900">Final Cost:</span>
                    <span className="text-sm font-bold text-primary-600">{formatCurrency(selectedBooking.final_cost)}</span>
                  </div>
                </div>
              </div>

              {/* Team Assignment */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Team Assignment</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pilot</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.pilot_name || 'Not assigned yet'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Editor</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.editor_name || 'Not assigned yet'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Referral Partner</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.referral_name || 'Direct booking'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {selectedBooking.payment_status === 'pending' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Make Payment
                </button>
              )}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <PhonePePayment
          bookingId={selectedBooking.id}
          amount={selectedBooking.final_cost}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchBookings();
          }}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

const NewBookingContent: React.FC<{ onBookingCreated: () => void }> = ({ onBookingCreated }) => {
  const [formData, setFormData] = useState({
    service_type: '',
    location_details: '',
    preferred_date: '',
    preferred_time: '',
    area_sqft: '',
    num_floors: '1',
    special_requirements: '',
    voiceover_script: '',
    background_music_licensed: false,
    branding_overlay: false,
    multiple_revisions: false
  });
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const serviceTypes = [
    'Retail Store / Showroom',
    'Restaurants & Cafes',
    'Fitness & Sports Arenas',
    'Resorts & Farmstays / Hotels',
    'Real Estate Property',
    'Shopping Mall / Complex',
    'Adventure / Water Parks',
    'Gaming & Entertainment Zones'
  ];

  const calculateCost = async () => {
    if (!formData.service_type || !formData.area_sqft) return;

    try {
      const response = await axios.post('http://localhost:5000/api/calculate-cost', formData);
      setCostBreakdown(response.data);
    } catch (err) {
      console.error('Failed to calculate cost:', err);
    }
  };

  useEffect(() => {
    calculateCost();
  }, [formData.service_type, formData.area_sqft, formData.num_floors, 
      formData.voiceover_script, formData.background_music_licensed, 
      formData.branding_overlay, formData.multiple_revisions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/bookings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onBookingCreated();
      // Reset form
      setFormData({
        service_type: '',
        location_details: '',
        preferred_date: '',
        preferred_time: '',
        area_sqft: '',
        num_floors: '1',
        special_requirements: '',
        voiceover_script: '',
        background_music_licensed: false,
        branding_overlay: false,
        multiple_revisions: false
      });
      setCostBreakdown(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Booking</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select service type</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area (sq ft) *</label>
              <input
                type="number"
                value={formData.area_sqft}
                onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter area in square feet"
                required
              />
            </div>

            {/* Number of Floors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Floors</label>
              <input
                type="number"
                min="1"
                value={formData.num_floors}
                onChange={(e) => setFormData({ ...formData, num_floors: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Preferred Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
              <input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Preferred Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
              <input
                type="time"
                value={formData.preferred_time}
                onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Location Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location Details *</label>
            <textarea
              value={formData.location_details}
              onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Complete address and any specific location instructions"
              required
            />
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
            <textarea
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any specific requirements or instructions for the shoot"
            />
          </div>

          {/* Voiceover Script */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voiceover Script (+15% cost)</label>
            <textarea
              value={formData.voiceover_script}
              onChange={(e) => setFormData({ ...formData, voiceover_script: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Script for voiceover narration (optional)"
            />
          </div>

          {/* Add-on Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Additional Options</label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.background_music_licensed}
                  onChange={(e) => setFormData({ ...formData, background_music_licensed: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Licensed Background Music (+10% cost)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.branding_overlay}
                  onChange={(e) => setFormData({ ...formData, branding_overlay: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Branding Overlay (+12% cost)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.multiple_revisions}
                  onChange={(e) => setFormData({ ...formData, multiple_revisions: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Multiple Revisions (+8% cost)</span>
              </label>
            </div>
          </div>

          {/* Cost Preview */}
          {costBreakdown && !costBreakdown.requires_custom_quote && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-semibold text-primary-900 mb-3">Cost Preview</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Base Cost:</span>
                  <span className="text-sm font-medium">{formatCurrency(costBreakdown.base_cost)}</span>
                </div>
                {costBreakdown.floor_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Additional Floors:</span>
                    <span className="text-sm font-medium">{formatCurrency(costBreakdown.floor_cost)}</span>
                  </div>
                )}
                {costBreakdown.addon_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Add-ons:</span>
                    <span className="text-sm font-medium">{formatCurrency(costBreakdown.addon_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold text-gray-900">Total Cost:</span>
                  <span className="text-lg font-bold text-primary-600">{formatCurrency(costBreakdown.final_cost)}</span>
                </div>
              </div>
            </div>
          )}

          {costBreakdown?.requires_custom_quote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Custom Quote Required:</strong> For projects over 50,000 sq ft, we provide custom quotes. 
                Our team will contact you within 24 hours with a personalized quote.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !formData.service_type || !formData.location_details || !formData.area_sqft}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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