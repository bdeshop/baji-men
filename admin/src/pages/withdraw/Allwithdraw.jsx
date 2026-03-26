import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaSort, FaSortUp, FaSortDown, FaMoneyBill, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaDownload, FaSync, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import axios from 'axios';
import toast, { Toaster } from "react-hot-toast";

const Allwithdraw = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateTransactionId, setUpdateTransactionId] = useState('');
  const [updateAdminNote, setUpdateAdminNote] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalAmount: 0,
    completedAmount: 0
  });
  
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const itemsPerPage = 10;
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const statuses = ['all', 'completed', 'pending', 'processing', 'failed', 'cancelled'];
  const methods = ['all', 'bkash', 'rocket', 'nagad', 'bank'];
  
  // Helper function to get account details from withdrawal
  const getAccountDetails = (withdrawal) => {
    if (withdrawal.method === 'bkash' || withdrawal.method === 'rocket' || withdrawal.method === 'nagad') {
      if (withdrawal.mobileBankingDetails) {
        return {
          accountNumber: withdrawal.mobileBankingDetails.phoneNumber,
          accountType: withdrawal.mobileBankingDetails.accountType,
          fullDetails: `${withdrawal.mobileBankingDetails.phoneNumber}${withdrawal.mobileBankingDetails.accountType ? ` (${withdrawal.mobileBankingDetails.accountType})` : ''}`
        };
      }
      return { accountNumber: 'N/A', fullDetails: 'N/A' };
    } else if (withdrawal.method === 'bank') {
      if (withdrawal.bankDetails) {
        return {
          accountNumber: withdrawal.bankDetails.accountNumber,
          bankName: withdrawal.bankDetails.bankName,
          accountHolderName: withdrawal.bankDetails.accountHolderName,
          branchName: withdrawal.bankDetails.branchName,
          district: withdrawal.bankDetails.district,
          routingNumber: withdrawal.bankDetails.routingNumber,
          fullDetails: `${withdrawal.bankDetails.bankName} - ${withdrawal.bankDetails.accountNumber}`
        };
      }
      return { accountNumber: 'N/A', fullDetails: 'N/A' };
    }
    return { accountNumber: 'N/A', fullDetails: 'N/A' };
  };

  // Fetch withdrawals from API
  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('usertoken') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/withdrawals`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          method: methodFilter !== 'all' ? methodFilter : undefined,
          search: searchTerm || undefined,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
          sortBy: sortConfig.key || 'createdAt',
          sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
        }
      });
      
      if (response.data) {
        setWithdrawals(response.data.withdrawals || response.data.data || []);
        
        // Calculate statistics from the fetched data
        const withdrawalsArray = response.data.withdrawals || response.data.data || [];
        const totalWithdrawals = withdrawalsArray.length;
        const completedWithdrawals = withdrawalsArray.filter(w => w.status === 'completed').length;
        const pendingWithdrawals = withdrawalsArray.filter(w => ['pending', 'processing'].includes(w.status)).length;
        const totalAmount = withdrawalsArray.reduce((sum, w) => sum + (w.amount || 0), 0);
        const completedAmount = withdrawalsArray.filter(w => w.status === 'completed').reduce((sum, w) => sum + (w.amount || 0), 0);
        
        setStats({
          total: totalWithdrawals,
          completed: completedWithdrawals,
          pending: pendingWithdrawals,
          totalAmount,
          completedAmount
        });
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError('Failed to load withdrawals. Please try again.');
      
      // Use sample data for demo
      const sampleData = [
        {
          _id: "69c4c57a9763d121d14b47c0",
          userId: { _id: "69c4c4629763d121d14b418a", username: "testuser", player_id: "PID123456" },
          method: "bkash",
          mobileBankingDetails: {
            phoneNumber: "01655585555",
            accountType: "personal"
          },
          bankDetails: null,
          amount: 500,
          status: "pending",
          transactionId: null,
          processedAt: null,
          rejectionReason: null,
          adminNote: null,
          createdAt: "2026-03-26T05:34:50.687Z",
          updatedAt: "2026-03-26T05:34:50.687Z"
        },
        {
          _id: "69c4c5be9763d121d14b4803",
          userId: { _id: "69c4c4629763d121d14b418a", username: "testuser", player_id: "PID123456" },
          method: "bank",
          mobileBankingDetails: null,
          bankDetails: {
            bankName: "Dutch Bangla Bank",
            accountHolderName: "John Doe",
            accountNumber: "435345345345",
            branchName: "Main Branch",
            district: "Dhaka",
            routingNumber: "123456789"
          },
          amount: 500,
          status: "pending",
          transactionId: null,
          processedAt: null,
          rejectionReason: null,
          adminNote: null,
          createdAt: "2026-03-26T05:35:58.042Z",
          updatedAt: "2026-03-26T05:35:58.042Z"
        }
      ];
      setWithdrawals(sampleData);
      setStats({
        total: sampleData.length,
        completed: 0,
        pending: sampleData.length,
        totalAmount: sampleData.reduce((sum, w) => sum + w.amount, 0),
        completedAmount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Update withdrawal status
  const updateWithdrawalStatus = async (withdrawalId, status, transactionId = null, adminNote = null) => {
    try {
      const token = localStorage.getItem('usertoken') || localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}/status`,
        { status, transactionId, adminNote },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        toast.success('Withdrawal status updated successfully!');
        fetchWithdrawals();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating withdrawal status:', err);
      toast.error(err.response?.data?.message || 'Failed to update withdrawal status');
      return false;
    }
  };

  // Delete withdrawal
  const deleteWithdrawal = async (withdrawalId) => {
    try {
      const token = localStorage.getItem('usertoken') || localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Withdrawal deleted successfully!');
        fetchWithdrawals();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting withdrawal:', err);
      toast.error(err.response?.data?.message || 'Failed to delete withdrawal');
      return false;
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Player ID', 'Username', 'Method', 'Amount', 'Account Details', 'Status', 'Transaction ID'];
      const csvData = withdrawals.map(w => [
        formatDate(w.createdAt),
        w.userId?.player_id || 'N/A',
        w.userId?.username || 'N/A',
        getMethodName(w.method),
        w.amount,
        getAccountDetails(w).fullDetails,
        w.status,
        w.transactionId || 'N/A'
      ]);
      
      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `withdrawal_history_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      toast.error('Failed to export data. Please try again.');
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, statusFilter, methodFilter, searchTerm, dateRange, sortConfig]);

  // Sort withdrawals
  const sortedWithdrawals = React.useMemo(() => {
    let sortableItems = [...withdrawals];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'processedAt') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        
        if (sortConfig.key === 'userId') {
          aValue = a.userId?.username || '';
          bValue = b.userId?.username || '';
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [withdrawals, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-orange-500" />;
    return <FaSortDown className="text-orange-500" />;
  };

  const viewWithdrawalDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowWithdrawalDetails(true);
  };

  const closeWithdrawalDetails = () => {
    setShowWithdrawalDetails(false);
    setSelectedWithdrawal(null);
  };

  const openUpdateModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setUpdateStatus(withdrawal.status);
    setUpdateTransactionId(withdrawal.transactionId || '');
    setUpdateAdminNote(withdrawal.adminNote || '');
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedWithdrawal(null);
    setUpdateStatus('');
    setUpdateTransactionId('');
    setUpdateAdminNote('');
  };

  const handleUpdateSubmit = async () => {
    if (!selectedWithdrawal) return;
    
    const success = await updateWithdrawalStatus(
      selectedWithdrawal._id, 
      updateStatus, 
      updateTransactionId || undefined,
      updateAdminNote || undefined
    );
    
    if (success) {
      closeUpdateModal();
    }
  };

  const openDeleteModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedWithdrawal(null);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedWithdrawal) return;
    
    const success = await deleteWithdrawal(selectedWithdrawal._id);
    
    if (success) {
      closeDeleteModal();
    }
  };

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'completed':
        return { icon: <FaCheckCircle className="text-green-500" />, color: 'bg-green-100 text-green-800 border-green-200' };
      case 'pending':
        return { icon: <FaClock className="text-yellow-500" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'processing':
        return { icon: <FaClock className="text-blue-500" />, color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'failed':
      case 'rejected':
      case 'cancelled':
        return { icon: <FaTimesCircle className="text-red-500" />, color: 'bg-red-100 text-red-800 border-red-200' };
      default:
        return { icon: <FaExclamationTriangle className="text-gray-500" />, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const getMethodName = (method) => {
    switch(method) {
      case 'bkash': return 'bKash';
      case 'nagad': return 'Nagad';
      case 'rocket': return 'Rocket';
      case 'bank': return 'Bank Transfer';
      default: return method;
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, dateRange]);

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Withdrawal History</h1>
                <p className="text-sm text-gray-600 mt-1">Track and manage all withdrawal transactions</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={fetchWithdrawals}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-[5px] hover:bg-gray-600 transition-all"
                  title="Refresh data"
                >
                  <FaSync className="mr-2" />
                  Refresh
                </button>
                <button 
                  onClick={exportToCSV}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-[5px] hover:from-green-600 hover:to-green-700 transition-all"
                >
                  <FaDownload className="mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-[5px] shadow-sm border-[1px] border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Total Withdrawals</h3>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-white p-4 rounded-[5px] shadow-sm border-[1px] border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Completed</h3>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="bg-white p-4 rounded-[5px] shadow-sm border-[1px] border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-white p-4 rounded-[5px] shadow-sm border-[1px] border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Total Amount</h3>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
            
            {/* Filters Section */}
            <div className="bg-white rounded-[5px] p-4 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                  <FaFilter className="mr-2 text-orange-500" />
                  Filters & Search
                </h2>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setMethodFilter('all');
                    setDateRange({ start: '', end: '' });
                  }}
                  className="text-sm text-orange-500 hover:text-orange-600 flex items-center"
                >
                  Clear All Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Search username, ID, account..."
                  />
                </div>
                
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    {statuses.filter(status => status !== 'all').map((status, index) => (
                      <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Methods</option>
                    {methods.filter(method => method !== 'all').map((method, index) => (
                      <option key={index} value={method}>{getMethodName(method)}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    value={sortConfig.key || ''}
                    onChange={(e) => requestSort(e.target.value)}
                  >
                    <option value="">Sort By</option>
                    <option value="createdAt">Date</option>
                    <option value="amount">Amount</option>
                    <option value="userId">Username</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <span className="self-center text-gray-500 hidden md:inline">to</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <p className="text-gray-600">
                Showing {withdrawals.length} of {stats.total} withdrawals
              </p>
              <p className="text-green-600 font-medium">
                Completed Amount: {formatCurrency(stats.completedAmount)}
              </p>
            </div>
            
            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg p-8 text-center mb-6">
                <div className="flex justify-center items-center py-8">
                  <FaSpinner className="animate-spin text-orange-500 text-2xl" />
                </div>
                <p className="text-gray-600 mt-4">Loading withdrawals...</p>
              </div>
            )}
            
            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={fetchWithdrawals}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {/* Withdrawals Table */}
            {!loading && !error && (
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdAt')}>
                          <div className="flex items-center gap-2">
                            Date & Time
                            {getSortIcon('createdAt')}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('userId')}>
                          <div className="flex items-center gap-2">
                            Player ID / Username
                            {getSortIcon('userId')}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                          Method
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('amount')}>
                          <div className="flex items-center gap-2">
                            Amount
                            {getSortIcon('amount')}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                          Account Details
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedWithdrawals.length > 0 ? (
                        sortedWithdrawals.map((withdrawal) => {
                          const statusInfo = getStatusInfo(withdrawal.status);
                          const accountDetails = getAccountDetails(withdrawal);
                          return (
                            <tr key={withdrawal._id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">{formatDate(withdrawal.createdAt)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-700 font-mono">{withdrawal.userId?.player_id || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{withdrawal.userId?.username || 'Unknown'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700">{getMethodName(withdrawal.method)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900">{formatCurrency(withdrawal.amount)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 max-w-xs truncate" title={accountDetails.fullDetails}>
                                  {accountDetails.fullDetails}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${statusInfo.color}`}>
                                  {statusInfo.icon}
                                  <span className="ml-1 capitalize">{withdrawal.status}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button 
                                    className="p-2 px-[8px] py-[7px] bg-blue-600 text-white rounded-[3px] text-[16px] hover:bg-blue-700"
                                    title="View details"
                                    onClick={() => viewWithdrawalDetails(withdrawal)}
                                  >
                                    <FaEye />
                                  </button>
                                  <button 
                                    className="p-2 px-[8px] py-[7px] bg-green-600 text-white rounded-[3px] text-[16px] hover:bg-green-700"
                                    title="Edit status"
                                    onClick={() => openUpdateModal(withdrawal)}
                                  >
                                    <FaEdit />
                                  </button>
                                  <button 
                                    className="p-2 px-[8px] py-[7px] bg-red-600 text-white rounded-[3px] text-[16px] hover:bg-red-700"
                                    title="Delete withdrawal"
                                    onClick={() => openDeleteModal(withdrawal)}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <FaSearch className="text-5xl mb-3 opacity-30" />
                              <p className="text-lg font-medium text-gray-500">No withdrawals found</p>
                              <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && !error && withdrawals.length > 0 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, stats.total)}
                      </span> of{' '}
                      <span className="font-medium">{stats.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1 
                            ? 'bg-gray-50 text-gray-800 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.ceil(stats.total / itemsPerPage) }, (_, i) => i + 1)
                        .slice(Math.max(0, currentPage - 3), Math.min(Math.ceil(stats.total / itemsPerPage), currentPage + 2))
                        .map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative cursor-pointer inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-orange-500 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(stats.total / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(stats.total / itemsPerPage)}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          currentPage === Math.ceil(stats.total / itemsPerPage)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Withdrawal Details Modal */}
      {showWithdrawalDetails && selectedWithdrawal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] backdrop-blur-md p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Withdrawal Details</h3>
              <button onClick={closeWithdrawalDetails} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Transaction Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Transaction ID:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedWithdrawal.transactionId || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Requested At:</dt>
                      <dd className="text-sm text-gray-900">{formatDate(selectedWithdrawal.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Payment Method:</dt>
                      <dd className="text-sm text-gray-900">{getMethodName(selectedWithdrawal.method)}</dd>
                    </div>
                    {selectedWithdrawal.processedAt && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Processed At:</dt>
                        <dd className="text-sm text-gray-900">{formatDate(selectedWithdrawal.processedAt)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">User Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Player ID:</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedWithdrawal.userId?.player_id || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Username:</dt>
                      <dd className="text-sm text-gray-900">{selectedWithdrawal.userId?.username || 'Unknown'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Amount Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h4>
                <div className="bg-gray-50 p-3 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Method:</dt>
                    <dd className="text-sm text-gray-900">{getMethodName(selectedWithdrawal.method)}</dd>
                  </div>
                  {(() => {
                    if (selectedWithdrawal.method === 'bkash' || selectedWithdrawal.method === 'rocket' || selectedWithdrawal.method === 'nagad') {
                      const details = selectedWithdrawal.mobileBankingDetails;
                      if (details) {
                        return (
                          <>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Phone Number:</dt>
                              <dd className="text-sm font-medium text-gray-900">{details.phoneNumber}</dd>
                            </div>
                            {details.accountType && (
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-600">Account Type:</dt>
                                <dd className="text-sm text-gray-900 capitalize">{details.accountType}</dd>
                              </div>
                            )}
                          </>
                        );
                      }
                    } else if (selectedWithdrawal.method === 'bank') {
                      const details = selectedWithdrawal.bankDetails;
                      if (details) {
                        return (
                          <>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Bank Name:</dt>
                              <dd className="text-sm text-gray-900">{details.bankName}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Account Holder:</dt>
                              <dd className="text-sm text-gray-900">{details.accountHolderName}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Account Number:</dt>
                              <dd className="text-sm font-mono text-gray-900">{details.accountNumber}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Branch:</dt>
                              <dd className="text-sm text-gray-900">{details.branchName}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">District:</dt>
                              <dd className="text-sm text-gray-900">{details.district}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-sm text-gray-600">Routing Number:</dt>
                              <dd className="text-sm text-gray-900">{details.routingNumber}</dd>
                            </div>
                          </>
                        );
                      }
                    }
                    return <p className="text-sm text-gray-500">No additional details available</p>;
                  })()}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                {(() => {
                  const statusInfo = getStatusInfo(selectedWithdrawal.status);
                  return (
                    <div className={`px-4 py-2 inline-flex items-center rounded-md border ${statusInfo.color}`}>
                      {statusInfo.icon}
                      <span className="ml-2 capitalize font-medium">{selectedWithdrawal.status}</span>
                    </div>
                  );
                })()}
              </div>

              {selectedWithdrawal.adminNote && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{selectedWithdrawal.adminNote}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => openUpdateModal(selectedWithdrawal)}
                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 focus:outline-none"
              >
                Update Status
              </button>
              <button
                onClick={closeWithdrawalDetails}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] backdrop-blur-md p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Update Withdrawal Status</h3>
              <button onClick={closeUpdateModal} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount</label>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                <div className="text-sm text-gray-900">
                  {selectedWithdrawal.userId?.username || 'Unknown'} ({selectedWithdrawal.userId?.player_id || 'N/A'})
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="text-sm text-gray-900">{getMethodName(selectedWithdrawal.method)}</div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Details</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {getAccountDetails(selectedWithdrawal).fullDetails}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={updateTransactionId}
                  onChange={(e) => setUpdateTransactionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter transaction ID if applicable"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Note (Optional)</label>
                <textarea
                  value={updateAdminNote}
                  onChange={(e) => setUpdateAdminNote(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Add any notes about this withdrawal..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeUpdateModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 focus:outline-none"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] backdrop-blur-md p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Confirm Deletion</h3>
              <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this withdrawal request? This action cannot be undone.
                </p>
              </div>
              
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-2">Withdrawal Details</h4>
                <div className="text-sm text-red-700 space-y-1">
                  <p>Amount: {formatCurrency(selectedWithdrawal.amount)}</p>
                  <p>User: {selectedWithdrawal.userId?.username || 'Unknown'} ({selectedWithdrawal.userId?.player_id || 'N/A'})</p>
                  <p>Method: {getMethodName(selectedWithdrawal.method)}</p>
                  <p>Account: {getAccountDetails(selectedWithdrawal).fullDetails}</p>
                  <p>Status: {selectedWithdrawal.status}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none"
              >
                Delete Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Allwithdraw;