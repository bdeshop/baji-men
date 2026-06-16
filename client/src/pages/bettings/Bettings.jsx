import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FiSliders, FiClock, FiCalendar, FiTrendingUp, FiTrendingDown, FiDollarSign, FiInfo } from "react-icons/fi";
import { FaFolderOpen, FaSpinner, FaGamepad, FaTrophy, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import axios from "axios";
import { LanguageContext } from "../../context/LanguageContext";

const Bettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("settled");
  const [bettingRecords, setBettingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [dateRange, setDateRange] = useState("last7");

  const { language, t } = useContext(LanguageContext);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const fetchBettingRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/api/user/betting-records/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setBettingRecords(response.data.data);
      }
    } catch (err) {
      setError(t?.failedToFetchBettingRecords || "Failed to fetch betting records");
      console.error("Error fetching betting records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBettingRecords();
  }, []);

  // Filter records based on active tab
  const filteredRecords = bettingRecords.filter(record => {
    if (activeTab === "settled") {
      return record.status === "won" || record.status === "lost";
    } else {
      return record.status === "pending";
    }
  });

  // Get statistics
  const getStatistics = () => {
    const totalBets = filteredRecords.length;
    const totalBetAmount = filteredRecords.reduce((sum, r) => sum + r.bet_amount, 0);
    const totalWinAmount = filteredRecords.reduce((sum, r) => sum + r.win_amount, 0);
    const totalNetAmount = filteredRecords.reduce((sum, r) => sum + r.net_amount, 0);
    const winCount = filteredRecords.filter(r => r.status === "won").length;
    const winRate = totalBets > 0 ? (winCount / totalBets) * 100 : 0;

    return { totalBets, totalBetAmount, totalWinAmount, totalNetAmount, winCount, winRate };
  };

  const stats = getStatistics();

  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    if (language.code === 'bn') {
      return new Date(dateString).toLocaleDateString('bn-BD', options);
    }
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format currency
  const formatCurrency = (amount, currency = "BDT") => {
    return new Intl.NumberFormat(language.code === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get status badge style and text
  const getStatusBadge = (status) => {
    const statusStyles = {
      won: "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      lost: "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-rose-400 border border-red-500/30",
      pending: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-amber-400 border border-yellow-500/30"
    };
    
    const statusIcons = {
      won: <FaTrophy className="inline mr-1 text-emerald-400" size={12} />,
      lost: <FaTimesCircle className="inline mr-1 text-rose-400" size={12} />,
      pending: <FaHourglassHalf className="inline mr-1 text-amber-400" size={12} />
    };
    
    const statusText = {
      won: t?.won || "WON",
      lost: t?.lost || "LOST",
      pending: t?.pending || "PENDING"
    };
    
    return {
      className: `px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-500/20 text-gray-400'}`,
      text: statusText[status] || status.toUpperCase(),
      icon: statusIcons[status] || null
    };
  };

  const getTranslatedGameType = (type) => {
    const typeMap = {
      cricket: t?.cricket || "Cricket",
      football: t?.football || "Football",
      tennis: t?.tennis || "Tennis",
      basketball: t?.basketball || "Basketball",
      casino: t?.casino || "Casino",
      slots: t?.slots || "Slots",
      crash: t?.crash || "Crash",
      table: t?.table || "Table",
      fishing: t?.fishing || "Fishing",
      arcade: t?.arcade || "Arcade",
      lottery: t?.lottery || "Lottery",
      aviator: "Aviator"
    };
    return typeMap[type] || type;
  };

  const getGameIcon = (type) => {
    const iconMap = {
      aviator: "✈️",
      cricket: "🏏",
      football: "⚽",
      tennis: "🎾",
      basketball: "🏀",
      casino: "🎰",
      slots: "🎰",
      crash: "📈",
      table: "🎲",
      fishing: "🎣",
      arcade: "🕹️",
      lottery: "🎯"
    };
    return iconMap[type] || "🎮";
  };

  return (
    <div className="h-screen overflow-hidden font-poppins bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className="w-full overflow-y-auto">
          <div className="mx-auto w-full min-h-screen max-w-screen-xl md:px-6 py-6 px-3">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {t?.bettingRecords || "Betting Records"}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {t?.trackYourBets || "Track and manage all your betting activities"}
                </p>
              </div>
              <button 
                onClick={fetchBettingRecords}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-600/20 text-sm font-medium"
              >
                <IoMdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
                {t?.refresh || "Refresh"}
              </button>
            </div>

            {/* Statistics Cards */}
            {!loading && !error && filteredRecords.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider">{t?.totalBets || "Total Bets"}</p>
                      <p className="text-xl font-bold mt-1">{stats.totalBets}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <FiDollarSign className="text-blue-400" size={20} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider">{t?.totalBetAmount || "Total Bet"}</p>
                      <p className="text-xl font-bold mt-1">{formatCurrency(stats.totalBetAmount)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <FiTrendingUp className="text-purple-400" size={20} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider">{t?.totalWins || "Total Wins"}</p>
                      <p className="text-xl font-bold mt-1 text-emerald-400">{formatCurrency(stats.totalWinAmount)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <FaTrophy className="text-emerald-400" size={20} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider">{t?.winRate || "Win Rate"}</p>
                      <p className={`text-xl font-bold mt-1 ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stats.winRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <FiTrendingUp className="text-amber-400" size={20} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-700/50">
                <button
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === "settled"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                  onClick={() => setActiveTab("settled")}
                >
                  {t?.settled || "Settled"}
                </button>
                <button
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === "unsettled"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                  onClick={() => setActiveTab("unsettled")}
                >
                  {t?.unsettled || "Unsettled"}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all duration-300 text-sm">
                  <FiCalendar className="text-gray-400" />
                  <span className="text-gray-300">{t?.last7Days || "Last 7 days"}</span>
                </button>
                <button className="p-2 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all duration-300">
                  <FiSliders className="text-gray-400 hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  <FaSpinner className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400 text-2xl animate-pulse" />
                </div>
                <p className="text-gray-400 mt-6">{t?.loadingBettingRecords || "Loading betting records..."}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <FiInfo className="text-red-400 text-4xl" />
                </div>
                <p className="text-gray-400 max-w-md">{error}</p>
                <button 
                  onClick={fetchBettingRecords}
                  className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-600/20"
                >
                  {t?.retry || "Retry"}
                </button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 border border-gray-700/50">
                  <FaFolderOpen className="text-4xl text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {activeTab === "settled" 
                    ? (t?.noSettledRecords || "No settled records found")
                    : (t?.noUnsettledRecords || "No unsettled records found")}
                </h3>
                <p className="text-gray-500 text-sm">
                  {t?.startPlayingToSeeRecords || "Start playing to see your betting records here"}
                </p>
              </div>
            ) : (
              // Data Table
              <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 shadow-xl">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50 bg-gray-800/30">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t?.game || "Game"}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t?.betAmount || "Bet Amount"}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t?.winAmount || "Win Amount"}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t?.netAmount || "Net Amount"}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t?.status || "Status"}</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t?.dateTime || "Date & Time"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                      {filteredRecords.map((record, index) => {
                        const statusBadge = getStatusBadge(record.status);
                        const isWin = record.status === "won";
                        return (
                          <tr key={record._id || index} className="hover:bg-white/5 transition-colors duration-300 group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xl">
                                  {getGameIcon(record.game_type)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-200">
                                    {getTranslatedGameType(record.game_type)}
                                  </div>
                                  <div className="text-xs text-gray-500">{record.game_uid?.substring(0, 8) || "N/A"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {formatCurrency(record.bet_amount, record.currency_code)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`${record.win_amount > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                {formatCurrency(record.win_amount, record.currency_code)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`font-semibold ${record.net_amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {record.net_amount >= 0 ? '+' : ''}{formatCurrency(record.net_amount, record.currency_code)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={statusBadge.className}>
                                {statusBadge.icon}
                                {statusBadge.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              <div className="flex items-center gap-2">
                                <FiClock size={14} className="text-gray-600" />
                                {formatDate(record.transaction_time)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden">
                  {filteredRecords.map((record, index) => {
                    const statusBadge = getStatusBadge(record.status);
                    return (
                      <div key={record._id || index} className="border-b border-gray-700/30 p-4 last:border-b-0 hover:bg-white/5 transition-colors duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                            {getGameIcon(record.game_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-200">
                                {getTranslatedGameType(record.game_type)}
                              </div>
                              <span className={statusBadge.className}>
                                {statusBadge.icon}
                                {statusBadge.text}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{record.game_uid?.substring(0, 10) || "N/A"}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-800/30 rounded-lg p-3">
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t?.betAmount || "Bet"}</div>
                            <div className="font-medium">{formatCurrency(record.bet_amount, record.currency_code)}</div>
                          </div>
                          <div className="bg-gray-800/30 rounded-lg p-3">
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t?.winAmount || "Win"}</div>
                            <div className={`font-medium ${record.win_amount > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                              {formatCurrency(record.win_amount, record.currency_code)}
                            </div>
                          </div>
                          <div className="bg-gray-800/30 rounded-lg p-3">
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t?.netAmount || "Net"}</div>
                            <div className={`font-medium ${record.net_amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {record.net_amount >= 0 ? '+' : ''}{formatCurrency(record.net_amount, record.currency_code)}
                            </div>
                          </div>
                          <div className="bg-gray-800/30 rounded-lg p-3">
                            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t?.platform || "Platform"}</div>
                            <div className="font-medium capitalize text-gray-300">{record.platform || "N/A"}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <FiClock size={14} />
                          {formatDate(record.transaction_time)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Bettings;