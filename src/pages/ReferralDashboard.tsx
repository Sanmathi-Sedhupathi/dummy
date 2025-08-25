import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Users, MessageSquare, Settings, LogOut, ChevronRight, DollarSign, Award, FileText } from 'lucide-react';
import axios from 'axios';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
}

const ReferralDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
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
      
      // Fetch referral bookings (bookings where this user is the referral)
      const response = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // For referrals, we need to get bookings where they are the referral partner
      // This would need to be implemented in the backend to filter by referral_id
      const allBookings = response.data || [];
      
      // For now, calculate based on available data
      const referralBookings = allBookings.filter((booking: any) => 
        booking.referral_name && booking.referral_name !== 'Direct'
      );
      
      const completedReferrals = referralBookings.filter((b: any) => b.status === 'completed');
      const pendingReferrals = referralBookings.filter((b: any) => b.status !== 'completed' && b.status !== 'cancelled');
      
      const stats = {
        totalReferrals: referralBookings.length,
        completedReferrals: completedReferrals.length,
        pendingReferrals: pendingReferrals.length,
        totalEarnings: completedReferrals.reduce((sum: number, b: any) => sum + (b.referral_earnings || 0), 0)
      };
      
      setStats(stats);
    } catch (err) {
      console.error('Failed to fetch referral stats:', err);
      setStats({
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
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

  const menuItems = [
    { path: '/referral', icon: <BarChart3 size={20} />, label: 'Dashboard', component: <DashboardContent stats={stats} /> },
    { path: '/referral/leads', icon: <Users size={20} />, label: 'My Leads', component: <LeadsContent /> },
    { path: '/referral/earnings', icon: <DollarSign size={20} />, label: 'Earnings', component: <EarningsContent stats={stats} /> },
    { path: '/referral/messages', icon: <MessageSquare size={20} />, label: 'Messages', component: <MessagesContent /> },
    { path: '/referral/settings', icon: <Settings size={20} />, label: 'Settings', component: <SettingsContent /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-primary-950 text-white ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
        <div className="p-4 border-b border-primary-800">
          <h2 className={`font-heading font-bold ${isSidebarOpen ? 'text-xl' : 'text-center text-2xl'}`}>
            {isSidebarOpen ? 'HMX Referral' : 'HMX'}
          </h2>
        </div>

        <div className="p-4 border-b border-primary-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center">
              {userInitial}
            </div>
            {isSidebarOpen && (
              <div>
                <p className="font-medium text-white">{userData.contact_name || 'Referral Partner'}</p>
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
              <Route key={item.path} path={item.path.replace('/referral', '')} element={item.component} />
            ))}
          </Routes>
        </div>
      </main>
    </div>
  );
};

const DashboardContent: React.FC<{ stats: ReferralStats }> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
  <div className="space-y-6">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Total Referrals', value: stats.totalReferrals, icon: <Users className="text-blue-500" /> },
        { label: 'Completed', value: stats.completedReferrals, icon: <Award className="text-green-500" /> },
        { label: 'Pending', value: stats.pendingReferrals, icon: <FileText className="text-yellow-500" /> },
        { label: 'Total Earnings', value: formatCurrency(stats.totalEarnings), icon: <DollarSign className="text-purple-500" /> },
      ].map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-gray-50">
              {stat.icon}
            </div>
          </div>
          <h3 className="mt-2 text-gray-500 text-sm font-medium">{stat.label}</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>

    {/* Recent Activity */}
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h2>
      <div className="space-y-4">
        <p className="text-gray-500 text-center py-4">No recent referrals to show</p>
      </div>
    </div>
  </div>
  );
};

const LeadsContent: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">My Leads</h2>
    <div className="text-center text-gray-500 py-8">No leads yet</div>
  </div>
);

const EarningsContent: React.FC<{ stats: ReferralStats }> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Commission Rate</h3>
              <p className="text-2xl font-bold text-blue-600">12.5%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Successful Referrals</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.completedReferrals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Earnings History</h2>
        <div className="text-center text-gray-500 py-8">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No earnings history available yet.</p>
          <p className="text-sm mt-2">Start referring businesses to see your earnings here!</p>
        </div>
      </div>
    </div>
  );
};

const MessagesContent: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
    <div className="text-center text-gray-500 py-8">No messages to display</div>
  </div>
);

const SettingsContent: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Referral Code</label>
        <div className="mt-1 flex">
          <input
            type="text"
            value="REF0001"
            readOnly
            className="flex-1 rounded-md border-gray-300 bg-gray-50"
          />
          <button className="ml-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            Copy
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Commission Rate</label>
        <div className="mt-1 text-lg font-semibold text-green-600">12.5%</div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
        <select className="mt-1 block w-full rounded-md border-gray-300">
          <option>Bank Transfer</option>
          <option>PayPal</option>
          <option>UPI</option>
        </select>
      </div>
    </div>
  </div>
);

export default ReferralDashboard;