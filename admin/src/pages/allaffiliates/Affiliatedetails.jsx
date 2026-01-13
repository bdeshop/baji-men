import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaUser, FaPhone, FaEnvelope, FaMoneyBill, FaIdCard, 
  FaBuilding, FaGlobe, FaChartLine, FaUsers, FaMousePointer,
  FaCalendarAlt, FaCreditCard, FaDollarSign, FaClipboardCheck,
  FaFileAlt, FaTag, FaEdit, FaArrowLeft, FaSpinner,
  FaCheckCircle, FaTimesCircle, FaClock, FaBan,
  FaPercentage, FaWallet, FaCalendar, FaSyncAlt, FaHistory,
  FaExternalLinkAlt, FaLink, FaShareAlt, FaQrcode
} from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Affiliatedetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [affiliate, setAffiliate] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [referredUsers, setReferredUsers] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch affiliate details
  useEffect(() => {
    const fetchAffiliateDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${base_url}/api/admin/affiliates/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch affiliate details');
        }

        const data = await response.json();
        setAffiliate(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching affiliate details:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch affiliate stats
    const fetchAffiliateStats = async () => {
      try {
        const response = await fetch(`${base_url}/api/admin/affiliates/${id}/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    // Fetch recent activities
    const fetchRecentActivities = async () => {
      try {
        const response = await fetch(`${base_url}/api/admin/affiliates/${id}/activities`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setRecentActivities(data.activities || []);
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };

    // Fetch referred users
    const fetchReferredUsers = async () => {
      try {
        const response = await fetch(`${base_url}/api/admin/affiliates/${id}/referred-users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setReferredUsers(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching referred users:', err);
      }
    };

    // Fetch earnings data
    const fetchEarningsData = async () => {
      try {
        const response = await fetch(`${base_url}/api/admin/affiliates/${id}/earnings`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setEarningsData(data.earnings || []);
        }
      } catch (err) {
        console.error('Error fetching earnings data:', err);
      }
    };

    if (id) {
      fetchAffiliateDetails();
      fetchAffiliateStats();
      fetchRecentActivities();
      fetchReferredUsers();
      fetchEarningsData();
    }
  }, [id]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'banned':
        return 'bg-gray-800 text-white border border-gray-900';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Get verification badge style
  const getVerificationBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Prepare chart data
  const earningsChartData = {
    labels: earningsData.map(item => item.month),
    datasets: [
      {
        label: 'Earnings (BDT)',
        data: earningsData.map(item => item.amount),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const referralsChartData = {
    labels: ['Active', 'Inactive', 'Pending'],
    datasets: [
      {
        data: [stats?.activeReferrals || 0, stats?.inactiveReferrals || 0, stats?.pendingReferrals || 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Handle delete affiliate
  const handleDelete = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete affiliate');
      }

      navigate('/affiliates');
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedAffiliate = await response.json();
      setAffiliate(updatedAffiliate.affiliate);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="animate-spin text-orange-500 text-5xl" />
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-2xl mb-4">Error</div>
                <p className="text-gray-600">{error}</p>
                <button 
                  onClick={() => navigate('/affiliates')} 
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Back to Affiliates
                </button>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (!affiliate) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-500 text-2xl mb-4">Affiliate not found</div>
                <button 
                  onClick={() => navigate('/affiliates')} 
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Back to Affiliates
                </button>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/affiliates')}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <FaArrowLeft className="text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Affiliate Details</h1>
                  <p className="text-sm text-gray-500">Manage and monitor affiliate performance</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FaEdit />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Affiliate Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4 flex-1">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl">
                  {affiliate.firstName?.charAt(0)}{affiliate.lastName?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {affiliate.firstName} {affiliate.lastName}
                  </h2>
                  <p className="text-gray-600">{affiliate.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(affiliate.status)}`}>
                      {affiliate.status?.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getVerificationBadge(affiliate.verificationStatus)}`}>
                      {affiliate.verificationStatus?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{formatCurrency(affiliate.pendingEarnings)}</div>
                <p className="text-sm text-gray-500">Pending Earnings</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['overview', 'earnings', 'referrals', 'activities', 'settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(affiliate.totalEarnings)}</p>
                      </div>
                      <FaMoneyBill className="text-green-500 text-2xl" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Referrals</p>
                        <p className="text-2xl font-bold text-gray-900">{affiliate.referredUsers?.length || 0}</p>
                      </div>
                      <FaUsers className="text-blue-500 text-2xl" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Click Count</p>
                        <p className="text-2xl font-bold text-gray-900">{affiliate.clickCount || 0}</p>
                      </div>
                      <FaMousePointer className="text-purple-500 text-2xl" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Conversion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {((affiliate.conversionRate || 0) * 100).toFixed(2)}%
                        </p>
                      </div>
                      <FaChartLine className="text-yellow-500 text-2xl" />
                    </div>
                  </div>
                </div>

           

                {/* Affiliate Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Affiliate Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Affiliate Code</p>
                        <p className="font-medium text-gray-900">{affiliate.affiliateCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{affiliate.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Company</p>
                        <p className="font-medium text-gray-900">{affiliate.company || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <p className="font-medium text-gray-900">{affiliate.website || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Promotion Method</p>
                        <p className="font-medium text-gray-900">{affiliate.promoMethod || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registered Date</p>
                        <p className="font-medium text-gray-900">{formatDate(affiliate.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Settings</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bet Commission</span>
                        <span className="font-medium">{(affiliate.commissionRate * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Deposit Commission</span>
                        <span className="font-medium">{(affiliate.depositRate * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">CPA Rate</span>
                        <span className="font-medium">{formatCurrency(affiliate.cpaRate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Commission Type</span>
                        <span className="font-medium">{affiliate.commissionType || 'Standard'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Earnings History</h3>
                  <button 
                    onClick={() => setShowCommissionModal(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                  >
                    Adjust Commissions
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {earningsData.length > 0 ? (
                        earningsData.map((earning, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(earning.date)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {earning.type}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(earning.amount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                earning.status === 'paid' 
                                  ? 'bg-green-100 text-green-800'
                                  : earning.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {earning.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {earning.reference || 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                            No earnings history available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Payment Information */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-900">{affiliate.paymentMethod || 'Not Set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Minimum Payout</p>
                      <p className="font-medium text-gray-900">{formatCurrency(affiliate.minimumPayout)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payout Schedule</p>
                      <p className="font-medium text-gray-900">{affiliate.payoutSchedule || 'Monthly'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Auto Payout</p>
                      <p className={`font-medium ${affiliate.autoPayout ? 'text-green-600' : 'text-red-600'}`}>
                        {affiliate.autoPayout ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Referred Users</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Deposits
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission Generated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {referredUsers.length > 0 ? (
                        referredUsers.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {user.userId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800'
                                  : user.status === 'inactive'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(user.registrationDate)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(user.totalDeposits)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(user.commissionGenerated)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                            No referred users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activities</h3>
                
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'click' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'registration' ? 'bg-green-100 text-green-600' :
                          activity.type === 'deposit' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.type === 'click' && <FaMousePointer />}
                          {activity.type === 'registration' && <FaUser />}
                          {activity.type === 'deposit' && <FaMoneyBill />}
                          {activity.type === 'commission' && <FaPercentage />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                        </div>
                        <div className="text-right">
                          {activity.amount && (
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(activity.amount)}</p>
                          )}
                          {activity.ip && (
                            <p className="text-xs text-gray-500">IP: {activity.ip}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent activities found
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(affiliate.status)}`}>
                          {affiliate.status?.toUpperCase()}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange('active')}
                            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleStatusChange('suspended')}
                            className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleStatusChange('banned')}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Ban
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${getVerificationBadge(affiliate.verificationStatus)}`}>
                          {affiliate.verificationStatus?.toUpperCase()}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(`${base_url}/api/admin/affiliates/${id}/verification-status`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                                  },
                                  body: JSON.stringify({ verificationStatus: 'verified' })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setAffiliate(data.affiliate);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Verify
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(`${base_url}/api/admin/affiliates/${id}/verification-status`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                                  },
                                  body: JSON.stringify({ verificationStatus: 'rejected' })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  setAffiliate(data.affiliate);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Auto Payout</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={affiliate.autoPayout}
                          onChange={async (e) => {
                            try {
                              const response = await fetch(`${base_url}/api/admin/affiliates/${id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                                },
                                body: JSON.stringify({ autoPayout: e.target.checked })
                              });
                              if (response.ok) {
                                const data = await response.json();
                                setAffiliate(data.affiliate);
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm text-gray-900">
                          {affiliate.autoPayout ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    <div>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Process Payment
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Affiliate Link</h3>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/register?ref=${affiliate.affiliateCode}`;
                        navigator.clipboard.writeText(link);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Copy Link
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded border border-gray-200 break-all">
                      <code className="text-sm text-gray-700">
                        {`${window.location.origin}/register?ref=${affiliate.affiliateCode}`}
                      </code>
                    </div>

                    <div>
                      <button
                        onClick={() => setShowNotesModal(true)}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center space-x-2"
                      >
                        <FaFileAlt />
                        <span>View/Add Notes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Affiliate</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                // Handle form submission
                setShowEditModal(false);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      defaultValue={affiliate.firstName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      defaultValue={affiliate.lastName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={affiliate.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      defaultValue={affiliate.phone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      defaultValue={affiliate.company}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      defaultValue={affiliate.website}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Method</label>
                    <input
                      type="text"
                      defaultValue={affiliate.promoMethod}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <input
                      type="text"
                      defaultValue={affiliate.paymentMethod}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      defaultValue={affiliate.notes}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Commission Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[100000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Commission Rates</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                // Handle commission update
                setShowCommissionModal(false);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bet Commission (%)</label>
                    <input
                      type="number"
                      defaultValue={(affiliate.commissionRate * 100).toFixed(2)}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Commission (%)</label>
                    <input
                      type="number"
                      defaultValue={(affiliate.depositRate * 100).toFixed(2)}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPA Rate (BDT)</label>
                    <input
                      type="number"
                      defaultValue={affiliate.cpaRate}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCommissionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                  >
                    Update Rates
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Payment</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                // Handle payment processing
                setShowPaymentModal(false);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (BDT)</label>
                    <input
                      type="number"
                      defaultValue={affiliate.pendingEarnings}
                      step="0.01"
                      min="0"
                      max={affiliate.pendingEarnings}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="bank">Bank Transfer</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="rocket">Rocket</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter transaction ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Payment notes..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                  >
                    Process Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Affiliate Notes</h3>
              <div className="mb-6">
                <textarea
                  defaultValue={affiliate.notes}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Add notes about this affiliate..."
                />
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Affiliate</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete {affiliate.firstName} {affiliate.lastName}? 
                This action cannot be undone and will permanently remove all affiliate data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete Affiliate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Affiliatedetails;