import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiChevronRight, FiHome, FiUsers, FiSettings, FiBell, FiActivity, FiTrendingUp, 
  FiBarChart2, FiLayers, FiCreditCard, FiCalendar, FiBox, FiMessageSquare, 
  FiLogIn, FiFileText, FiShare2, FiGift, FiUserPlus, FiDollarSign, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import { RiCoinsLine, RiRefund2Line } from 'react-icons/ri';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const base_url = import.meta.env.VITE_API_KEY_Base_URL;

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [notifications, setNotifications] = useState(5);
  const navigate = useNavigate();
  
  const sidebarRef = useRef(null);
  const activeMenuItemRef = useRef(null);
  
  const [withdrawalCounts, setWithdrawalCounts] = useState({ pending: 0, approved: 0, rejected: 0, history: 0 });
  const [depositCounts, setDepositCounts] = useState({ pending: 0, approved: 0, rejected: 0, history: 0 });
  const [affiliateCounts, setAffiliateCounts] = useState({ pendingRegistrations: 0, total: 0, active: 0, pendingPayouts: 0, masterAffiliates: 0, superAffiliates: 0 });

  const logout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admintoken");
    navigate("/login");
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const withdrawalResponse = await axios.get(`${base_url}/api/admin/withdrawals/counts`);
        if (withdrawalResponse.data.success) setWithdrawalCounts(withdrawalResponse.data.counts);
        const depositResponse = await axios.get(`${base_url}/api/admin/deposits/counts`);
        if (depositResponse.data.success) setDepositCounts(depositResponse.data.counts);
        const affiliateResponse = await axios.get(`${base_url}/api/admin/affiliates/counts`);
        if (affiliateResponse.data.success) setAffiliateCounts(affiliateResponse.data.counts);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };
    fetchCounts();
    const intervalId = setInterval(fetchCounts, 30000);
    return () => clearInterval(intervalId);
  }, [location]);

  useEffect(() => {
    const path = location.pathname;
    const menuMapping = {
      '/deposit-bonus': 'depositBonus',
      '/users': 'users',
      '/withdraw': 'withdraw',
      '/deposit': 'deposit',
      '/bet-logs': 'betLogs',
      '/games-management': 'games',
      '/affiliate': 'affiliate',
      '/login-logs': 'loginLogs',
      '/content': 'content',
      '/notifications': 'notifications',
      '/opay': 'opay',
      '/event-management': 'event',
      '/notice-management': 'notice',
      '/social-address': 'social',
      '/payment-method': 'method'
    };
    const matchedKey = Object.keys(menuMapping).find(key => path.startsWith(key));
    // Only update openMenu if it's different to avoid unnecessary re-renders
    const newOpenMenu = matchedKey ? menuMapping[matchedKey] : null;
    if (newOpenMenu !== openMenu) {
      setOpenMenu(newOpenMenu);
    }
  }, [location.pathname]); // Removed openMenu from dependencies to avoid loop

  // Auto-scroll to active menu item when location changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      if (activeMenuItemRef.current && sidebarRef.current) {
        const sidebarContainer = sidebarRef.current;
        const activeElement = activeMenuItemRef.current;
        
        // Get the position of the active element relative to the sidebar container
        const scrollTop = activeElement.offsetTop - (sidebarContainer.clientHeight / 2) + (activeElement.clientHeight / 2);
        
        // Smooth scroll to the calculated position
        sidebarContainer.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, openMenu]);

  const handleToggle = (menu) => {
    // Toggle the menu - don't close when clicking submenu items
    setOpenMenu(prev => (prev === menu ? null : menu));
  };
  
  const formatCount = (count) => (count > 99 ? '99+' : count);

  const getBadgeColor = (count, type = 'default') => {
    if (count === 0) return 'bg-gray-700';
    switch(type) {
      case 'pending': return 'bg-yellow-600 animate-pulse';
      case 'success': return 'bg-green-600';
      case 'danger': return 'bg-red-600';
      default: return 'bg-[#d4af37] text-[#1a1c23]';
    }
  };

  // Helper to render Category Titles
  const SectionTitle = ({ title }) => (
    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3 mt-6 px-3">
      {title}
    </p>
  );

  // Function to render each menu item (to keep code clean)
  function renderMenuItem({ label, icon, key, links, count: menuCount }) {
    const isMenuOpen = openMenu === key;
    
    return (
      <div key={key} className="mb-2">
        <div 
          onClick={() => handleToggle(key)} 
          className={`flex items-center justify-between w-full px-3 py-2.5 text-[14px] cursor-pointer transition-all duration-300 ${isMenuOpen ? 'bg-[#252831] text-[#d4af37] border-l-4 border-[#d4af37]' : 'text-gray-400 hover:bg-[#1a1c23] hover:text-gray-200'}`}
        >
          <span className="flex items-center gap-3">{icon} {label}</span>
          <div className="flex items-center gap-2">
            {menuCount > 0 && <span className="bg-[#d4af37] text-[#1a1c23] text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{formatCount(menuCount)}</span>}
            <FiChevronRight className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} />
          </div>
        </div>
        <div className={`ml-6 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 mt-2' : 'max-h-0'}`}>
          {links.map(({ to, text, count, type }) => (
            <NavLink 
              key={text} 
              to={to} 
              ref={(el) => {
                // Set ref if this link is active
                if (el && location.pathname === to) {
                  activeMenuItemRef.current = el;
                }
              }}
              className={({ isActive }) => `flex items-center px-3 py-2 text-[13px] rounded-md transition-colors ${isActive ? 'text-[#d4af37] font-bold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <div className={`w-1 h-1 rounded-full mr-3 ${location.pathname === to ? 'bg-[#d4af37]' : 'bg-gray-700'}`}></div>
              {text}
              {count > 0 && <span className={`ml-auto text-[10px] px-1.5 rounded-full text-white ${getBadgeColor(count, type)}`}>{formatCount(count)}</span>}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside ref={sidebarRef} className={`transition-all no-scrollbar duration-300 overflow-y-auto fixed w-[70%] md:w-[40%] lg:w-[28%] xl:w-[17%] h-full z-[999] border-r border-gray-800 text-sm shadow-2xl pt-[12vh] p-4 ${isOpen ? 'left-0 top-0' : 'left-[-120%] top-0'} bg-[#161B22] text-white`}>
      
      <div className="mb-3">
        <NavLink 
          to="/dashboard" 
          ref={(el) => {
            if (el && location.pathname === '/dashboard') {
              activeMenuItemRef.current = el;
            }
          }}
          className={({ isActive }) => `flex items-center justify-between w-full px-3 py-2.5 text-[15px] cursor-pointer rounded-lg transition-all duration-300 ${isActive ? 'bg-[#d4af37] text-[#1a1c23] font-bold shadow-lg' : 'hover:bg-[#252831] text-gray-400 hover:text-[#d4af37]'}`}
        >
          <span className="flex items-center gap-3"><FiHome className="text-[18px]" /> Dashboard</span>
        </NavLink>
      </div>

      <SectionTitle title="Gaming & Logs" />
      {[
        {
          label: 'Games Management', icon: <FiBox />, key: 'games',
          links: [
            { to: '/games-management/new-game', text: 'New Game' },
            { to: '/games-management/all-games', text: 'All Games' },
            { to: '/games-management/active-games', text: 'Active Games' },
            { to: '/games-management/deactive-games', text: 'Deactive Games' },
            { to: '/games-management/menu-games', text: 'Menu Games' },
            { to: '/games-management/game-categories', text: 'Game Categories' },
            { to: '/games-management/game-providers', text: 'Game Providers' },
          ],
        },
        {
          label: 'Bet Logs', icon: <FiActivity />, key: 'betLogs',
          links: [
            { to: '/bet-logs/bet-logs', text: 'All Bets' },
            { to: '/bet-logs/hight-stakes-bet-logs', text: 'High Stakes Bets' },
          ],
        },
      ].map((item) => renderMenuItem(item))}

      <SectionTitle title="Finance" />
      {[
        {
          label: 'Deposit Management', icon: <RiCoinsLine />, key: 'deposit',
          links: [
            { to: '/deposit/pending', text: 'Pending Deposits', count: depositCounts.pending, type: 'pending' },
            { to: '/deposit/approved', text: 'Approved Deposits', count: depositCounts.approved, type: 'success' },
            { to: '/deposit/rejected', text: 'Rejected Deposits', count: depositCounts.rejected, type: 'danger' },
            { to: '/deposit/history', text: 'Deposit History', count: depositCounts.history },
          ],
        },
        {
          label: 'Withdrawal Management', icon: <RiRefund2Line />, key: 'withdraw',
          links: [
            { to: '/withdraw/pending', text: 'Pending Withdrawals', count: withdrawalCounts.pending, type: 'pending' },
            { to: '/withdraw/approved', text: 'Approved Withdrawals', count: withdrawalCounts.approved, type: 'success' },
            { to: '/withdraw/rejected', text: 'Rejected Withdrawals', count: withdrawalCounts.rejected, type: 'danger' },
            { to: '/withdraw/history', text: 'Withdraw History', count: withdrawalCounts.history },
          ],
        },
        {
          label: 'Deposit Bonus System', icon: <FiGift />, key: 'depositBonus',
          links: [
            { to: '/deposit-bonus/create-bonus', text: 'Create Bonus' },
            { to: '/deposit-bonus/all-bonuses', text: 'All Bonuses' },
          ],
        },
        {
          label: 'Payment Method', icon: <FiCreditCard />, key: 'method',
          links: [
            { to: '/payment-method/all-deposit-method', text: 'Deposit Method' },
            { to: '/payment-method/new-deposit-method', text: 'New Deposit Method' },
            { to: '/payment-method/all-withdraw-method', text: 'Withdraw Method' },
            { to: '/payment-method/new-withdraw-method', text: 'New Withdraw Method' },
          ],
        },
        {
          label: 'Opay Setting', icon: <FiSettings />, key: 'opay',
          links: [
            { to: '/opay/api-settings', text: 'Opay Api' },
            { to: '/opay/device-monitoring', text: 'Device Monitoring' },
            { to: '/opay/deposit', text: 'Opay Deposit' },
          ],
        },
      ].map((item) => renderMenuItem(item))}

      <SectionTitle title="User & Access" />
      {[
        {
          label: 'User Management', icon: <FiUsers />, key: 'users',
          links: [
            { to: '/users/all-users', text: 'All Users' },
            { to: '/users/active-users', text: 'Active Users' },
            { to: '/users/inactive-users', text: 'Inactive Users' },
          ],
        },
        {
          label: 'Affiliate Management', icon: <FiTrendingUp />, key: 'affiliate',
          count: affiliateCounts.pendingRegistrations,
          links: [
            { to: '/affiliates/all-affiliates', text: 'All Affiliates', count: affiliateCounts.total },
            { to: '/affiliates/manage-commission', text: 'Manage Commission' },
            { to: '/affiliates/payout', text: 'Payouts', count: affiliateCounts.pendingPayouts, type: 'pending' },
          ],
        },
        {
          label: 'Login Logs & Security', icon: <FiLogIn />, key: 'loginLogs',
          links: [
            { to: '/login-logs/all-logs', text: 'All Login Logs' },
            { to: '/login-logs/failed-logins', text: 'Failed Login Attempts' },
          ],
        },
      ].map((item) => renderMenuItem(item))}

      <SectionTitle title="App Settings" />
      {[
        {
          label: 'Event Management', icon: <FiCalendar />, key: 'event',
          links: [
            { to: '/event-management/create-event', text: 'Create Event' },
            { to: '/event-management/all-events', text: 'All Events' },
          ],
        },
        {
          label: 'Notice Management', icon: <FiFileText />, key: 'notice',
          links: [{ to: '/notice-management/create-notice', text: 'Create Notice' }],
        },
        {
          label: 'Content Management', icon: <FiLayers />, key: 'content',
          links: [
            { to: '/content/banner-and-sliders', text: 'Banners & Sliders' },
            { to: '/content/promotional-content', text: 'Promotional Content' },
            { to: '/content/terms-and-conditions', text: 'Terms & Conditions' },
            { to: '/content/faq', text: 'FAQ Management' },
            { to: '/content/logo-and-favicon', text: 'Logo And Favicon' },
          ],
        },
        {
          label: 'Notification Management', icon: <FiBell />, key: 'notifications',
          links: [
            { to: '/notifications/send-notification', text: 'Send Notification' },
            { to: '/notifications/all-notifications', text: 'All Notifications' },
          ],
        },
        {
          label: 'Social Address', icon: <FiShare2 />, key: 'social',
          links: [{ to: '/social-address/social-links', text: 'All Social Links' }],
        },
      ].map((item) => renderMenuItem(item))}

      {/* Profile & Support Section */}
      <SectionTitle title="Support" />
      <div className="mb-3">
        <NavLink 
          to="/admin-profile" 
          ref={(el) => {
            if (el && location.pathname === '/admin-profile') {
              activeMenuItemRef.current = el;
            }
          }}
          className={({ isActive }) => `flex items-center justify-between w-full px-3 py-2.5 text-[15px] cursor-pointer rounded-lg transition-all ${isActive ? 'bg-[#d4af37] text-[#1a1c23] font-bold' : 'text-gray-400 hover:text-[#d4af37]'}`}
        >
          <span className="flex items-center gap-3"><FiUsers /> Admin Profile</span>
        </NavLink>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <button onClick={logout} className="flex items-center w-full px-3 py-2.5 text-gray-400 hover:text-red-500 transition-colors">
          <FiSettings className="mr-3" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;