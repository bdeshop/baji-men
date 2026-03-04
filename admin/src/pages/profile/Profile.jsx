import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaKey, FaEye, FaEyeSlash,
  FaShieldAlt, FaCheck, FaExclamationTriangle, FaArrowLeft,
  FaLock, FaHistory, FaBell, FaSignOutAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch admin profile
  const fetchAdminProfile = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admintoken')}`
        }
      });

      if (response.data.success) {
        setAdminData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      toast.error('Failed to load profile');
    }
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  // Logout function
  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem('admintoken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminPermissions');
    localStorage.removeItem('adminSession');
    
    // Clear any other admin-related data
    sessionStorage.clear();
    
    // Show success message
    toast.success('Password updated successfully. Please login again.');
    
    // Redirect to login page
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  // Change password
  const changePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }


    setIsLoading(true);

    try {
      const response = await axios.put(`${base_url}/api/admin/update-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admintoken')}`
        }
      });

      if (response.data.success) {
        // Clear localStorage and logout
        handleLogout();
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  // Calculate password strength percentage
  const getPasswordStrengthPercentage = () => {
    const checks = Object.values(passwordStrength);
    const trueCount = checks.filter(Boolean).length;
    return (trueCount / checks.length) * 100;
  };

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    const percentage = getPasswordStrengthPercentage();
    if (percentage === 0) return { color: 'bg-gray-200', text: 'Not set', textColor: 'text-gray-600' };
    if (percentage <= 40) return { color: 'bg-red-500', text: 'Weak', textColor: 'text-red-600' };
    if (percentage <= 60) return { color: 'bg-yellow-500', text: 'Fair', textColor: 'text-yellow-600' };
    if (percentage <= 80) return { color: 'bg-blue-500', text: 'Good', textColor: 'text-blue-600' };
    return { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-600' };
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const strengthInfo = getPasswordStrengthInfo();

  return (
    <section className="font-nunito min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden sticky top-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-lg font-semibold text-white flex items-center">
                    <FaUser className="mr-2" /> Account Information
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-white text-3xl font-bold">
                        {adminData?.username?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {adminData?.username || 'Admin User'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {adminData?.role || 'Administrator'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <FaEnvelope className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Email Address</span>
                      </div>
                      <p className="text-gray-900 font-medium break-all">{adminData?.email || 'N/A'}</p>
                      <div className="mt-2 flex items-center">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          <FaCheck className="mr-1" size={10} />
                          {adminData?.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <FaLock className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Account Status</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 ${adminData?.isActive ? 'bg-green-500' : 'bg-red-500'} rounded-full mr-2`}></div>
                        <span className="text-gray-900 font-medium">{adminData?.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>

                    {adminData?.createdAt && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                          <FaHistory className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-600">Member Since</span>
                        </div>
                        <p className="text-gray-900 font-medium">
                          {formatDate(adminData.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <FaKey className="mr-2" /> Change Password
                  </h2>
                </div>
                
                <div className="p-8">
                  <form onSubmit={changePassword} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12 transition-all"
                          placeholder="Enter your current password"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          disabled={isLoading}
                        >
                          {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12 transition-all"
                          placeholder="Enter your new password"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          disabled={isLoading}
                        >
                          {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>

                      {/* Password Requirements */}
                      {passwordForm.newPassword && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                          <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center text-xs">
                              <span className={`mr-2 ${passwordStrength.length ? 'text-green-500' : 'text-gray-400'}`}>
                                {passwordStrength.length ? <FaCheck size={10} /> : '○'}
                              </span>
                              <span className={passwordStrength.length ? 'text-green-700' : 'text-gray-500'}>
                                At least 8 characters
                              </span>
                            </div>
                            <div className="flex items-center text-xs">
                              <span className={`mr-2 ${passwordStrength.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
                                {passwordStrength.uppercase ? <FaCheck size={10} /> : '○'}
                              </span>
                              <span className={passwordStrength.uppercase ? 'text-green-700' : 'text-gray-500'}>
                                One uppercase letter
                              </span>
                            </div>
                            <div className="flex items-center text-xs">
                              <span className={`mr-2 ${passwordStrength.lowercase ? 'text-green-500' : 'text-gray-400'}`}>
                                {passwordStrength.lowercase ? <FaCheck size={10} /> : '○'}
                              </span>
                              <span className={passwordStrength.lowercase ? 'text-green-700' : 'text-gray-500'}>
                                One lowercase letter
                              </span>
                            </div>
                            <div className="flex items-center text-xs">
                              <span className={`mr-2 ${passwordStrength.number ? 'text-green-500' : 'text-gray-400'}`}>
                                {passwordStrength.number ? <FaCheck size={10} /> : '○'}
                              </span>
                              <span className={passwordStrength.number ? 'text-green-700' : 'text-gray-500'}>
                                One number
                              </span>
                            </div>
                            <div className="flex items-center text-xs col-span-2">
                              <span className={`mr-2 ${passwordStrength.special ? 'text-green-500' : 'text-gray-400'}`}>
                                {passwordStrength.special ? <FaCheck size={10} /> : '○'}
                              </span>
                              <span className={passwordStrength.special ? 'text-green-700' : 'text-gray-500'}>
                                One special character (!@#$%^&*)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Password Strength Meter */}
                      {passwordForm.newPassword && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-600">Password Strength</span>
                            <span className={`text-xs font-medium ${strengthInfo.textColor}`}>
                              {strengthInfo.text}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${strengthInfo.color} transition-all duration-300`}
                              style={{ width: `${getPasswordStrengthPercentage()}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12 transition-all"
                          placeholder="Confirm your new password"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      
                      {/* Password Match Indicator */}
                      {passwordForm.confirmPassword && (
                        <div className="mt-2">
                          {passwordForm.newPassword === passwordForm.confirmPassword ? (
                            <p className="text-xs text-green-600 flex items-center">
                              <FaCheck className="mr-1" size={10} />
                              Passwords match
                            </p>
                          ) : (
                            <p className="text-xs text-red-600 flex items-center">
                              <FaExclamationTriangle className="mr-1" size={10} />
                              Passwords do not match
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Important Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start">
                        <FaShieldAlt className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 mb-1">Important Security Note</h4>
                          <p className="text-xs text-blue-700">
                            After changing your password, you will be logged out for security reasons. 
                            You'll need to log in again with your new password.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center font-medium shadow-lg shadow-orange-200 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating Password...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity - Only show if data exists */}
          {adminData?.recentActivities && adminData.recentActivities.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaBell className="mr-2 text-orange-600" />
                Recent Security Activity
              </h3>
              <div className="space-y-3">
                {adminData.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 ${activity.type === 'password' ? 'bg-green-500' : 'bg-blue-500'} rounded-full mr-3`}></div>
                      <span className="text-sm text-gray-600">{activity.description}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(activity.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default Profile;