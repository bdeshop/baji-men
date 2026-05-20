import React, { useState, useEffect, createContext, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import { Slider } from "../../components/home_componets/Slider";
import Footer from "../../components/footer/Footer";
import { AiOutlineSound } from "react-icons/ai";
import { FaGift, FaCoins, FaTrophy, FaCheckCircle } from "react-icons/fa";
import Category from "../../components/home_componets/category/Categroy";
import ProviderSlider from "../../components/home_componets/provider/ProviderSlider";
import Event from "../../components/home_componets/event/Event";
import Featured from "../../components/home_componets/featured/Featured";
import logo from "../../assets/logo.png";
import axios from 'axios';
import { Mobileslider } from "../../components/home_componets/Mobileslider";
import Sports from "../../components/home_componets/sports/Sports";

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use the auth context
const useAuth = () => {
  return useContext(AuthContext);
};

// Cache for user data to prevent unnecessary API calls
let userCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    // Check cache first
    if (userCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setUser(userCache);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${base_url}/api/user/my-information`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        userCache = data.data;
        cacheTimestamp = Date.now();
        setUser(data.data);
      } else {
        localStorage.removeItem('token');
        userCache = null;
        cacheTimestamp = null;
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      userCache = null;
      cacheTimestamp = null;
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    userCache = userData;
    cacheTimestamp = Date.now();
    setUser(userData);
  };

  const value = {
    user,
    login,
    checkAuthStatus,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Confetti Animation Component
const ConfettiPiece = ({ style }) => {
  return (
    <div 
      className="absolute w-2 h-3 rounded-sm"
      style={style}
    />
  );
};

// Bonus Animation Modal Component
const BonusAnimation = ({ onClose, bonusAmount = 200 }) => {
  const [animationStage, setAnimationStage] = useState('entering'); // entering, bouncing, showing, exiting
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces = [];
    const colors = ['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
    
    for (let i = 0; i < 150; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = 2 + Math.random() * 3;
      const size = 4 + Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      pieces.push({
        id: i,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        backgroundColor: color,
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${Math.random() * 360}deg)`
      });
    }
    setConfettiPieces(pieces);

    // Animation sequence
    setTimeout(() => setAnimationStage('bouncing'), 500);
    setTimeout(() => setAnimationStage('showing'), 1500);
    setTimeout(() => {
      setAnimationStage('exiting');
      setTimeout(onClose, 500);
    }, 4000);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[10000001] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          animationStage === 'exiting' ? 'opacity-0' : 'opacity-70'
        }`}
        onClick={onClose}
      />
      
      {/* Confetti Container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map(piece => (
          <div
            key={piece.id}
            className="absolute animate-confetti"
            style={{
              left: piece.left,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.backgroundColor,
              transform: piece.transform,
              animationDelay: piece.animationDelay,
              animationDuration: piece.animationDuration,
            }}
          />
        ))}
      </div>

      {/* Main Modal */}
      <div 
        className={`relative transform transition-all duration-500 ${
          animationStage === 'entering' ? 'scale-50 opacity-0' :
          animationStage === 'exiting' ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-3xl p-8 max-w-md mx-4 shadow-2xl border-4 border-yellow-300 animate-bounce-gentle">
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-yellow-400 blur-xl opacity-50 -z-10" />
          
          {/* Icon Container */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-yellow-300 rounded-full blur-lg animate-ping-slow" />
              <div className="relative bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full p-6 animate-spin-slow">
                <FaGift className="text-6xl text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-3 animate-slide-up">
            🎉 Congratulations! 🎉
          </h2>
          
          {/* Bonus Amount */}
          <div className="text-center mb-6">
            <p className="text-white text-lg mb-2">You've received</p>
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur rounded-full px-6 py-3 animate-pulse-gold">
              <FaCoins className="text-3xl text-yellow-300 animate-spin-coin" />
              <span className="text-4xl md:text-5xl font-bold text-yellow-300">
                ৳{bonusAmount}
              </span>
              <FaTrophy className="text-3xl text-yellow-300" />
            </div>
            <p className="text-white/90 text-sm mt-3">Bonus Balance Added!</p>
          </div>

          {/* Checkmark */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-500 rounded-full p-2 animate-checkmark">
              <FaCheckCircle className="text-4xl text-white" />
            </div>
          </div>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Claim Your Bonus
          </button>
        </div>
      </div>
    </div>
  );
};

const HomeContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const [notice, setNotice] = useState("");
  const [showBonusAnimation, setShowBonusAnimation] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(200);
  const { user, checkAuthStatus } = useAuth();

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [brandingCache, setBrandingCache] = useState(null);

  // Check for new registration and show bonus animation
  useEffect(() => {
    const checkRegistrationBonus = async () => {
      // Check if user just registered
      const justRegistered = localStorage.getItem('just_registered');
      const registrationTime = localStorage.getItem('registration_time');
      
      if (justRegistered === 'true' && registrationTime) {
        // Check if within last 10 seconds
        if (Date.now() - parseInt(registrationTime) < 10000) {
          // Verify user has the bonus
          if (user && user.balance >= 200) {
            setBonusAmount(200);
            setShowBonusAnimation(true);
            // Clear the registration flag
            localStorage.removeItem('just_registered');
            localStorage.removeItem('registration_time');
          }
        } else {
          // Clear old registration data
          localStorage.removeItem('just_registered');
          localStorage.removeItem('registration_time');
        }
      }
    };

    if (user) {
      checkRegistrationBonus();
    }
  }, [user]);

  const fetchBrandingData = async () => {
    if (brandingCache) {
      setDynamicLogo(brandingCache);
      return;
    }

    const cachedBranding = localStorage.getItem('branding_logo');
    const cacheTime = localStorage.getItem('branding_cache_time');
    
    if (cachedBranding && cacheTime && Date.now() - parseInt(cacheTime) < 30 * 60 * 1000) {
      setDynamicLogo(cachedBranding);
      setBrandingCache(cachedBranding);
      return;
    }

    try {
      const response = await axios.get(`${base_url}/api/branding`);
      if (response.data.success && response.data.data && response.data.data.logo) {
        const logoUrl = response.data.data.logo.startsWith('http') 
          ? response.data.data.logo 
          : `${base_url}${response.data.data.logo.startsWith('/') ? '' : '/'}${response.data.data.logo}`;
        
        setDynamicLogo(logoUrl);
        setBrandingCache(logoUrl);
        localStorage.setItem('branding_logo', logoUrl);
        localStorage.setItem('branding_cache_time', Date.now().toString());
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
    }
  };

  const fetchNotice = async () => {
    try {
      const response = await axios.get(`${base_url}/api/notice`);
      
      if (response.data.success) {
        if (response.data.data && response.data.data.title) {
          setNotice(response.data.data.title);
          localStorage.setItem('notice_data', JSON.stringify({
            title: response.data.data.title,
            timestamp: Date.now()
          }));
        } else {
          setNotice("Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!");
          localStorage.setItem('notice_data', JSON.stringify({
            title: "Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!",
            timestamp: Date.now()
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching notice:", error);
      const cachedNotice = localStorage.getItem('notice_data');
      if (cachedNotice) {
        const parsedNotice = JSON.parse(cachedNotice);
        if (Date.now() - parsedNotice.timestamp < 60 * 60 * 1000) {
          setNotice(parsedNotice.title);
        } else {
          setNotice("Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!");
        }
      } else {
        setNotice("Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!");
      }
    }
  };

  const providers = [
    {
      name: "Every",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmsexy.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "JL",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmjili.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "JIU",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmjili.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "EVO",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-evo.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "JD",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-jdb.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "JDB",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-jdb.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "FC",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmfc.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "FG Chat",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmyesbingo.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Yellow Bot",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmyesbingo.png?v=1754999737902&source=drccdnsrc",
    },
  ];

  const events = [
    {
      name: "HUNDRED",
      image: "https://img.b112j.com/upload/announcement/image_247589.jpg",
      time: "23:30",
      date: "19 AUG 2025 (TUE)",
    },
    {
      name: "PATRICTS",
      image: "https://img.b112j.com/upload/announcement/image_247687.jpg",
      time: "05:00",
      date: "20 AUG 2025 (WED)",
    },
    {
      name: "HUNDRED",
      image: "https://img.b112j.com/upload/announcement/image_247589.jpg",
      time: "20:00",
      date: "20 AUG 2025 (WED)",
    },
  ];

  const featuredGames = [
    {
      name: "MAGIC ACE",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-super-elements.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "WILD LOCK",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-money-wheel.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "PIGGY BANK",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-divas-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "FRUITY BONANZA",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-golden-genie.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "SUGAR BANG BANG 2",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-the-kings-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "OUTES OF QIYMPUS",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-super-elements.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "SUPER BANK",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-money-wheel.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "SWEET BOX AND SPOT DOWN",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-divas-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "SUPER ACE",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-golden-genie.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "BOX IN KINI",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-the-kings-ace.png?v=1754999737902&source=drccdnsrc",
    },
  ];

  const exclusiveCategories = [
    {
      name: "Sports",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-sport.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Casino",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-casino.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Slots",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-slot.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Table",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-table.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Fishing",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-fish.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Crash",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-crash.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Arcade",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-arcade.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Lottery",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-lottery.png?v=1754999737902&source=drccdnsrc",
    },
  ];

  const effectsGames = [
    {
      name: "Super",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-super-elements.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Flaments",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-money-wheel.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "BLOODY",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-fortune-gems.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "WATER",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-divas-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Parmin Grims",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-golden-genie.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "DIVAS AGB",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-the-kings-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "GOLDEN",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-super-elements.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "GEKLE",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-money-wheel.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "THERINGS",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-fortune-gems.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "ACB",
      image: "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-divas-ace.png?v=1754999737902&source=drccdnsrc",
    },
  ];

  useEffect(() => {
    let mounted = true;

    const isInitialLoad = performance.navigation.type === performance.navigation.TYPE_NAVIGATE ||
                         performance.navigation.type === performance.navigation.TYPE_RELOAD;

    if (isInitialLoad) {
      setIsLoading(true);
    }

    fetchBrandingData();
    fetchNotice();

    const handleLoad = () => {
      if (mounted) {
        setIsLoading(false);
      }
    };

    if (document.readyState === "complete") {
      if (mounted) {
        setIsLoading(false);
      }
    } else {
      window.addEventListener("load", handleLoad);

      const fallbackTimer = setTimeout(() => {
        if (mounted) {
          setIsLoading(false);
        }
      }, 3000);

      return () => {
        mounted = false;
        window.removeEventListener("load", handleLoad);
        clearTimeout(fallbackTimer);
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#1a1a1a] text-white">
      {/* Bonus Animation */}
      {showBonusAnimation && (
        <BonusAnimation 
          onClose={() => setShowBonusAnimation(false)} 
          bonusAmount={bonusAmount}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-[#0a0a0a] flex justify-center items-center z-[10000000]">
          <div className="relative w-36 h-36 md:w-44 md:h-44 flex justify-center items-center">
            <div 
              className="absolute w-full h-full rounded-full border-[5px] border-transparent border-t-[#ff0000] border-b-[#ff0000] animate-spin"
              style={{
                filter: 'drop-shadow(0 0 10px #ff0000) drop-shadow(0 0 4px #ff0000)',
                animationDuration: '1s'
              }}
            ></div>
            <div className="z-10 flex justify-center items-center">
              <img 
                className="w-[130px] md:w-[160px] object-contain" 
                src={dynamicLogo} 
                alt="Logo" 
              />
            </div>
          </div>
        </div>
      )}

      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className="flex-1 overflow-auto transition-all duration-300">
          <div className="">
            <div className="md:hidden">
              <Mobileslider/>
            </div>
            <div className="md:block hidden">
              <Slider />
            </div>
            <main className="mx-auto w-full max-w-screen-xl px-2 md:px-4 md:py-4">
              <div className="p-2 md:p-4 text-black border-[1px] border-gray-800 rounded-[5px] md:rounded-[10px] flex items-center justify-between">
                <AiOutlineSound className="text-xl text-theme_color mr-2" />
                <marquee
                  behavior="scroll"
                  scrollamount="10"
                  direction="left"
                  className="text-[12px] md:text-[14px] text-white flex-1 font-[400]"
                >
                  {notice || "Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!"}
                </marquee>
              </div>

              <Category />
              <ProviderSlider />
              <Event />
              <Sports/>
              <Featured />
            </main>

            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
};

export default Home;