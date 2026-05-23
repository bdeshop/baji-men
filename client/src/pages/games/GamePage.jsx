import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom"; // Add useSearchParams
import axios from "axios";
import { Header } from "../../components/header/Header";
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/logo.png";
import oracle_logo from "../../assets/red-logo.png"

const GamePage = () => {
  const { gameuuid } = useParams();
  const [searchParams] = useSearchParams(); // Get query parameters
  const [gameLink, setGameLink] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [minLoaderTimePassed, setMinLoaderTimePassed] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showIframeLoader, setShowIframeLoader] = useState(true);
  const videoRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get provider and category from query parameters
  const provider = searchParams.get('provider');
  const category = searchParams.get('category');

  // Minimum loader time (3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoaderTimePassed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Iframe loader timer (4 seconds)
  useEffect(() => {
    let timer;
    if (iframeLoaded) {
      timer = setTimeout(() => {
        setShowIframeLoader(false);
      }, 4000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [iframeLoaded]);

  // Fetch user data from localStorage and API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("usertoken");

        if (!token) {
          setError("Authentication token not found");
          setIsLoading(false);
          return;
        }

        // Fetch user information
        const userResponse = await axios.get(
          `${API_BASE_URL}/api/user/all-information/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
     
        if (userResponse.data.success) {
          setUserData(userResponse.data.data);
        } else {
          setError(userResponse.data.message);
          setIsLoading(false);
        }
      } catch (err) {
        setError("Failed to fetch user data");
        console.error("Error fetching data:", err);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch game link when userData and gameuuid are available
  useEffect(() => {
    const fetchGameLink = async () => {
      if (!gameuuid || !userData) return;
      setError(null);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        
        // Log the provider and category for debugging
        console.log("Provider from query:", provider);
        console.log("Category from query:", category);
        
        const response = await axios.post(
          `${API_BASE_URL}/api/user/getGameLink`,
          {
            gameID: gameuuid,
            money: parseInt(userData?.balance || 0, 10),
            username: user?.username,
            provider: provider, // Pass provider from query
            category: category, // Pass category from query
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("usertoken")}`,
            },
          }
        );
        console.log(response)
        const link = response.data?.joyhobeResponse;
        if (link) {
          setGameLink(link.launch_url);
        } else {
          throw new Error("Game link not found in response");
        }
      } catch (error) {
        console.error("Error fetching game link:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (gameuuid && userData) {
      fetchGameLink();
    }
  }, [gameuuid, userData, API_BASE_URL, provider, category]); // Add provider and category to dependencies

  // Professional Unified Loader Component
  const ProfessionalLoader = ({ message = "গেম লোড হচ্ছে", subMessage = "অনুগ্রহ করে একটু অপেক্ষা করুন..." }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-30">
      {/* Main loader container */}
      <div className="relative flex flex-col items-center justify-center">
    
        {/* Loading text */}
        <div className="flex justify-center items-center text-center mt-8 space-y-2">
          <img className="w-[150px]" src={logo} alt="" />
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1.5 bg-gray-700 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );

  // Determine what to show in the iframe box
  const renderIframeContent = () => {

    // Show iframe when everything is ready
    return (
      <div className="w-full h-full relative">
        {/* Game Iframe */}
       <a target="_blank" href={gameLink} className="absolute top-4 right-4 z-20 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Open in New Tab</a>
      
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
      {/* Main Content */}
      <div className="flex h-[100vh]">
        <div className={`flex-1 overflow-auto transition-all duration-300 relative`}>
          {/* Iframe Container */}
          <div className="w-full h-full relative md:border-[1px] border-gray-700 rounded-lg overflow-hidden bg-black">
            {renderIframeContent()}
          </div>
        </div>
      </div>

      {/* Add custom animation for progress bar */}
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default GamePage;