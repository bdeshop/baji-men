import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FiChevronDown, FiBell, FiExternalLink, FiClock, FiGift, FiCheckCircle, FiXCircle, FiAlertCircle, FiCalendar } from "react-icons/fi";
import { FaMoneyBillWave, FaCalendarAlt, FaTag, FaInfoCircle, FaCalendarWeek, FaChartLine } from "react-icons/fa";
import { MdCalendarMonth } from "react-icons/md";
import axios from "axios";
import logo from "../../assets/logo.png";
import { LanguageContext } from "../../context/LanguageContext";
import toast, { Toaster } from 'react-hot-toast';

const Bonus = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [bonuses, setBonuses] = useState([]);
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalBonusAmount: 0,
    expiringSoon: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingBonusId, setClaimingBonusId] = useState(null);
  const [claimingBettingBonusId, setClaimingBettingBonusId] = useState(null);
  const [bettingBonuses, setBettingBonuses] = useState([]);
  const [bettingStats, setBettingStats] = useState({
    totalUnclaimed: 0,
    totalBonusAmount: 0,
    totalBetAmount: 0
  });
  const [loadingBetting, setLoadingBetting] = useState(true);
  
  // Get language context
  const { language, t } = useContext(LanguageContext);
  
  // Get user and token from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('usertoken');
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Fetch available cash bonuses
  const fetchBonuses = async () => {
    try {
      if (!token) {
        setError(t?.pleaseLoginToViewBonuses || "Please login to view bonuses");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${base_url}/api/user/cash-bonus/available`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Bonuses response:", response.data);
      
      if (response.data.success) {
        setBonuses(response.data.data.bonuses || []);
        setStats(response.data.data.stats || {
          totalAvailable: 0,
          totalBonusAmount: 0,
          expiringSoon: 0
        });
      } else {
        setError(response.data.message || (t?.failedToFetchBonuses || "Failed to fetch bonuses"));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || (t?.failedToFetchBonuses || "Failed to fetch bonuses");
      setError(errorMessage);
      console.error("Error fetching bonuses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available betting bonuses (weekly & monthly)
  const fetchBettingBonuses = async () => {
    try {
      if (!token) {
        setLoadingBetting(false);
        return;
      }
      
      setLoadingBetting(true);
      
      const response = await axios.get(`${base_url}/api/user/betting-bonus/unclaimed`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Betting bonuses response:", response.data);
      
      if (response.data.success) {
        setBettingBonuses(response.data.data.bonuses || []);
        setBettingStats(response.data.data.stats || {
          totalUnclaimed: 0,
          totalBonusAmount: 0,
          totalBetAmount: 0
        });
      }
    } catch (err) {
      console.error("Error fetching betting bonuses:", err);
    } finally {
      setLoadingBetting(false);
    }
  };

  // Claim a cash bonus directly
  const claimBonus = async (bonusId, bonusTitle, bonusAmount) => {
    setClaimingBonusId(bonusId);
    try {
      const response = await axios.post(
        `${base_url}/api/user/cash-bonus/claim/${bonusId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Bonus claimed successfully!");
        await fetchBonuses();
        // Update user balance in localStorage
        if (response.data.data.balanceAfter) {
          const updatedUser = { ...user, balance: response.data.data.balanceAfter };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        toast.error(response.data.message || "Failed to claim bonus");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to claim bonus";
      toast.error(errorMessage);
      console.error("Error claiming bonus:", err);
    } finally {
      setClaimingBonusId(null);
    }
  };

  // Claim a betting bonus (weekly/monthly)
  const claimBettingBonus = async (bonusId, bonusType, bonusAmount) => {
    setClaimingBettingBonusId(bonusId);
    try {
      const response = await axios.post(
        `${base_url}/api/user/betting-bonus/claim/${bonusId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || `${bonusType.charAt(0).toUpperCase() + bonusType.slice(1)} bonus claimed successfully!`);
        await fetchBettingBonuses();
        await fetchBonuses(); // Refresh cash bonuses as balance changed
        // Update user balance in localStorage
        if (response.data.data.balanceAfter) {
          const updatedUser = { ...user, balance: response.data.data.balanceAfter };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        toast.error(response.data.message || "Failed to claim bonus");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to claim bonus";
      toast.error(errorMessage);
      console.error("Error claiming betting bonus:", err);
    } finally {
      setClaimingBettingBonusId(null);
    }
  };

  // Toggle dropdown
  const toggleDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Load bonuses on component mount
  useEffect(() => {
    if (token) {
      fetchBonuses();
      fetchBettingBonuses();
    } else {
      setLoading(false);
      setLoadingBetting(false);
      setError(t?.pleaseLoginToViewBonuses || "Please login to view bonuses");
    }
  }, [token]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return t?.noExpiry || "No expiry";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return (t?.todayAt || 'Today at') + ' ' + date.toLocaleTimeString(language?.code === 'bn' ? 'bn-BD' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return date.toLocaleDateString(language?.code === 'bn' ? 'bn-BD' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (error) {
      return t?.invalidDate || "Invalid date";
    }
  };

  // Get days left until expiry
  const getDaysLeft = (expiresAt, noExpiry) => {
    if (noExpiry) return null;
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 0;
    return diffDays;
  };

  // Get days left for betting bonus (3 days validity)
  const getBettingDaysLeft = (distributionDate) => {
    if (!distributionDate) return null;
    
    const now = new Date();
    const expiryDate = new Date(distributionDate);
    expiryDate.setDate(expiryDate.getDate() + 3); // 3 days validity
    
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 0;
    return diffDays;
  };

  // Get urgency class based on days left
  const getUrgencyClass = (daysLeft) => {
    if (daysLeft === null) return "text-gray-400";
    if (daysLeft <= 1) return "text-red-400";
    if (daysLeft <= 3) return "text-yellow-400";
    if (daysLeft <= 7) return "text-orange-400";
    return "text-green-400";
  };

  // Get bonus type display name
  const getBonusTypeName = (type) => {
    const types = {
      special_event: "Special Event",
      welcome_bonus: "Welcome Bonus",
      loyalty_reward: "Loyalty Reward",
      compensation: "Compensation",
      promotional: "Promotional",
      referral: "Referral",
      achievement: "Achievement"
    };
    return types[type] || type?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "Bonus";
  };

  // Get bonus type icon
  const getBonusTypeIcon = (type) => {
    const icons = {
      special_event: "🎉",
      welcome_bonus: "👋",
      loyalty_reward: "🏆",
      compensation: "🤝",
      promotional: "📢",
      referral: "🔗",
      achievement: "⭐"
    };
    return icons[type] || "🎁";
  };

  // Get betting bonus icon
  const getBettingBonusIcon = (type) => {
    return type === 'weekly' ? <FaCalendarWeek className="text-blue-400" /> : <MdCalendarMonth className="text-purple-400" />;
  };

  // Get betting bonus display name
  const getBettingBonusName = (type) => {
    return type === 'weekly' ? "Weekly Betting Bonus" : "Monthly Betting Bonus";
  };

  const isLoading = loading || loadingBetting;

  // Check if there are no bonuses at all
  const hasNoBonuses = bonuses.length === 0 && bettingBonuses.length === 0 && !isLoading && token;

  if (isLoading && bonuses.length === 0 && bettingBonuses.length === 0) {
    return (
      <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)]">
          <Sidebar sidebarOpen={sidebarOpen} />
          <div className="w-full overflow-y-auto flex items-center justify-center">
            <div className='w-full p-[20px] flex justify-center items-center'>
              <div className="relative w-24 h-24 flex justify-center items-center">
                <div className="absolute w-full h-full rounded-full border-4 border-transparent border-t-green-500 border-r-green-500 animate-spin"></div>
                <div className="w-20 h-20 rounded-full flex justify-center items-center font-bold text-lg">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden w-full font-poppins bg-[#0f0f0f] text-white">
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: '#1a1a1a', 
            color: '#fff', 
            border: '1px solid #333' 
          },
          duration: 3000
        }} 
      />
      
      {/* Header */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)] w-full">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className="flex-1 overflow-auto w-full transition-all duration-300">
          {/* Main Content Area */}
          <div className="mx-auto overflow-y-auto pb-[100px] w-full max-w-screen-xl px-4 md:px-[50px] py-6">
            {/* Header Section */}
            <div className="flex flex-col pt-[25px] lg:pt-[50px] sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div>
                <h1 className="text-[18px] md:text-xl sm:text-[22px] font-[600] text-white flex items-center gap-2">
                  <FiGift className="text-yellow-500" />
                  {t?.availableBonuses || "Available Bonuses"}
                </h1>
                <p className="text-gray-400 text-xs mt-1">
                  {t?.claimCashBonuses || "Claim cash bonuses and betting rewards directly to your account"}
                </p>
              </div>
            </div>

            {!token ? (
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-lg p-4 sm:p-6 text-center max-w-sm sm:max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#222] mb-3 sm:mb-4">
                  <FiBell className="text-lg sm:text-xl text-gray-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">{t?.authenticationRequired || "Authentication Required"}</h3>
                <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">{t?.pleaseLoginToViewBonuses || "Please log in to view and claim your bonuses"}</p>
                <a 
                  href="/login" 
                  className="inline-block px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 text-xs sm:text-sm"
                >
                  {t?.signIn || "Sign In"}
                </a>
              </div>
            ) : (
              <>
                {/* Show No Bonus Message when both are empty */}
                {hasNoBonuses ? (
                  <div className=" rounded-lg p-6 sm:p-10 text-center max-w-md mx-auto">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#222] mb-4">
                      <FiGift className="text-2xl sm:text-3xl text-gray-500" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium mb-2 text-gray-300">
                      {t?.noBonusesAvailable || "No Bonuses Available"}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {t?.noBonusesMessage || "You don't have any bonuses available at the moment. Check back later for new offers and rewards!"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Cash Bonuses Section */}
                    <div className="mb-8">
                      {bonuses.length === 0 ? (
                        <></>
                      ) : (
                        <>
                          {/* Cash Bonuses List */}
                          <div className="space-y-3 sm:space-y-4">
                            {bonuses.map((bonus) => {
                              const daysLeft = getDaysLeft(bonus.expiresAt, bonus.noExpiry);
                              const urgencyClass = getUrgencyClass(daysLeft);
                              const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                              
                              return (
                                <div 
                                  key={bonus.id} 
                                  className={`bg-gradient-to-br from-[#1a1a1a] to-[#151515] border ${isExpiringSoon ? 'border-yellow-500/30' : 'border-[#2a2a2a]'} rounded-lg overflow-hidden transition-all hover:border-[#3a3a3a] hover:shadow-md`}
                                >
                                  <div 
                                    className="p-3 sm:p-4 cursor-pointer"
                                    onClick={() => toggleDropdown(bonus.id)}
                                  >
                                    <div className="flex items-start">
                                      {/* Bonus Icon */}
                                      <div className="flex-shrink-0 mr-3">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                          <span className="text-xl sm:text-2xl">{getBonusTypeIcon(bonus.bonusType)}</span>
                                        </div>
                                      </div>
                                      
                                      {/* Bonus Info */}
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                          <div>
                                            <h2 className="text-sm sm:text-base font-[600] text-white">{bonus.title}</h2>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                              <span className="text-xs text-yellow-400 flex items-center gap-1">
                                                ৳{bonus.amount.toLocaleString()}
                                              </span>
                                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <FaTag className="text-[10px]" />
                                                {getBonusTypeName(bonus.bonusType)}
                                              </span>
                                              {!bonus.noExpiry && bonus.expiresAt && (
                                                <span className={`text-xs flex items-center gap-1 ${urgencyClass}`}>
                                                  <FiClock className="text-[10px]" />
                                                  {daysLeft === 0 ? (t?.expired || "Expired") : daysLeft === 1 ? (t?.expiresToday || "Expires today") : `${daysLeft} ${t?.daysLeft || "days left"}`}
                                                </span>
                                              )}
                                              {bonus.noExpiry && (
                                                <span className="text-xs text-green-400 flex items-center gap-1">
                                                  <FiClock className="text-[10px]" />
                                                  {t?.neverExpires || "Never expires"}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                claimBonus(bonus.id, bonus.title, bonus.amount);
                                              }}
                                              disabled={claimingBonusId === bonus.id}
                                              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              {claimingBonusId === bonus.id ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                              ) : (
                                                t?.claimNow || "Claim Now"
                                              )}
                                            </button>
                                            <FiChevronDown
                                              className={`text-gray-500 text-base sm:text-lg transition-transform duration-300 ${
                                                openDropdowns[bonus.id] ? "rotate-180" : ""
                                              }`}
                                            />
                                          </div>
                                        </div>
                                        
                                        <p className="text-gray-400 mt-2 text-xs sm:text-sm">
                                          {bonus.description}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Expanded Details */}
                                    {openDropdowns[bonus.id] && (
                                      <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t?.bonusDetails || "Bonus Details"}</p>
                                            <ul className="space-y-1 text-xs">
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">{t?.amount || "Amount"}:</span>
                                                <span className="text-yellow-400 font-medium">৳{bonus.amount.toLocaleString()}</span>
                                              </li>
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">{t?.type || "Type"}:</span>
                                                <span>{getBonusTypeName(bonus.bonusType)}</span>
                                              </li>
                                              {bonus.occasion && (
                                                <li className="flex justify-between">
                                                  <span className="text-gray-400">{t?.occasion || "Occasion"}:</span>
                                                  <span>{bonus.occasion}</span>
                                                </li>
                                              )}
                                            </ul>
                                          </div>
                                          <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t?.validity || "Validity"}</p>
                                            <ul className="space-y-1 text-xs">
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">{t?.created || "Created"}:</span>
                                                <span>{formatDate(bonus.createdAt)}</span>
                                              </li>
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">{t?.expires || "Expires"}:</span>
                                                <span className={urgencyClass}>
                                                  {bonus.noExpiry ? (t?.never || "Never") : formatDate(bonus.expiresAt)}
                                                </span>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Betting Bonuses Section */}
                    <div>
                      {bettingBonuses.length === 0 ? (
                        <></>
                      ) : (
                        <>
                          {/* Betting Bonuses List */}
                          <div className="space-y-3 sm:space-y-4">
                            {bettingBonuses.map((bonus) => {
                              const daysLeft = getBettingDaysLeft(bonus.distributionDate);
                              const urgencyClass = getUrgencyClass(daysLeft);
                              const isExpiringSoon = daysLeft !== null && daysLeft <= 2 && daysLeft > 0;
                              
                              return (
                                <div 
                                  key={bonus.id} 
                                  className={`bg-gradient-to-br from-[#1a1a1a] to-[#151515] border ${isExpiringSoon ? 'border-red-500/30' : 'border-[#2a2a2a]'} rounded-lg overflow-hidden transition-all hover:border-[#3a3a3a] hover:shadow-md`}
                                >
                                  <div 
                                    className="p-3 sm:p-4 cursor-pointer"
                                    onClick={() => toggleDropdown(`betting-${bonus.id}`)}
                                  >
                                    <div className="flex items-start">
                                      {/* Bonus Icon */}
                                      <div className="flex-shrink-0 mr-3">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                                          bonus.bonusType === 'weekly' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                                        }`}>
                                          {bonus.bonusType === 'weekly' ? (
                                            <FaCalendarWeek className="text-blue-400 text-xl sm:text-2xl" />
                                          ) : (
                                            <MdCalendarMonth className="text-purple-400 text-xl sm:text-2xl" />
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Bonus Info */}
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                          <div>
                                            <h2 className="text-sm sm:text-base font-[600] text-white">
                                              {getBettingBonusName(bonus.bonusType)}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                              <span className="text-xs text-yellow-400 flex items-center gap-1">
                                                ৳{bonus.amount.toLocaleString()}
                                              </span>
                                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <FaChartLine className="text-[10px]" />
                                                {bonus.bonusRate} of ৳{bonus.betAmount.toLocaleString()}
                                              </span>
                                              <span className={`text-xs flex items-center gap-1 ${urgencyClass}`}>
                                                <FiClock className="text-[10px]" />
                                                {daysLeft === 0 ? "Expired" : daysLeft === 1 ? "Expires today" : `${daysLeft} days left`}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                claimBettingBonus(bonus.id, bonus.bonusType, bonus.amount);
                                              }}
                                              disabled={claimingBettingBonusId === bonus.id}
                                              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              {claimingBettingBonusId === bonus.id ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                              ) : (
                                                "Claim Now"
                                              )}
                                            </button>
                                            <FiChevronDown
                                              className={`text-gray-500 text-base sm:text-lg transition-transform duration-300 ${
                                                openDropdowns[`betting-${bonus.id}`] ? "rotate-180" : ""
                                              }`}
                                            />
                                          </div>
                                        </div>
                                        
                                        <p className="text-gray-400 mt-2 text-xs sm:text-sm">
                                          {bonus.bonusType === 'weekly' 
                                            ? `You earned this bonus from your weekly betting activity. Based on your bet amount of ৳${bonus.betAmount.toLocaleString()}, you receive 0.8% as bonus.`
                                            : `You earned this bonus from your monthly betting activity. Based on your bet amount of ৳${bonus.betAmount.toLocaleString()}, you receive 0.5% as bonus.`
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Expanded Details */}
                                    {openDropdowns[`betting-${bonus.id}`] && (
                                      <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Bonus Details</p>
                                            <ul className="space-y-1 text-xs">
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">Bonus Amount:</span>
                                                <span className="text-yellow-400 font-medium">৳{bonus.amount.toLocaleString()}</span>
                                              </li>
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">Bet Amount:</span>
                                                <span className="text-blue-400">৳{bonus.betAmount.toLocaleString()}</span>
                                              </li>
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">Bonus Rate:</span>
                                                <span>{bonus.bonusRate}</span>
                                              </li>
                                              {bonus.weekNumber && (
                                                <li className="flex justify-between">
                                                  <span className="text-gray-400">Period:</span>
                                                  <span>Week {bonus.weekNumber}, {bonus.year}</span>
                                                </li>
                                              )}
                                              {bonus.monthName && (
                                                <li className="flex justify-between">
                                                  <span className="text-gray-400">Period:</span>
                                                  <span>{bonus.monthName} {bonus.year}</span>
                                                </li>
                                              )}
                                            </ul>
                                          </div>
                                          <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Validity</p>
                                            <ul className="space-y-1 text-xs">
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">Distributed:</span>
                                                <span>{formatDate(bonus.distributionDate)}</span>
                                              </li>
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">Expires:</span>
                                                <span className={urgencyClass}>
                                                  {(() => {
                                                    const expiryDate = new Date(bonus.distributionDate);
                                                    expiryDate.setDate(expiryDate.getDate() + 3);
                                                    return formatDate(expiryDate);
                                                  })()}
                                                </span>
                                              </li>
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">Valid Period:</span>
                                                <span>3 days from distribution</span>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>
                                        
                                        {daysLeft <= 1 && daysLeft > 0 && (
                                          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-center">
                                            <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                                              <FiAlertCircle /> This bonus expires soon! Claim it now.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Bonus;