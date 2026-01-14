import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaEdit, FaCopy, FaCheck, FaKey, FaCalendarAlt, 
  FaGlobe, FaServer, FaClock, FaIdCard, FaMobileAlt,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle,
  FaSync, FaUsers, FaCreditCard, FaToggleOn, FaToggleOff,
  FaDownload, FaDatabase, FaShieldAlt, FaCogs, FaPlug,
  FaHistory, FaInfoCircle, FaCalendarDay, FaCalendarCheck
} from 'react-icons/fa';
import { FiWifiOff, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { MdDomain, MdTimer, MdSecurity, MdOutlineStorage } from 'react-icons/md';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Opayapi = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationHistory, setValidationHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [runningUpdating, setRunningUpdating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshed, setRefreshed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [validationData, setValidationData] = useState({
    success: false,
    valid: false,
    subscriptionId: null,
    endDate: null,
    latestEndDate: null,
    domains: [],
    primaryDomain: null,
    deviceCount: 0,
    activeNumberCount: 0,
    plan: { id: null, name: null }
  });

  const [subscriptionData, setSubscriptionData] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isValid: false,
    plan: "No Plan",
    primaryDomain: "",
    domains: [],
    activeCount: 0,
    deviceCount: 0,
    endDate: "N/A",
    latestEndDate: "N/A",
    expireDate: "No subscription",
    subscriptionId: ""
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!', {
      icon: '📋',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSettings = useCallback(async (useCached = false) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${base_url}/api/opay/settings?cached=${useCached}`);
      if (response.data) {
        const { apiKey, validation, running, updatedAt, refreshed } = response.data;
        
        if (apiKey) setApiKey(apiKey);
        if (validation) {
          setValidationData(validation);
          updateSubscriptionData(validation);
        } else {
          // Reset to default if no validation data
          resetSubscriptionData();
        }
        if (running !== undefined) setRunning(running);
        if (updatedAt) setLastUpdated(new Date(updatedAt).toLocaleString());
        if (refreshed !== undefined) setRefreshed(refreshed);
        
        if (validation && updatedAt) {
          setValidationHistory(prev => [
            {
              timestamp: new Date(updatedAt).toLocaleString(),
              valid: validation.valid || false,
              reason: validation.reason || (validation.valid ? 'VALIDATION_SUCCESS' : 'VALIDATION_FAILED'),
              deviceCount: validation.deviceCount || 0,
              activeNumberCount: validation.activeNumberCount || 0
            },
            ...prev.slice(0, 4)
          ]);
        }
        
        if (refreshed) {
          toast.success('Settings refreshed from API!', {
            icon: '🔄',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [base_url]);

  const resetSubscriptionData = () => {
    setSubscriptionData({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isValid: false,
      plan: "No Plan",
      primaryDomain: "",
      domains: [],
      activeCount: 0,
      deviceCount: 0,
      endDate: "N/A",
      latestEndDate: "N/A",
      expireDate: "No subscription",
      subscriptionId: ""
    });
  };

  const calculateTimeUntilExpiration = useCallback((endDate) => {
    if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const end = new Date(endDate);
    const now = new Date();
    const diffMs = end - now;
    
    if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  }, []);

  const updateSubscriptionData = useCallback((validation) => {
    if (!validation) {
      resetSubscriptionData();
      return;
    }
    
    const timeUntilExpiry = calculateTimeUntilExpiration(validation.endDate);
    
    setSubscriptionData({
      days: timeUntilExpiry.days,
      hours: timeUntilExpiry.hours,
      minutes: timeUntilExpiry.minutes,
      seconds: timeUntilExpiry.seconds,
      isValid: validation.valid || false,
      plan: validation.plan?.name || 'Standard Plan',
      primaryDomain: validation.primaryDomain || 'No domain',
      domains: validation.domains || [],
      activeCount: validation.activeNumberCount || 0,
      deviceCount: validation.deviceCount || 0,
      endDate: formatDate(validation.endDate),
      latestEndDate: formatDate(validation.latestEndDate),
      expireDate: formatTimeDifference(validation.endDate),
      subscriptionId: validation.subscriptionId || ''
    });
  }, [calculateTimeUntilExpiration]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTimeDifference = (dateString) => {
    if (!dateString) return 'No expiration date';
    try {
      const end = new Date(dateString);
      const now = new Date();
      const diffMs = end - now;
      
      if (diffMs <= 0) return 'Expired';
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays === 0) {
        if (diffHours === 0) return 'Less than an hour';
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
      }
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `${diffDays} days left`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} left`;
      return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} left`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const validateApiKey = useCallback(async (showToast = true) => {
    if (!apiKey) {
      toast.error('API Key is required!');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Call the backend validation endpoint
      const response = await axios.post(`${base_url}/api/opay/validate`, { apiKey });
      
      if (response.data && response.data.success) {
        setValidationData(response.data);
        updateSubscriptionData(response.data);
        
        setValidationHistory(prev => [
          {
            timestamp: new Date().toLocaleString(),
            valid: response.data.valid || false,
            reason: response.data.reason || 'VALIDATION_SUCCESS',
            deviceCount: response.data.deviceCount || 0,
            activeNumberCount: response.data.activeNumberCount || 0
          },
          ...prev.slice(0, 4)
        ]);

        if (showToast) {
          toast.success('API Key validated successfully!');
        }
      } else {
        throw new Error(response.data?.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Validation failed';
      setValidationError(errorMessage);
      
      // Add to history even on error
      setValidationHistory(prev => [
        {
          timestamp: new Date().toLocaleString(),
          valid: false,
          reason: 'VALIDATION_FAILED',
          deviceCount: 0,
          activeNumberCount: 0,
          error: errorMessage
        },
        ...prev.slice(0, 4)
      ]);
      
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  }, [apiKey, base_url, updateSubscriptionData]);

  const toggleRunning = async () => {
    setRunningUpdating(true);
    try {
      const newState = !running;
      const response = await axios.post(`${base_url}/api/opay/toggle-running`, { running: newState });
      
      if (response.data.success) {
        setRunning(newState);
        toast.success(`Integration ${newState ? 'activated' : 'deactivated'}`);
      } else {
        throw new Error(response.data.message || 'Failed to update running state');
      }
    } catch (error) {
      console.error('Failed to toggle running state:', error);
      toast.error('Failed to update running state');
    } finally {
      setRunningUpdating(false);
    }
  };

  const handleValidateClick = () => {
    validateApiKey(true);
  };

  const handleRefreshSettings = async () => {
    try {
      setIsLoading(true);
      await loadSettings(false); // false = don't use cached data
    } catch (error) {
      console.error('Failed to refresh settings:', error);
      toast.error('Failed to refresh settings');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadApiKey = () => {
    if (!apiKey) {
      toast.error('No API Key to download');
      return;
    }
    
    const element = document.createElement('a');
    const file = new Blob([
      `OPAY API KEY\n` +
      `============\n\n` +
      `API Key: ${apiKey}\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Valid: ${validationData.valid ? 'Yes' : 'No'}\n` +
      `Subscription ID: ${validationData.subscriptionId || 'N/A'}\n` +
      `Plan: ${validationData.plan?.name || 'N/A'}\n\n` +
      `WARNING: DO NOT SHARE THIS KEY WITH ANYONE\n` +
      `Keep this key secure and never commit it to version control.`
    ], {type: 'text/plain'});
    
    element.href = URL.createObjectURL(file);
    element.download = `opay-api-key-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('API Key downloaded!', {
      icon: '📥',
    });
  };

  const saveApiKey = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${base_url}/api/opay/save-key`, { apiKey });
      
      if (response.data.success) {
        toast.success('API Key saved successfully!');
        // Refresh settings after saving
        await loadSettings(true);
      } else {
        throw new Error(response.data.message || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error(error.message || 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load cached settings on initial load
    loadSettings(true);
    
    // Auto-refresh validation every 5 minutes if API key exists and is valid
    const interval = setInterval(() => {
      if (apiKey && validationData.valid) {
        loadSettings(false); // Refresh with non-cached data
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadSettings, apiKey, validationData.valid]);

  useEffect(() => {
    if (!validationData.valid) return;
    
    const timer = setInterval(() => {
      setSubscriptionData(prev => {
        let { seconds, minutes, hours, days } = prev;
        
        if (seconds > 0) {
          seconds -= 1;
        } else {
          if (minutes > 0) {
            seconds = 59;
            minutes -= 1;
          } else {
            if (hours > 0) {
              minutes = 59;
              seconds = 59;
              hours -= 1;
            } else {
              if (days > 0) {
                hours = 23;
                minutes = 59;
                seconds = 59;
                days -= 1;
              } else {
                clearInterval(timer);
                return { ...prev, days: 0, hours: 0, minutes: 0, seconds: 0 };
              }
            }
          }
        }
        
        return { ...prev, days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [validationData]);

  const getStatusColor = () => {
    if (isValidating) return 'bg-gradient-to-r from-blue-500 to-cyan-400';
    if (validationData.valid) return 'bg-gradient-to-r from-emerald-500 to-green-400';
    if (validationError) return 'bg-gradient-to-r from-red-500 to-orange-400';
    return 'bg-gradient-to-r from-gray-500 to-gray-400';
  };

  const getStatusText = () => {
    if (isValidating) return 'Validating...';
    if (validationData.valid) return 'VALID';
    if (validationError) return 'INVALID';
    return 'NOT VALIDATED';
  };

  const getStatusIcon = () => {
    if (isValidating) return <FaSync className="animate-spin" />;
    if (validationData.valid) return <FaCheckCircle />;
    return <FaTimesCircle />;
  };

  return (
    <section className="font-nunito h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-4 md:p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                    Opay API Validation
                  </h1>
                  {refreshed && (
                    <span className="ml-3 px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold rounded-full">
                      LIVE DATA
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-2 text-sm md:text-base">
                  Manage API keys, monitor subscriptions, and validate integration status
                  {lastUpdated && (
                    <span className="ml-2 text-gray-500 text-sm">
                      • Last updated: {lastUpdated}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <button
                  onClick={toggleRunning}
                  disabled={runningUpdating}
                  className={`flex items-center px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg ${
                    running
                      ? 'bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white shadow-emerald-200'
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 shadow-gray-200'
                  } ${runningUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {running ? (
                    <>
                      <FaToggleOn className="mr-2 text-lg" />
                      Active
                    </>
                  ) : (
                    <>
                      <FaToggleOff className="mr-2 text-lg" />
                      Inactive
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleRefreshSettings}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-200"
                >
                  <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <button
                  onClick={handleValidateClick}
                  disabled={isValidating || !apiKey}
                  className={`flex items-center px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg ${
                    isValidating
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-blue-200 cursor-wait'
                      : validationData.valid
                      ? 'bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white shadow-emerald-200'
                      : 'bg-gradient-to-r from-rose-500 to-pink-400 hover:from-rose-600 hover:to-pink-500 text-white shadow-rose-200'
                  } ${!apiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isValidating ? (
                    <FaSync className="animate-spin mr-2" />
                  ) : (
                    <FaCheck className="mr-2" />
                  )}
                  Validate
                </button>
              </div>
            </div>
          </div>

          {/* API Key Card with Gradient */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg mr-4">
                  <FaKey className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">API Key Configuration</h2>
                  <p className="text-gray-600 text-sm mt-1">Download and configure your Opay API Key</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4 md:mt-0">
                <button
                  onClick={saveApiKey}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-emerald-200"
                >
                  <FaCheck className="mr-2" />
                  Save Key
                </button>
                
                <button
                  onClick={downloadApiKey}
                  className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-indigo-200"
                >
                  <FaDownload className="mr-2" />
                  Download Key
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FaKey className="mr-2 text-blue-500" />
                  Your Opay API Key
                </label>
                <div className="flex items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Opay API Key"
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 focus:border-blue-400 rounded-l-xl px-6 py-4 text-sm md:text-base font-mono text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      {apiKey && (
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          validationData.valid 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {validationData.valid ? 'VALID KEY' : 'NEEDS VALIDATION'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(apiKey)}
                    disabled={!apiKey}
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-6 py-4 rounded-r-xl transition-all duration-300 shadow-lg shadow-blue-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? <FaCheck className="mr-2" /> : <FaCopy className="mr-2" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl border border-emerald-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 shadow-lg mr-4">
                  <FaCheckCircle className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">API Validation Status</h2>
                  <p className="text-gray-600 text-sm mt-1">Current validation and subscription status</p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <span className={`inline-flex items-center px-6 py-2.5 rounded-full text-white font-bold ${getStatusColor()} shadow-lg`}>
                  {getStatusIcon()}
                  <span className="ml-2">{getStatusText()}</span>
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 mr-3">
                    <FaMobileAlt className="text-xl text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">DEVICE COUNT</p>
                    <p className="text-3xl font-bold text-blue-700 mt-1">{subscriptionData.deviceCount}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Active registered devices</p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-50 mr-3">
                    <FaUsers className="text-xl text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600">ACTIVE NUMBER COUNT</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-1">{subscriptionData.activeCount}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Currently active numbers</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-purple-100 to-purple-50 mr-3">
                    <FaGlobe className="text-xl text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">DOMAINS</p>
                    <p className="text-3xl font-bold text-purple-700 mt-1">{subscriptionData.domains.length}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Registered domains</p>
              </div>
            </div>
          </div>

          {/* Countdown Timer Section */}
          {validationData.valid && subscriptionData.days > 0 && (
            <div className="bg-gradient-to-br from-white to-rose-50 rounded-2xl border border-rose-100 p-6 mb-6">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-400 shadow-lg mr-4">
                  <FaCalendarAlt className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Subscription Ends In</h2>
                  <p className="text-gray-600 text-sm mt-1">Time remaining until subscription expiration</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6 text-center shadow-lg border border-blue-200">
                  <div className="text-4xl md:text-5xl font-bold text-blue-700 mb-2">
                    {subscriptionData.days}
                  </div>
                  <div className="text-gray-700 font-semibold text-sm uppercase tracking-wider">DAYS</div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl p-6 text-center shadow-lg border border-emerald-200">
                  <div className="text-4xl md:text-5xl font-bold text-emerald-700 mb-2">
                    {subscriptionData.hours}
                  </div>
                  <div className="text-gray-700 font-semibold text-sm uppercase tracking-wider">HOURS</div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl p-6 text-center shadow-lg border border-amber-200">
                  <div className="text-4xl md:text-5xl font-bold text-amber-700 mb-2">
                    {subscriptionData.minutes}
                  </div>
                  <div className="text-gray-700 font-semibold text-sm uppercase tracking-wider">MINUTES</div>
                </div>
                
                <div className="bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl p-6 text-center shadow-lg border border-rose-200">
                  <div className="text-4xl md:text-5xl font-bold text-rose-700 mb-2">
                    {subscriptionData.seconds}
                  </div>
                  <div className="text-gray-700 font-semibold text-sm uppercase tracking-wider">SECONDS</div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column - Subscription Info */}
            <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl border border-indigo-100 p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-400  mr-4">
                  <FaDatabase className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Subscription Details</h2>
                  <p className="text-gray-600 text-sm mt-1">Plan information and domain configuration</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-white rounded-xl border border-indigo-100">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${validationData.valid ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-rose-400 to-red-500'}`}></div>
                    <span className="font-bold text-gray-800">
                      STATUS: <span className={validationData.valid ? 'text-emerald-600' : 'text-rose-600'}>{validationData.valid ? 'ACTIVE' : 'INACTIVE'}</span>
                    </span>
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
                    <span className="font-bold text-indigo-700">{subscriptionData.plan}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 mr-3 mt-1">
                      <FaGlobe className="text-lg text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">PRIMARY DOMAIN</h4>
                      <p className="text-gray-800 font-medium mt-1 text-lg">{subscriptionData.primaryDomain || 'No domain set'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-50 mr-3 mt-1">
                      <MdDomain className="text-lg text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">DOMAINS</h4>
                      <div className="mt-2 space-y-2">
                        {subscriptionData.domains.length > 0 ? (
                          subscriptionData.domains.map((domain, index) => (
                            <div key={index} className="flex items-center">
                              <FiChevronRight className="text-gray-400 mr-2" />
                              <span className="text-gray-800 font-medium">{domain}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 italic">No domains registered</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Additional Info */}
            <div className="bg-gradient-to-br from-white to-cyan-50 rounded-2xl border border-cyan-100 p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-400 shadow-lg mr-4">
                  <FaInfoCircle className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Subscription Information</h2>
                  <p className="text-gray-600 text-sm mt-1">Additional details and expiration</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">SUBSCRIPTION ID</label>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-5 py-3.5">
                      <code className="text-gray-800 font-mono font-medium text-sm break-all">
                        {subscriptionData.subscriptionId || 'No subscription ID'}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(subscriptionData.subscriptionId)}
                      disabled={!subscriptionData.subscriptionId}
                      className="ml-3 p-3.5 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center mb-2">
                      <FaCalendarDay className="text-amber-500 mr-2" />
                      <h4 className="font-bold text-gray-700 text-sm">END DATE</h4>
                    </div>
                    <p className="text-gray-800 font-medium">{subscriptionData.endDate}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-xl border border-rose-100">
                    <div className="flex items-center mb-2">
                      <FaCalendarCheck className="text-rose-500 mr-2" />
                      <h4 className="font-bold text-gray-700 text-sm">LATEST END DATE</h4>
                    </div>
                    <p className="text-gray-800 font-medium">{subscriptionData.latestEndDate}</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl border ${
                  subscriptionData.expireDate.includes('Expired') 
                    ? 'bg-gradient-to-br from-rose-50 to-white border-rose-200' 
                    : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">DAYS TO EXPIRE</h4>
                      <p className={`text-2xl font-bold mt-1 ${
                        subscriptionData.expireDate.includes('Expired') ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {subscriptionData.expireDate}
                      </p>
                    </div>
                    <MdTimer className={`text-3xl ${
                      subscriptionData.expireDate.includes('Expired') ? 'text-rose-400' : 'text-emerald-400'
                    }`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - History & Webhook */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validation History */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-400 shadow-lg mr-4">
                  <FaHistory className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Validation History</h2>
                  <p className="text-gray-600 text-sm mt-1">Recent validation attempts</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {validationHistory.length > 0 ? (
                  validationHistory.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                        entry.valid 
                          ? 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200' 
                          : 'bg-gradient-to-r from-rose-50 to-white border-rose-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            entry.valid 
                              ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' 
                              : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700'
                          }`}>
                            {entry.valid ? 'VALID' : 'INVALID'}
                          </span>
                          <span className="ml-3 text-sm text-gray-600">{entry.reason}</span>
                        </div>
                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                      </div>
                      <div className="flex items-center mt-3 text-xs text-gray-500">
                        <span className="mr-4">Devices: {entry.deviceCount}</span>
                        <span>Numbers: {entry.activeNumberCount}</span>
                        {entry.error && (
                          <span className="ml-4 text-rose-500 truncate max-w-[200px]">{entry.error}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FaHistory className="text-gray-300 text-4xl mx-auto mb-3" />
                    <p className="text-gray-500">No validation history</p>
                    <p className="text-gray-400 text-sm mt-1">Validate your API key to see history</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Webhook Information */}
            <div className="bg-gradient-to-br from-white to-violet-50 rounded-2xl border border-violet-100 p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-400 shadow-lg mr-4">
                  <FaPlug className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Webhook Configuration</h2>
                  <p className="text-gray-600 text-sm mt-1">Callback URLs and integration settings</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-700">Deposit Callback</span>
                    <span className="text-xs px-2 py-1 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 rounded">POST</span>
                  </div>
                  <code className="text-sm bg-white px-3 py-2 rounded-lg border border-violet-100 block w-full font-mono text-violet-700">
                    {base_url}/api/opay/callback-deposit
                  </code>
                </div>
                
                <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-700">Status Callback</span>
                    <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded">GET</span>
                  </div>
                  <code className="text-sm bg-white px-3 py-2 rounded-lg border border-blue-100 block w-full font-mono text-blue-700">
                    {base_url}/api/opay/status
                  </code>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div>
                    <span className="font-bold text-gray-700">Integration Status</span>
                    <p className="text-sm text-gray-500">Current running state</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-4 py-2 rounded-full font-bold ${
                      running 
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' 
                        : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700'
                    }`}>
                      {running ? 'RUNNING' : 'STOPPED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              <FaShieldAlt className="inline mr-2 text-emerald-500" />
              Securely validated via Opay API v2.1 • 
              <a 
                href="https://api.oraclepay.org/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                View API Documentation
              </a>
            </p>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Opayapi;