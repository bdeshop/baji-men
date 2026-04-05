import React, { useState, useEffect } from 'react';
import { 
  FaCalendarWeek, FaPercentage, FaGift, FaSpinner, 
  FaInfoCircle, FaUsers, FaMoneyBillWave, FaClock, FaTags, FaRegClock, 
  FaBan, FaSearch, FaCheckCircle, FaTimesCircle, FaDollarSign, FaChartLine,
  FaAward, FaTrophy, FaMedal, FaHistory, FaWallet
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import axios from 'axios';
import { MdCalendarMonth } from "react-icons/md";

const WeeklyMonthlyBonus = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBonus, setLoadingBonus] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'monthly'
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bonusHistory, setBonusHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  
  const [weeklyFormData, setWeeklyFormData] = useState({
    adminId: '',
    adminUsername: '',
    notes: 'Weekly bonus distribution',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [monthlyFormData, setMonthlyFormData] = useState({
    adminId: '',
    adminUsername: '',
    notes: 'Monthly bonus distribution',
    date: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  
  const [errors, setErrors] = useState({});
  const [calculationResults, setCalculationResults] = useState(null);

  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Get admin info from localStorage
  useEffect(() => {
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
      try {
        const admin = JSON.parse(adminData);
        setWeeklyFormData(prev => ({
          ...prev,
          adminId: admin._id || admin.id || '',
          adminUsername: admin.username || admin.name || ''
        }));
        setMonthlyFormData(prev => ({
          ...prev,
          adminId: admin._id || admin.id || '',
          adminUsername: admin.username || admin.name || ''
        }));
      } catch (error) {
        console.error('Error parsing admin info:', error);
      }
    }
  }, []);

  // Fetch users for eligible users list
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('admintoken');
      const response = await axios.get(`${base_url}/api/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const usersData = response.data.data || response.data.users || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch bonus history
  const fetchBonusHistory = async () => {
    try {
      const token = localStorage.getItem('admintoken');
      const response = await axios.get(`${base_url}/api/admin/bonus/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBonusHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bonus history:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBonusHistory();
  }, []);

  // Filter users based on search term
  const getFilteredUsers = () => {
    if (!searchTerm.trim()) return users;
    
    const search = searchTerm.toLowerCase();
    return users.filter(user => 
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.player_id?.toLowerCase().includes(search) ||
      user.phone?.includes(search)
    );
  };

  // Calculate Weekly Bonus
  const handleWeeklyBonusCalculate = async () => {
    if (!weeklyFormData.adminId || !weeklyFormData.adminUsername) {
      toast.error('Admin information is missing. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('admintoken');
      const response = await axios.post(`${base_url}/api/admin/bonus/weekly`, 
        weeklyFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || 'Weekly bonus calculated successfully!');
        setCalculationResults(response.data.summary);
        fetchBonusHistory(); // Refresh history
      } else {
        toast.error(response.data.message || 'Failed to calculate weekly bonus');
      }
    } catch (error) {
      console.error('Error calculating weekly bonus:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate weekly bonus');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Monthly Bonus
  const handleMonthlyBonusCalculate = async () => {
    if (!monthlyFormData.adminId || !monthlyFormData.adminUsername) {
      toast.error('Admin information is missing. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('admintoken');
      const response = await axios.post(`${base_url}/api/admin/bonus/monthly`, 
        monthlyFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message || 'Monthly bonus calculated successfully!');
        setCalculationResults(response.data.summary);
        fetchBonusHistory(); // Refresh history
      } else {
        toast.error(response.data.message || 'Failed to calculate monthly bonus');
      }
    } catch (error) {
      console.error('Error calculating monthly bonus:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate monthly bonus');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Claim bonus for a user
  const handleClaimBonus = async (userId, bonusType) => {
    setClaimingBonus(true);
    try {
      const token = localStorage.getItem('admintoken');
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      
      const response = await axios.post(
        `${base_url}/api/admin/bonus/${bonusType}/claim/${userId}`,
        {
          adminId: adminInfo._id || adminInfo.id || '',
          adminUsername: adminInfo.username || adminInfo.name || ''
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchBonusHistory(); // Refresh history
        setShowClaimModal(false);
        setSelectedUser(null);
      } else {
        toast.error(response.data.message || 'Failed to claim bonus');
      }
    } catch (error) {
      console.error('Error claiming bonus:', error);
      toast.error(error.response?.data?.message || 'Failed to claim bonus');
    } finally {
      setClaimingBonus(false);
    }
  };

  // Get eligible users for preview
  const getEligibleUsers = async (bonusType) => {
    setLoadingBonus(true);
    try {
      const token = localStorage.getItem('admintoken');
      const response = await axios.get(`${base_url}/api/admin/bonus/eligible-users?bonusType=${bonusType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching eligible users:', error);
    } finally {
      setLoadingBonus(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'weekly') {
      getEligibleUsers('weekly');
    } else {
      getEligibleUsers('monthly');
    }
  }, [activeTab]);

  const filteredUsers = getFilteredUsers();
  const bonusRate = activeTab === 'weekly' ? '0.8%' : '0.5%';
  const totalPotentialBonus = filteredUsers.reduce((sum, user) => {
    const betAmount = activeTab === 'weekly' ? (user.weeklybetamount || 0) : (user.monthlybetamount || 0);
    const bonusRateDecimal = activeTab === 'weekly' ? 0.008 : 0.005;
    return sum + (betAmount * bonusRateDecimal);
  }, 0);

  const inputClass = (field) =>
    `w-full bg-[#0F111A] border ${errors[field] ? 'border-rose-500' : 'border-gray-700'} text-gray-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 placeholder-gray-600 transition-colors`;

  const labelClass = 'block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2';

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>

          {/* Page Header */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Weekly & Monthly Bonus</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaAward className="text-amber-500" /> Distribute bonuses based on user betting activity
              </p>
            </div>
            <button
              onClick={() => { fetchUsers(); fetchBonusHistory(); }}
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-[#1F2937] rounded-lg hover:bg-[#374151] transition-colors text-sm"
            >
              <FiRefreshCw className="text-amber-400" /> Refresh
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'weekly'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FaCalendarWeek /> Weekly Bonus (0.8%)
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'monthly'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <MdCalendarMonth  /> Monthly Bonus (0.5%)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Calculate Bonus */}
            <div className="lg:col-span-2 space-y-5">

              {/* Calculate Bonus Section */}
              <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500"></div> 
                    <FaChartLine className="text-amber-500" /> 
                    Calculate {activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Bonus
                  </p>
                </div>

                {activeTab === 'weekly' ? (
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Notes (Optional)</label>
                      <textarea
                        name="notes"
                        value={weeklyFormData.notes}
                        onChange={(e) => setWeeklyFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any notes about this bonus distribution..."
                        rows="2"
                        className={inputClass('notes') + ' resize-none'}
                      />
                    </div>
                    
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <FaPercentage className="text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Weekly Bonus Rate: 0.8%</p>
                          <p className="text-xs text-gray-500">Users receive 0.8% of their weekly bet amount</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center text-xs">
                        <div className="p-2 bg-[#0F111A] rounded">
                          <p className="text-gray-500">Min Bet Amount</p>
                          <p className="text-amber-400 font-bold">Any amount &gt; 0</p>
                        </div>
                        <div className="p-2 bg-[#0F111A] rounded">
                          <p className="text-gray-500">Max Bonus</p>
                          <p className="text-amber-400 font-bold">Unlimited</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleWeeklyBonusCalculate}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <><FaSpinner className="animate-spin" /> Calculating...</> : <><FaGift /> Calculate & Distribute Weekly Bonus</>}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Month</label>
                        <select
                          value={monthlyFormData.month}
                          onChange={(e) => setMonthlyFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                          className={inputClass('month')}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m} - {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Year</label>
                        <select
                          value={monthlyFormData.year}
                          onChange={(e) => setMonthlyFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                          className={inputClass('year')}
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className={labelClass}>Notes (Optional)</label>
                      <textarea
                        name="notes"
                        value={monthlyFormData.notes}
                        onChange={(e) => setMonthlyFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any notes about this bonus distribution..."
                        rows="2"
                        className={inputClass('notes') + ' resize-none'}
                      />
                    </div>
                    
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <FaPercentage className="text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Monthly Bonus Rate: 0.5%</p>
                          <p className="text-xs text-gray-500">Users receive 0.5% of their monthly bet amount</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center text-xs">
                        <div className="p-2 bg-[#0F111A] rounded">
                          <p className="text-gray-500">Min Bet Amount</p>
                          <p className="text-amber-400 font-bold">Any amount &gt; 0</p>
                        </div>
                        <div className="p-2 bg-[#0F111A] rounded">
                          <p className="text-gray-500">Max Bonus</p>
                          <p className="text-amber-400 font-bold">Unlimited</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleMonthlyBonusCalculate}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <><FaSpinner className="animate-spin" /> Calculating...</> : <><FaGift /> Calculate & Distribute Monthly Bonus</>}
                    </button>
                  </div>
                )}
              </div>

              {/* Calculation Results */}
              {calculationResults && (
                <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FaCheckCircle className="text-emerald-400" />
                    <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Distribution Complete</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black">Total Users</p>
                      <p className="text-xl font-bold text-white">{calculationResults.totalUsersProcessed}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black">Credited</p>
                      <p className="text-xl font-bold text-emerald-400">{calculationResults.creditedUsers}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black">Failed</p>
                      <p className="text-xl font-bold text-rose-400">{calculationResults.failedUsers}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black">Total Bonus</p>
                      <p className="text-xl font-bold text-amber-400">৳{calculationResults.totalBonusAmount}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-[10px] text-gray-500">Status: <span className="text-amber-400">{calculationResults.status}</span></p>
                    <p className="text-[10px] text-gray-500 mt-1">Bonus Rate: {calculationResults.bonusRate}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Eligible Users Preview */}
            <div className="space-y-5">
              
              {/* Eligible Users Section */}
              <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500"></div> 
                    <FaUsers className="text-amber-500" /> 
                    Eligible Users ({bonusRate} Bonus)
                  </p>
                </div>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                  <input
                    type="text"
                    placeholder="Search users by username, email, or player ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                
                {/* Summary Stats */}
                <div className="mb-4 p-3 bg-[#0F111A] rounded border border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Eligible Users:</span>
                    <span className="text-lg font-bold text-amber-400">{filteredUsers.length}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Total Potential Bonus:</span>
                    <span className="text-sm font-bold text-emerald-400">৳{totalPotentialBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                {/* Users List */}
                {loadingBonus ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="animate-spin text-amber-500 text-2xl" />
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border border-gray-800 rounded-lg bg-[#0F111A]">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        {searchTerm ? 'No users found matching your search' : 'No eligible users found'}
                      </div>
                    ) : (
                      filteredUsers.map((user) => {
                        const betAmount = activeTab === 'weekly' ? (user.weeklybetamount || 0) : (user.monthlybetamount || 0);
                        const bonusAmount = betAmount * (activeTab === 'weekly' ? 0.008 : 0.005);
                        
                        return (
                          <div
                            key={user._id}
                            className="p-3 border-b border-gray-800 hover:bg-[#1F2937] transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{user.username}</p>
                                <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                                  {user.email && <span>{user.email}</span>}
                                  {user.player_id && <span>{user.player_id}</span>}
                                </div>
                                <div className="flex gap-4 mt-2 text-xs">
                                  <span className="text-gray-500">Bet Amount:</span>
                                  <span className="text-amber-400 font-medium">৳{betAmount.toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] text-gray-500">Bonus</p>
                                <p className="text-sm font-bold text-emerald-400">+৳{bonusAmount.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-[#0F111A] rounded border border-gray-800">
                  <p className="text-[9px] text-gray-500 uppercase font-black">How it works</p>
                  <ul className="text-[10px] text-gray-400 mt-2 space-y-1 list-disc list-inside">
                    <li>Users with bet amount &gt; 0 are eligible</li>
                    <li>Bonus is calculated as {bonusRate} of their {activeTab} bet amount</li>
                    <li>Weekly bet amount resets after bonus calculation</li>
                    <li>Users need to claim the bonus from their dashboard</li>
                    <li>Unclaimed bonuses remain pending in the system</li>
                  </ul>
                </div>
              </div>

              {/* Bonus Info Card */}
              <div className="bg-gradient-to-r from-amber-900/10 to-orange-900/10 border border-amber-500/20 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FaInfoCircle className="text-amber-400" />
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Important Notes</p>
                </div>
                <ul className="text-[10px] text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    Bonus is automatically calculated and credited to user's pending bonus
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    Users must claim the bonus from their dashboard to add to balance
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    Unclaimed bonuses remain in the system until claimed
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    Bonus amount is calculated as {bonusRate} of total bet amount
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bonus History Section */}
          <div className="mt-8">
            <div className="bg-[#161B22] border border-gray-800 rounded-lg">
              <div className="bg-[#1C2128] px-5 py-3 border-b border-gray-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <FaHistory className="text-amber-500" /> Recent Bonus Distribution History
                </p>
              </div>
              <div className="overflow-x-auto p-5">
                {bonusHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No bonus distribution history available
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-[9px] text-gray-500 uppercase tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="text-left py-3 px-2">Date</th>
                        <th className="text-left py-3 px-2">Bonus Type</th>
                        <th className="text-left py-3 px-2">User</th>
                        <th className="text-left py-3 px-2">Bet Amount</th>
                        <th className="text-left py-3 px-2">Bonus Amount</th>
                        <th className="text-left py-3 px-2">Rate</th>
                        <th className="text-left py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bonusHistory.slice(0, 10).map((bonus, idx) => (
                        <tr key={idx} className="border-b border-gray-800/50 hover:bg-[#1F2937] transition-colors">
                          <td className="py-3 px-2 text-[10px] text-gray-400">
                            {new Date(bonus.createdAt || bonus.creditedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                              bonus.bonusType === 'weekly' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {bonus.bonusType}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-xs text-white">{bonus.username || bonus.userId?.username}</td>
                          <td className="py-3 px-2 text-xs text-amber-400">৳{bonus.betAmount?.toLocaleString() || 0}</td>
                          <td className="py-3 px-2 text-xs text-emerald-400">+৳{bonus.bonusAmount?.toLocaleString() || 0}</td>
                          <td className="py-3 px-2 text-[10px] text-gray-400">{bonus.bonusPercentage || (bonus.bonusRate * 100) + '%'}</td>
                          <td className="py-3 px-2">
                            <span className={`text-[9px] font-medium px-2 py-0.5 rounded ${
                              bonus.status === 'claimed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {bonus.status === 'claimed' ? <><FaCheckCircle className="inline mr-1 text-[8px]" /> Claimed</> : <><FaClock className="inline mr-1 text-[8px]" /> Unclaimed</>}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default WeeklyMonthlyBonus;