import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Calendar, Settings, LogOut, BarChart3, MessageSquare, Award, MapPin, Menu, X, ChevronRight, Video, Play, User, DollarSign, FileText, Eye } from 'lucide-react';
import axios from 'axios';
import { authService } from '../services/api';
import VideoSubmissions from '../components/editor/VideoSubmissions';

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
  status: string;
  payment_status: string;
  created_at: string;
  client_name: string;
  business_name: string;
  client_email: string;
  client_phone: string;
  pilot_name: string;
  pilot_email: string;
  referral_name: string;
  raw_video_link: string;
}

const EditorDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    ongoingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User data received:', response.data);
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

      // Use the modified assigned-orders endpoint that now returns all orders
      const response = await axios.get('http://localhost:5000/api/editor/assigned-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allOrders = response.data || [];
      const ongoingOrders = allOrders.filter((b: any) => !['completed', 'cancelled', 'rejected'].includes(b.status));
      const completedOrders = allOrders.filter((b: any) => b.status === 'completed');
      const cancelledOrders = allOrders.filter((b: any) => ['cancelled', 'rejected'].includes(b.status));

      const stats = {
        ongoingOrders: ongoingOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalEarnings: completedOrders.reduce((sum: number, b: any) => sum + (b.editor_earnings || 0), 0)
      };
      setStats(stats);
    } catch (err) {
      // Set default stats on error
      setStats({
        ongoingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalEarnings: 0
      });
    }
  };



  const menuItems = [
    { path: '/editor', icon: <BarChart3 size={20} />, label: 'Dashboard', component: <DashboardContent stats={stats} /> },
    { path: '/editor/ongoing-orders', icon: <Video size={20} />, label: 'Ongoing Orders', component: <OngoingOrdersContent /> },
    { path: '/editor/completed-orders', icon: <Award size={20} />, label: 'Completed Orders', component: <CompletedOrdersContent /> },
    { path: '/editor/cancelled-orders', icon: <X size={20} />, label: 'Cancelled Orders', component: <CancelledOrdersContent /> },
    { path: '/editor/video-submissions', icon: <Play size={20} />, label: 'Video Submissions', component: <VideoSubmissions /> },
    { path: '/editor/settings', icon: <Settings size={20} />, label: 'Settings', component: <SettingsContent /> },
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

  // Add a safety check for userData.name
  const userInitial = userData.name ? userData.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-primary-950 text-white ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
        <div className="p-4 border-b border-primary-800">
          <h2 className={`font-heading font-bold ${isSidebarOpen ? 'text-xl' : 'text-center text-2xl'}`}>
            {isSidebarOpen ? 'HMX Editor' : 'HMX'}
          </h2>
        </div>
        
        <div className="p-4 border-b border-primary-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center">
              {userInitial}
            </div>
            {isSidebarOpen && (
              <div>
                <p className="font-medium text-white">{userData.name || 'Editor'}</p>
                <p className="text-sm text-gray-400">{userData.email || ''}</p>
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
              <Route key={item.path} path={item.path.replace('/editor', '')} element={item.component} />
            ))}
            <Route path="/submission-history/:orderId" element={<SubmissionHistoryPage />} />
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
        { label: 'Ongoing Orders', value: stats.ongoingOrders, icon: <Video className="text-blue-500" /> },
        { label: 'Completed Orders', value: stats.completedOrders, icon: <Award className="text-green-500" /> },
        { label: 'Cancelled Orders', value: stats.cancelledOrders, icon: <X className="text-red-500" /> },
        { label: 'Total Earnings', value: `₹${stats.totalEarnings.toLocaleString('en-IN')}`, icon: <BarChart3 className="text-purple-500" /> },
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

    {/* Recent Activity */}
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-center py-4">No recent orders to show</p>
      </div>
    </div>
  </div>
);

const OngoingOrdersContent: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOngoingOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'editing': return 'bg-purple-100 text-purple-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewHistory = (orderId: number) => {
    // Navigate to submission history page
    window.location.href = `/editor/submission-history/${orderId}`;
  };

  const fetchOngoingOrders = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get('http://localhost:5000/api/editor/assigned-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allOrders = response.data || [];

      // Filter for ongoing orders only
      const ongoingOrders = allOrders.filter((order: any) =>
        !['completed', 'cancelled', 'rejected'].includes(order.status)
      );

      setOrders(ongoingOrders);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch ongoing orders');
      setLoading(false);
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
    <div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service & Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">My Earnings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No ongoing orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div>HMX{order.id.toString().padStart(4, '0')}</div>
                      <div className="text-xs text-gray-500">
                        {order.preferred_date ? new Date(order.preferred_date).toLocaleDateString() : 'Date TBD'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.client_name}</div>
                      <div className="text-sm text-gray-500">{order.business_name}</div>
                      <div className="text-xs text-gray-400">{order.client_email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.service_type}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{order.location_details}</div>
                      <div className="text-xs text-gray-400">{order.area_sqft} sq ft • {order.num_floors} floor(s)</div>
                      {order.raw_video_link && (
                        <a
                          href={order.raw_video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 text-xs flex items-center mt-1"
                        >
                          <Video size={12} className="mr-1" />
                          Raw Video Available
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                    <div>
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(order.editor_earnings)}
                      </div>
                      <div className="text-xs text-gray-500">
                        from {formatCurrency(order.final_cost)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.split('_').map((word: string) =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleViewHistory(order.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Submission History"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
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
                  <label className="block text-sm font-medium text-gray-700">Client</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.client_name}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.business_name}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.client_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pilot</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.pilot_name || 'Not assigned'}</p>
                  {selectedOrder.pilot_email && (
                    <p className="text-xs text-gray-500">{selectedOrder.pilot_email}</p>
                  )}
                </div>
              </div>

              {/* Enhanced Features & Requirements */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Editing Requirements</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Requirements</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.special_requirements || 'None'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Voiceover Script</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                    {selectedOrder.voiceover_script || 'No voiceover required'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Licensed Music:</span>
                    <span className={`text-sm ${selectedOrder.background_music_licensed ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedOrder.background_music_licensed ? 'Required' : 'Not required'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Branding Overlay:</span>
                    <span className={`text-sm ${selectedOrder.branding_overlay ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedOrder.branding_overlay ? 'Required' : 'Not required'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 w-32">Multiple Revisions:</span>
                    <span className={`text-sm ${selectedOrder.multiple_revisions ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedOrder.multiple_revisions ? 'Allowed' : 'Standard revisions'}
                    </span>
                  </div>
                </div>
                {selectedOrder.raw_video_link && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Raw Video from Pilot</label>
                    <a
                      href={selectedOrder.raw_video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-blue-600 hover:text-blue-900 flex items-center text-sm"
                    >
                      <Video size={16} className="mr-1" />
                      View Raw Video
                    </a>
                  </div>
                )}
              </div>

              {/* Earnings & Cost */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Earnings & Cost</h4>
                
                {/* My Earnings */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">My Earnings (15%)</h5>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedOrder.editor_earnings)}
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    From total project cost of {formatCurrency(selectedOrder.final_cost)}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Project Cost Breakdown</h5>
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

                {/* Team Earnings */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Team Earnings Distribution</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Pilot:</span>
                      <span>{formatCurrency(selectedOrder.pilot_earnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Editor (Me):</span>
                      <span className="font-semibold text-green-600">{formatCurrency(selectedOrder.editor_earnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Referral:</span>
                      <span>{formatCurrency(selectedOrder.referral_earnings)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleViewHistory(selectedOrder.id)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                View Submission History
              </button>
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
    </div>
  );
};

const CompletedOrdersContent: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/editor/assigned-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allOrders = response.data || [];
      // Filter for completed orders only
      const completedOrders = allOrders.filter((order: any) => order.status === 'completed');
      setOrders(completedOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching completed orders:', err);
      setError('Failed to fetch completed orders');
      setLoading(false);
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Completed Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          No completed orders found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service & Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">My Earnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    HMX{order.id.toString().padStart(4, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.client_name}</div>
                    <div className="text-sm text-gray-500">{order.business_name}</div>
                    <div className="text-xs text-gray-400">{order.client_email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="text-sm font-medium text-gray-900">{order.service_type}</div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">{order.location_details}</div>
                    <div className="text-xs text-gray-400">{order.area_sqft} sq ft • {order.num_floors} floor(s)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(order.editor_earnings)}
                    </div>
                    <div className="text-xs text-gray-500">
                      15% of {formatCurrency(order.final_cost)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.payment_status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment_status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CancelledOrdersContent: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCancelledOrders();
  }, []);

  const fetchCancelledOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/editor/assigned-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allOrders = response.data || [];
      // Filter for cancelled/rejected orders only
      const cancelledOrders = allOrders.filter((order: any) =>
        ['cancelled', 'rejected'].includes(order.status)
      );
      setOrders(cancelledOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cancelled orders:', err);
      setError('Failed to fetch cancelled orders');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cancelled Orders</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No cancelled orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Order HMX{order.id.toString().padStart(4, '0')}</h3>
                  <p className="text-sm text-gray-500">Client: {order.client_name}</p>
                  <p className="text-sm text-gray-500">Status: {order.status}</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SettingsContent: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Notifications</label>
        <div className="flex items-center">
          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span className="ml-2 text-sm text-gray-600">Receive email notifications for new video assignments</span>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Video Format</label>
        <select className="w-full p-3 border border-gray-300 rounded-lg">
          <option>MP4 (H.264)</option>
          <option>MOV (ProRes)</option>
          <option>AVI</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quality Preference</label>
        <select className="w-full p-3 border border-gray-300 rounded-lg">
          <option>4K</option>
          <option>1080p</option>
          <option>720p</option>
        </select>
      </div>
    </div>
  </div>
);

const SubmissionHistoryPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newVideoLink, setNewVideoLink] = useState('');
  const [newComments, setNewComments] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      fetchSubmissionHistory();
    }
  }, [orderId]);

  const fetchSubmissionHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/editor/submission-history/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch submission history');
      setLoading(false);
    }
  };

  const handleSubmitVideo = async () => {
    if (!newVideoLink.trim()) {
      alert('Please enter a video link');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/editor/video-submissions`, {
        order_id: orderId,
        drive_link: newVideoLink,
        editor_comments: newComments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowSubmitModal(false);
      setNewVideoLink('');
      setNewComments('');
      fetchSubmissionHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit video');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/editor/ongoing-orders')}
            className="text-blue-600 hover:text-blue-900 mb-2"
          >
            ← Back to Ongoing Orders
          </button>
          <h1 className="text-2xl font-bold">Submission History - Order HMX{orderId?.padStart(4, '0')}</h1>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit New Video
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Editor Comments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Comments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No submissions found for this order.
                </td>
              </tr>
            ) : (
              submissions.map((submission, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submitted_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={submission.drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Video
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {submission.editor_comments || 'No comments'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {submission.admin_comments || 'No comments'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                      submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submit Video Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit New Video</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Video Link</label>
                <input
                  type="url"
                  value={newVideoLink}
                  onChange={(e) => setNewVideoLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter Google Drive link"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Comments</label>
                <textarea
                  value={newComments}
                  onChange={(e) => setNewComments(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any comments..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitVideo}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;