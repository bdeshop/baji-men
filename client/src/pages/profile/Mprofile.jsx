import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FiBell, FiUser, FiLock, FiCheckCircle, FiFileText, FiTrendingUp, FiUsers, FiLogOut, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { FaCoins, FaGift, FaExchangeAlt } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MdSportsSoccer } from "react-icons/md";
import logo from "../../assets/logo.png";
import toast, { Toaster } from 'react-hot-toast';

const menuItems = [
  { id: "notifications", label: "Notifications", desc: "View your latest updates", icon: <FiBell />, path: "/member/inbox/notification", color: "from-purple-900/30 to-purple-950/30", borderColor: "border-purple-700/50", iconColor: "text-purple-400" },
  { id: "personal-info", label: "Personal info", desc: "Manage your profile details", icon: <FiUser />, path: "/member/profile/info", color: "from-blue-900/30 to-blue-950/30", borderColor: "border-blue-700/50", iconColor: "text-blue-400" },
  { id: "login-security", label: "Login & Security", desc: "Update password and security settings", icon: <FiLock />, path: "/member/profile/account", color: "from-green-900/30 to-green-950/30", borderColor: "border-green-700/50", iconColor: "text-green-400" },
  { id: "verification", label: "Verification", desc: "Verify your account status", icon: <FiCheckCircle />, path: "/member/profile/verify", color: "from-yellow-900/30 to-yellow-950/30", borderColor: "border-yellow-700/50", iconColor: "text-yellow-400" },
  { id: "transactions", label: "Transaction records", desc: "Review your financial transactions", icon: <FiFileText />, path: "/member/transaction-records", color: "from-indigo-900/30 to-indigo-950/30", borderColor: "border-indigo-700/50", iconColor: "text-indigo-400" },
  { id: "betting-records", label: "Betting records", desc: "Check your betting history", icon: <MdSportsSoccer />, path: "/member/betting-records/settled", color: "from-red-900/30 to-red-950/30", borderColor: "border-red-700/50", iconColor: "text-red-400" },
  { id: "turnover", label: "Turnover", desc: "Track your turnover progress", icon: <FiTrendingUp />, path: "/member/turnover/uncomplete", color: "from-pink-900/30 to-pink-950/30", borderColor: "border-pink-700/50", iconColor: "text-pink-400" },
  { id: "referral", label: "My referral", desc: "Manage your referral program", icon: <FiUsers />, path: "/referral-program/details", color: "from-teal-900/30 to-teal-950/30", borderColor: "border-teal-700/50", iconColor: "text-teal-400" },
  { id: "bonuses", label: "Bonuses", desc: "View your available bonuses and rewards", icon: <FaGift />, path: "/member/bonuses", color: "from-orange-900/30 to-orange-950/30", borderColor: "border-orange-700/50", iconColor: "text-orange-400" },
];

const Mprofile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [isRefreshingCoinBalance, setIsRefreshingCoinBalance] = useState(false);
  
  // Coin conversion states
  const [convertingCoins, setConvertingCoins] = useState(false);
  
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Minimum coins required for conversion
  const MIN_COINS_FOR_CONVERSION = 1000;

  // Get user and token from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("usertoken");

  // Fetch user data
  const checkAuthAndFetchData = async () => {
    if (!token) {
      setError("Please login to view your profile");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user data
      const userResponse = await axios.get(`${base_url}/api/user/my-information`);
      if (userResponse.data.success) {
        setUserData(userResponse.data.data);
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to fetch data";
      setError(errorMessage);
      console.error("Error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh regular balance
  const refreshBalance = async () => {
    if (!token) return;

    try {
      setIsRefreshingBalance(true);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get(`${base_url}/api/user/my-information`);
      if (response.data.success) {
        setUserData(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error("Error refreshing balance:", error);
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  // Refresh coin balance
  const refreshCoinBalance = async () => {
    if (!token) return;
    
    try {
      setIsRefreshingCoinBalance(true);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get(`${base_url}/api/user/my-information`);
      if (response.data.success) {
        setUserData(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error("Error refreshing coin balance:", error);
    } finally {
      setIsRefreshingCoinBalance(false);
    }
  };

  // Convert coins to balance
  const convertCoinsToBalance = async () => {
    const coinBalance = userData?.coinBalance || 0;
    
    if (coinBalance < MIN_COINS_FOR_CONVERSION) {
      toast.error(`Minimum ${MIN_COINS_FOR_CONVERSION} coins required for conversion`);
      return;
    }
    
    setConvertingCoins(true);
    try {
      const response = await axios.post(
        `${base_url}/api/user/convert-coins-to-balance`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setUserData(prev => ({
          ...prev,
          coinBalance: response.data.data.newCoinBalance,
          balance: response.data.data.newRealBalance
        }));
        
        // Update user in localStorage
        const updatedUser = { ...user, balance: response.data.data.newRealBalance, coinBalance: response.data.data.newCoinBalance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error(response.data.message || "Failed to convert coins");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to convert coins";
      toast.error(errorMessage);
      console.error("Error converting coins:", err);
    } finally {
      setConvertingCoins(false);
    }
  };

  // Check if user can convert coins (minimum 1000)
  const canConvertCoins = (userData?.coinBalance || 0) >= MIN_COINS_FOR_CONVERSION;
  
  // Calculate conversion details
  const getConversionDetails = () => {
    const coinBalance = userData?.coinBalance || 0;
    if (!canConvertCoins) {
      return {
        coinsToConvert: 0,
        amountToGet: 0,
        remainingCoins: coinBalance,
        needed: MIN_COINS_FOR_CONVERSION - coinBalance
      };
    }
    const coinsToConvert = Math.floor(coinBalance / 100) * 100;
    const amountToGet = coinsToConvert / 100;
    const remainingCoins = coinBalance - coinsToConvert;
    return { coinsToConvert, amountToGet, remainingCoins, needed: 0 };
  };

  const conversionDetails = getConversionDetails();

  // Load data on component mount
  useEffect(() => {
    checkAuthAndFetchData();
  }, [token, user.id]);

  // Handle menu item click
  const handleMenuClick = (path) => {
    navigate(path);
  };

  // Handle logout
  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    
    // Clear localStorage data
    localStorage.removeItem("usertoken");
    localStorage.removeItem("user");
    
    // Clear axios default headers
    delete axios.defaults.headers.common["Authorization"];
    
    // Set a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLoggingOut(false);
    setShowLogoutPopup(false);
    
    // Navigate to home page
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutPopup(false);
  };

  if (loading) {
    return (
      <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)]">
          <Sidebar sidebarOpen={sidebarOpen} menuItems={menuItems} />
          <div className='w-full p-[20px] flex justify-center items-center'>
            <div className="relative w-24 h-24 flex justify-center items-center">
              <div className="absolute w-full h-full rounded-full border-4 border-transparent border-t-green-500 border-r-green-500 animate-spin"></div>
              <div className="w-20 h-20 rounded-full flex justify-center items-center font-bold text-lg">
                <img className='w-16' src={logo} alt="Loading..." />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden w-full font-poppins bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #2a2a2a',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-700/30">
                <FiLogOut className="text-2xl text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Logout Confirmation
              </h3>
              <p className="text-gray-300 text-center mb-6">
                Are you sure you want to logout? You will need to sign in again to access your account.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-3 px-4 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700/50 rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Logging out...
                    </>
                  ) : (
                    "Yes, Logout"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)] w-full">
        <Sidebar sidebarOpen={sidebarOpen} menuItems={menuItems} />
        <div className="flex-1 overflow-auto w-full transition-all duration-300">
          <div className="mx-auto w-full pb-[100px] sm:max-w-[95%] lg:max-w-screen-lg px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/50 p-4 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/5 to-transparent opacity-20"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 blur-sm opacity-60"></div>
                    <img
                      src="https://thumbs.dreamstime.com/b/man-profile-cartoon-smiling-round-icon-vector-illustration-graphic-design-135443422.jpg"
                      alt="Profile"
                      className="w-[100px] h-[100px] sm:w-20 sm:h-20 rounded-full border-2 border-green-500 relative z-10"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {userData?.username || "User"}
                    </h2>
                    
                    {/* Regular Balance with Refresh */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-300">Balance:</span>
                      <div className="bg-[#1f1f1f] rounded-lg px-3 py-1.5 flex items-center gap-2 border border-gray-800">
                        <img
                          src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/currency-type/bdt.png"
                          className="w-4 h-4"
                          alt="BDT"
                        />
                        <span className="text-white font-medium">
                          {parseFloat(userData?.balance || 0).toFixed(2)}
                        </span>
                        <button
                          className="p-1 hover:bg-[#444] cursor-pointer text-white transition-colors duration-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={refreshBalance}
                          disabled={isRefreshingBalance}
                          aria-label="Refresh balance"
                        >
                          <FiRefreshCw
                            className={`w-3 h-3 ${isRefreshingBalance ? 'animate-spin' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                    
                    {/* Coin Balance with Refresh */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-300">Coins:</span>
                      <div className="bg-[#1f1f1f] rounded-lg px-3 py-1.5 flex items-center gap-2 border border-yellow-800/50">
                        <FaCoins className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">
                          {userData?.coinBalance?.toLocaleString() || 0}
                        </span>
                        <button
                          className="p-1 hover:bg-[#444] cursor-pointer text-yellow-400 transition-colors duration-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={refreshCoinBalance}
                          disabled={isRefreshingCoinBalance}
                          aria-label="Refresh coin balance"
                        >
                          <FiRefreshCw
                            className={`w-3 h-3 ${isRefreshingCoinBalance ? 'animate-spin' : ''}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coin Conversion Box - NEW SECTION ADDED */}
                <div className={`mt-4 rounded-lg p-4 transition-all duration-300 ${
                  canConvertCoins 
                    ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30" 
                    : "bg-[#1a1a1a] border border-[#2a2a2a] opacity-70"
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        canConvertCoins ? "bg-yellow-500/20" : "bg-gray-500/20"
                      }`}>
                        <FaCoins className={canConvertCoins ? "text-yellow-500 text-2xl" : "text-gray-500 text-2xl"} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                          Convert Coins to Balance
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            canConvertCoins 
                              ? "bg-yellow-500/20 text-yellow-400" 
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                            {userData?.coinBalance?.toLocaleString() || 0} Coins
                          </span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          100 coins = 1 BDT • Minimum {MIN_COINS_FOR_CONVERSION} coins required
                        </p>
                        {!canConvertCoins && userData?.coinBalance > 0 && (
                          <p className="text-xs text-red-400 mt-1">
                            Need {conversionDetails.needed} more coins to convert
                          </p>
                        )}
                        {userData?.coinBalance === 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Earn coins by completing levels and claiming rewards
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={convertCoinsToBalance}
                      disabled={!canConvertCoins || convertingCoins}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        canConvertCoins && !convertingCoins
                          ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-lg shadow-yellow-500/20 cursor-pointer"
                          : "bg-gray-600 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {convertingCoins ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FaExchangeAlt className="text-sm" />
                      )}
                      {convertingCoins 
                        ? "Converting..." 
                        : canConvertCoins 
                          ? `Convert ${conversionDetails.coinsToConvert} Coins` 
                          : "Minimum 1000 Coins Required"}
                    </button>
                  </div>
                  
                  {canConvertCoins && (
                    <div className="mt-3 pt-3 border-t border-yellow-500/20">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Current Coins:</span>
                          <span className="text-yellow-400 font-medium">{userData?.coinBalance?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Will Convert:</span>
                          <span className="text-yellow-400 font-medium">{conversionDetails.coinsToConvert.toLocaleString()} coins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">You Get:</span>
                          <span className="text-green-400 font-medium">৳{conversionDetails.amountToGet}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Remaining Coins:</span>
                          <span className="text-gray-400">{conversionDetails.remainingCoins.toLocaleString()} coins</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!canConvertCoins && userData?.coinBalance > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Current Coins:</span>
                          <span className="text-yellow-400 font-medium">{userData?.coinBalance?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Need More:</span>
                          <span className="text-red-400 font-medium">{conversionDetails.needed} coins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Progress:</span>
                          <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                              style={{ width: `${((userData?.coinBalance || 0) / MIN_COINS_FOR_CONVERSION) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-400">{Math.floor(((userData?.coinBalance || 0) / MIN_COINS_FOR_CONVERSION) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Info message about earning coins */}
                  {!canConvertCoins && userData?.coinBalance === 0 && (
                    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FiAlertCircle className="text-yellow-500" />
                        <span>Complete betting levels to earn coins! Visit the <button 
                          onClick={() => navigate("/member/bonuses")}
                          className="text-yellow-400 hover:underline cursor-pointer"
                        >Bonuses page</button> to see available level rewards.</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Menu Items Boxes */}
                <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMenuClick(item.path)}
                      className={`
                        bg-gradient-to-br ${item.color} 
                        ${item.borderColor} 
                        border 
                        rounded-xl 
                        p-4 sm:p-5 
                        flex flex-col items-start gap-3 
                        hover:scale-[1.02] 
                        hover:shadow-xl 
                        hover:shadow-black/30 
                        cursor-pointer 
                        transition-all duration-300 
                        hover:border-opacity-70
                        group
                        relative overflow-hidden
                      `}
                    >
                      {/* Background glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative z-10 flex items-center gap-3 w-full">
                        <div className={`
                          text-2xl sm:text-3xl 
                          ${item.iconColor} 
                          group-hover:scale-110 
                          transition-transform duration-300
                          p-2 rounded-lg bg-black/20
                        `}>
                          {item.icon}
                        </div>
                        <span className="text-[13px] sm:text-base font-semibold text-nowrap text-gray-100 group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <p className="relative z-10 text-[10px] md:text-xs text-gray-400 text-nowrap group-hover:text-gray-300 transition-colors">
                        {item.desc}
                      </p>
                      
                      {/* Arrow indicator */}
                      <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Logout Button Section */}
                  {token && (
                    <div className="col-span-1 sm:col-span-3 lg:col-span-4 mt-2">
                      <button
                        onClick={handleLogout}
                        className="relative inline-flex w-full items-center justify-center gap-3 px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-red-900/30 to-red-950/30 hover:from-red-800/30 hover:to-red-900/30 border border-red-700/50 hover:border-red-600/50 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 group"
                      >
                        {/* Background glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <FiLogOut className="text-xl text-red-400 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                        <span className="font-medium text-red-300 group-hover:text-red-200 transition-colors relative z-10">
                          Logout from Account
                        </span>
                        
                        {/* Arrow indicator */}
                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7"></path>
                          </svg>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-900/30 to-red-950/30 border border-red-700/50 rounded-xl p-4 mb-4 text-center backdrop-blur-sm">
                <div className="inline-flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                </div>
              </div>
            )}

            {!token && (
              <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 sm:p-6 text-center max-w-sm sm:max-w-md mx-auto shadow-2xl shadow-black/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent opacity-30"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-900/30 to-blue-950/30 border border-blue-700/30 mb-3 sm:mb-4">
                    <FiBell className="text-xl sm:text-2xl text-blue-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Authentication Required
                  </h3>
                  <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">Please log in to view your profile</p>
                  <a
                    href="/login"
                    className="relative inline-block px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 text-xs sm:text-sm font-medium group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl blur-sm opacity-0 group-hover:opacity-50 transition-opacity"></div>
                    <span className="relative">Sign In Now</span>
                  </a>
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

export default Mprofile;