import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { 
  FaUsers, 
  FaMoneyCheckAlt, 
  FaClock, 
  FaChartLine,
  FaHourglassHalf,
  FaUserTie,
  FaCalendarAlt
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { FiRefreshCw, FiTrendingUp, FiTrendingDown, FiChevronDown } from "react-icons/fi";
import { MdAccountBalanceWallet, MdTrendingUp } from "react-icons/md";
import axios from "axios";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Get Bangladesh time
  const getBangladeshTime = () => {
    const now = new Date();
    // Bangladesh is UTC+6
    const bangladeshTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
    return bangladeshTime;
  };

  // Format date to Bangladesh time string
  const formatBangladeshDate = (date) => {
    return date.toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${base_url}/api/admin/dashboard`);
      console.log('Dashboard API Response:', response.data);
      setDashboardData(response.data || {});
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashboardData({});
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely extract data with defaults
  const getData = (path, defaultValue = 0) => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return defaultValue;
    
    const paths = path.split('.');
    let value = dashboardData;
    
    for (const p of paths) {
      if (value && typeof value === 'object' && p in value) {
        value = value[p];
      } else {
        return defaultValue;
      }
    }
    
    return value !== null && value !== undefined ? value : defaultValue;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Prepare dashboard statistics (always return values, even if loading)
  const stats = {
    // User Statistics
    totalUsers: getData('data.users.totalUsers', 0),
    activeUsers: getData('data.users.activeUsers', 0),
    totalUserBalance: getData('data.users.totalBalance', 0),
    totalBonusBalance: getData('data.users.totalBonusBalance', 0),
    
    // Financial Statistics
    totalDeposits: getData('data.financial.totalDeposits', 0),
    totalWithdrawals: getData('data.financial.totalWithdrawals', 0),
    userTotalDeposit: getData('data.financial.userTotalDeposit', 0),
    userTotalWithdraw: getData('data.financial.userTotalWithdraw', 0),
    userTotalBet: getData('data.financial.userTotalBet', 0),
    userTotalWins: getData('data.financial.userTotalWins', 0),
    userTotalLoss: getData('data.financial.userTotalLoss', 0),
    userNetProfit: getData('data.financial.userNetProfit', 0),
    lifetimeDeposit: getData('data.financial.lifetimeDeposit', 0),
    lifetimeWithdraw: getData('data.financial.lifetimeWithdraw', 0),
    lifetimeBet: getData('data.financial.lifetimeBet', 0),
    
    // Pending Approvals
    pendingDeposits: getData('data.pendingApprovals.deposits', 0),
    pendingWithdrawals: getData('data.pendingApprovals.withdrawals', 0),
    
    // Gaming Statistics
    totalBetAmount: getData('data.gaming.totalBetAmount', 0),
    totalWinAmount: getData('data.gaming.totalWinAmount', 0),
    totalNetProfit: getData('data.gaming.totalNetProfit', 0),
    bettingTotalBetAmount: getData('data.gaming.bettingTotalBetAmount', 0),
    bettingTotalWinAmount: getData('data.gaming.bettingTotalWinAmount', 0),
    bettingTotalProfitLoss: getData('data.gaming.bettingTotalProfitLoss', 0),
    
    // Affiliate Statistics
    affiliatePendingEarnings: getData('data.affiliate.totalPendingEarnings', 0),
    affiliatePaidEarnings: getData('data.affiliate.totalPaidEarnings', 0),
    affiliateTotalEarnings: getData('data.affiliate.totalEarnings', 0),
    
    // Bonus Statistics
    totalBonusGiven: getData('data.bonus.totalBonusGiven', 0),
    totalBonusWagered: getData('data.bonus.totalBonusWagered', 0),
    
    // Today's Statistics
    todayDeposits: getData('data.today.deposits', 0),
    todayWithdrawals: getData('data.today.withdrawals', 0),
    todayTotalBet: getData('data.today.betting.totalBet', 0),
    todayTotalWin: getData('data.today.betting.totalWin', 0),
    
    // Monthly Statistics
    monthlyDeposits: getData('data.monthly.deposits', 0),
    monthlyWithdrawals: getData('data.monthly.withdrawals', 0),
    
    // Recent Activities
    recentUsers: getData('recentActivities.users', []),
    recentDeposits: getData('recentActivities.deposits', [])
  };

  // Professional color palette
  const gradientColors = [
    'from-blue-600 to-blue-800',
    'from-green-600 to-green-800',
    'from-orange-600 to-orange-800',
    'from-purple-600 to-purple-800',
    'from-teal-600 to-teal-800',
    'from-red-600 to-red-800',
    'from-indigo-600 to-indigo-800',
    'from-cyan-600 to-cyan-800',
    'from-rose-600 to-rose-800',
    'from-amber-600 to-amber-800'
  ];

  // Status cards data
  const statusCards = [
    {
      title: 'Total Users',
      value: formatCurrency(stats.totalUsers),
      icon: <FaUsers className="text-3xl text-white" />,
      description: `${stats.activeUsers} active users`,
      gradient: gradientColors[0],
      prefix: ''
    },
    {
      title: 'Platform Balance',
      value: `৳${formatCurrency(stats.totalUserBalance)}`,
      icon: <MdAccountBalanceWallet className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.totalBonusBalance)} bonus balance`,
      gradient: gradientColors[1],
      prefix: '৳'
    },
    {
      title: 'Total Deposits',
      value: `৳${formatCurrency(stats.totalDeposits)}`,
      icon: <FaMoneyCheckAlt className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.todayDeposits)} today`,
      gradient: gradientColors[2],
      prefix: '৳'
    },
    {
      title: 'Total Withdrawals',
      value: `৳${formatCurrency(stats.totalWithdrawals)}`,
      icon: <FaBangladeshiTakaSign className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.todayWithdrawals)} today`,
      gradient: gradientColors[3],
      prefix: '৳'
    },
    {
      title: 'Total Bets',
      value: `৳${formatCurrency(stats.totalBetAmount)}`,
      icon: <FaChartLine className="text-3xl text-white" />,
      description: `Net: ৳${formatCurrency(stats.totalNetProfit)}`,
      gradient: gradientColors[4],
      prefix: '৳'
    },
    {
      title: 'Pending Deposits',
      value: `৳${formatCurrency(stats.pendingDeposits)}`,
      icon: <FaHourglassHalf className="text-3xl text-white" />,
      description: 'Requires approval',
      gradient: gradientColors[5],
      prefix: '৳'
    },
    {
      title: 'Pending Withdrawals',
      value: `৳${formatCurrency(stats.pendingWithdrawals)}`,
      icon: <FaClock className="text-3xl text-white" />,
      description: 'Awaiting processing',
      gradient: gradientColors[6],
      prefix: '৳'
    },
    {
      title: 'Affiliate Earnings',
      value: `৳${formatCurrency(stats.affiliateTotalEarnings)}`,
      icon: <FaUserTie className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.affiliatePendingEarnings)} pending`,
      gradient: gradientColors[7],
      prefix: '৳'
    },
    {
      title: 'Total Bonus Given',
      value: `৳${formatCurrency(stats.totalBonusGiven)}`,
      icon: <MdTrendingUp className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.totalBonusWagered)} wagered`,
      gradient: gradientColors[8],
      prefix: '৳'
    },
    {
      title: 'Monthly Deposits',
      value: `৳${formatCurrency(stats.monthlyDeposits)}`,
      icon: <MdTrendingUp className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.monthlyWithdrawals)} withdrawals`,
      gradient: gradientColors[9],
      prefix: '৳'
    }
  ];

  // Financial overview data for chart
  const financialChartData = [
    { name: 'Deposits', amount: stats.totalDeposits, color: '#3B82F6' },
    { name: 'Withdrawals', amount: stats.totalWithdrawals, color: '#10B981' },
    { name: 'Bets', amount: stats.totalBetAmount, color: '#F59E0B' },
    { name: 'Wins', amount: stats.totalWinAmount, color: '#8B5CF6' },
    { name: 'User Balance', amount: stats.totalUserBalance, color: '#EF4444' },
    { name: 'Bonus Balance', amount: stats.totalBonusBalance, color: '#6EE7B7' }
  ];

  // Daily performance data (Bangladesh time)
  const generateDailyPerformanceData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = getBangladeshTime();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Generate data for last 7 days
    return days.map((day, index) => {
      const dayIndex = (currentDay + 6 - index) % 7; // Get days in reverse order
      return {
        day: days[dayIndex],
        deposits: Math.floor(Math.random() * 50000) + 20000,
        withdrawals: Math.floor(Math.random() * 30000) + 10000,
        bets: Math.floor(Math.random() * 70000) + 30000
      };
    }).reverse(); // Reverse to show chronological order
  };

  const dailyPerformanceData = generateDailyPerformanceData();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-100">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ৳{formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Financial summary items
  const financialSummaryItems = [
    { label: 'Total User Deposits', value: stats.userTotalDeposit },
    { label: 'Total User Withdrawals', value: stats.userTotalWithdraw },
    { label: 'Total User Bets', value: stats.userTotalBet },
    { label: 'Total User Wins', value: stats.userTotalWins },
    { label: 'Total User Loss', value: stats.userTotalLoss },
    { label: 'Net Profit/Loss', value: stats.userNetProfit }
  ];

  return (
    <section className="font-nunito min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-2">
                  Bangladesh Time: {formatBangladeshDate(getBangladeshTime())}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Always visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
            {statusCards.map((card, index) => (
              <div
                key={index}
                className={`relative bg-gradient-to-r ${card.gradient} rounded-lg p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 min-h-[140px] flex flex-col`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold uppercase tracking-wide opacity-90">{card.title}</p>
                    <h2 className="text-2xl font-bold mt-1 truncate">{card.value}</h2>
                  </div>
                  <div className="p-3 border-[1px] border-gray-200 text-white bg-opacity-20 rounded-full flex-shrink-0">
                    {card.icon}
                  </div>
                </div>
                <div className="flex items-center mt-auto text-sm opacity-90">
                  {card.trend === 'up' ? (
                    <FiTrendingUp className="mr-1 text-green-300" />
                  ) : card.trend === 'down' ? (
                    <FiTrendingDown className="mr-1 text-red-300" />
                  ) : null}
                  <span className="truncate">{card.description}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Overview Chart */}
          <div className="bg-white rounded-xl p-8 border-[1px] border-gray-200 mb-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Financial Overview</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={financialChartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      stroke="#6B7280"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      fontSize={12}
                      tickFormatter={(value) => `৳${formatCurrency(value)}`}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                    />
                    <Legend />
                    <Bar 
                      dataKey="amount" 
                      name="Amount (৳)" 
                      radius={[6, 6, 0, 0]}
                    >
                      {financialChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border-[1px] border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {financialSummaryItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm text-gray-600 truncate">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap ml-2">
                        ৳{formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Performance */}
          <div className="bg-white rounded-xl p-8 border-[1px] border-gray-200 mb-10">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Daily Performance (Last 7 Days - BD Time)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={dailyPerformanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => `৳${formatCurrency(value)}`}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                <Legend />
                <Bar 
                  dataKey="deposits" 
                  name="Deposits" 
                  fill="#3B82F6" 
                  radius={[6, 6, 0, 0]} 
                />
                <Bar 
                  dataKey="withdrawals" 
                  name="Withdrawals" 
                  fill="#10B981" 
                  radius={[6, 6, 0, 0]} 
                />
                <Bar 
                  dataKey="bets" 
                  name="Bets" 
                  fill="#F59E0B" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Users */}
            <div className="bg-white rounded-xl p-8 border-[1px] border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Users</h3>
              <div className="space-y-4">
                {stats.recentUsers.length > 0 ? (
                  stats.recentUsers.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <FaUsers className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.username || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{user.player_id || 'N/A'}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {user.createdAt ? formatBangladeshDate(new Date(user.createdAt)) : 'N/A'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent user data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Deposits */}
            <div className="bg-white rounded-xl p-8 border-[1px] border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Deposits</h3>
              <div className="space-y-4">
                {stats.recentDeposits.length > 0 ? (
                  stats.recentDeposits.slice(0, 5).map((deposit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">
                          {deposit.userId?.username || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {deposit.method || 'N/A'} • {deposit.status || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">৳{formatCurrency(deposit.amount || 0)}</p>
                        <p className="text-sm text-gray-500">
                          {deposit.createdAt ? formatBangladeshDate(new Date(deposit.createdAt)) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent deposit data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Dashboard;