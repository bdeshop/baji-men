import React, { useState, useEffect } from "react";
import { FaUpload, FaTimes, FaSpinner, FaFilter, FaGamepad, FaSearch, FaImage, FaEdit, FaCheck } from "react-icons/fa";
import { MdCategory, MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-toastify";
import axios from "axios";

const Newgames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const premium_api_key = import.meta.env.VITE_PREMIUM_API_KEY;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [useDefaultImage, setUseDefaultImage] = useState({});
  const [localGames, setLocalGames] = useState([]);
  const [editingGame, setEditingGame] = useState(null);

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingGameId, setSavingGameId] = useState(null);
  const [updatingGameId, setUpdatingGameId] = useState(null);
  const [showProvidersDropdown, setShowProvidersDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);

  // Create axios instances
  const api = axios.create({
    baseURL: base_url,
    timeout: 30000,
  });

  const oracleApi = axios.create({
    baseURL: "https://api.oraclegames.live/api",
    timeout: 30000,
    headers: {
      "x-api-key": premium_api_key,
      "Content-Type": "application/json"
    }
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Custom Select Component
  const CustomSelect = ({ 
    options, 
    value, 
    onChange, 
    placeholder, 
    loading, 
    icon: Icon, 
    dropdownOpen, 
    setDropdownOpen,
    label 
  }) => {
    const selectedOption = options.find(opt => opt._id === value || opt.value === value);
    
    const getDisplayName = (option) => {
      return option.providerName || option.name || option.label || option.providerCode || 'Unknown';
    };
    
    return (
      <div className="relative w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={loading}
            className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex items-center justify-between transition-all duration-200 hover:border-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="text-gray-400 text-lg" />}
              <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
                {loading ? `Loading ${placeholder}...` : 
                 selectedOption ? getDisplayName(selectedOption) : 
                 `Select ${placeholder}`}
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  {loading ? 'Loading...' : 'No options available'}
                </div>
              ) : (
                options.map((option) => (
                  <div
                    key={option._id || option.value}
                    onClick={() => {
                      onChange(option._id || option.value);
                      setDropdownOpen(false);
                    }}
                    className={`px-4 py-3 cursor-pointer flex items-center space-x-3 transition-colors duration-150 ${
                      value === (option._id || option.value)
                        ? 'bg-orange-50 text-orange-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {value === (option._id || option.value) ? (
                      <MdCheckBox className="text-orange-500 text-lg" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="text-gray-400 text-lg" />
                    )}
                    <span>{getDisplayName(option)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom Checkbox Component
  const CustomCheckbox = ({ id, checked, onChange, label, description }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150">
      <div className="relative flex items-center h-5 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="hidden"
        />
        <label htmlFor={id} className="cursor-pointer">
          <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
            checked 
              ? 'bg-orange-500 border-orange-500' 
              : 'bg-white border-gray-300 hover:border-orange-400'
          }`}>
            {checked && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
      </div>
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer select-none">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  // Search Component
  const SearchBar = () => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaSearch className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search games by name..."
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );

  // Function to filter games based on search term
  const filterGamesBySearch = (gamesList, term) => {
    if (!term.trim()) return gamesList;
    
    const searchTermLower = term.toLowerCase();
    return gamesList.filter(game => 
      game.gameName?.toLowerCase().includes(searchTermLower) ||
      (game.provider?.providerName?.toLowerCase().includes(searchTermLower) || false)
    );
  };

  // Fetch categories from local API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await api.get('/api/admin/game-categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        if (error.response) {
          toast.error(`Failed to fetch categories: ${error.response.data.message || error.response.statusText}`);
        } else if (error.request) {
          toast.error('Failed to fetch categories: No response from server');
        } else {
          toast.error('Failed to fetch categories: ' + error.message);
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch and merge providers
  useEffect(() => {
    const fetchAndMergeProviders = async () => {
      setLoadingProviders(true);
      try {
        const [localRes, externalRes] = await Promise.all([
          api.get('/api/admin/game-providers'),
          oracleApi.get('/providers')
        ]);

        const localProviders = localRes.data;
        const externalProviders = externalRes.data;
        const localProviderCodes = new Set(
          localProviders.map((p) => p.providerCode || p.providerName)
        );

        const mergedProviders = externalProviders.data.filter((p) => {
          return localProviderCodes.has(p.providerCode) || 
                 localProviderCodes.has(p.providerName) ||
                 localProviderCodes.has(p.code);
        });

        console.log("Merged Providers:", mergedProviders);
        setProviders(mergedProviders);
      } catch (error) {
        console.error("Error fetching and merging providers:", error);
        if (error.response) {
          toast.error(`Failed to fetch providers: ${error.response.data.message || error.response.statusText}`);
        } else if (error.request) {
          toast.error('Failed to fetch providers: No response from server');
        } else {
          toast.error('Failed to fetch providers: ' + error.message);
        }
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchAndMergeProviders();
  }, []);

  // Function to fetch all games from local database
  const fetchAllLocalGames = async () => {
    try {
      const response = await api.get('/api/admin/games/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching local games:', error);
      if (error.response) {
        toast.error(`Failed to fetch local games: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        toast.error('Failed to fetch local games: No response from server');
      } else {
        toast.error('Failed to fetch local games: ' + error.message);
      }
      return [];
    }
  };

  // Fetch local games on component mount
  useEffect(() => {
    const fetchLocalGames = async () => {
      const games = await fetchAllLocalGames();
      setLocalGames(games);
    };
    fetchLocalGames();
  }, []);

  // Fetch games based on selected provider
  useEffect(() => {
    if (!selectedProvider) {
      setGames([]);
      setFilteredGames([]);
      setSearchTerm("");
      return;
    }

    const fetchAndFilterGames = async () => {
      setLoadingGames(true);
      setSearchTerm("");
      setUseDefaultImage({});
      setEditingGame(null);
      
      try {
        const selectedProviderObj = providers.find(p => p._id === selectedProvider || p.value === selectedProvider);
        const providerCode = selectedProviderObj?.providerCode || selectedProviderObj?.code;
        
        if (!providerCode) {
          toast.error("Invalid provider selection");
          return;
        }

        const oracleGamesRes = await oracleApi.get('/games?page=1&limit=5000');
        const oracleGamesData = oracleGamesRes.data;
        // Fetch latest local games
        const localGamesList = await fetchAllLocalGames();
        setLocalGames(localGamesList);
        
        // Create a map of existing games by game code
        const existingGamesMap = new Map();
        localGamesList.forEach(game => {
          const gameCode = game.game_code || game.gameCode || game.gameApiID;
          if (gameCode) {
            existingGamesMap.set(gameCode, game);
          }
        });

        // Get all games from the selected provider (both new and existing)
        const providerGames = oracleGamesData.data.filter(
          (game) => {
            const gameProviderCode = game.provider?.provider_code || game.provider?.code;
            return gameProviderCode === providerCode;
          }
        );

        // Transform the games for our UI
        const transformedGames = providerGames.map((externalGame) => {
          // Use game_code as the primary identifier
          const gameCode = externalGame.game_code || externalGame.code;
          
          // Find if this game exists by game_code
          const existingGame = localGamesList.find(g => 
            g.game_code === gameCode || g.gameApiID === gameCode
          );
          
          // Create a stable React key
          const uniqueId = gameCode;
          return {
            ...externalGame,
            _id: uniqueId,
            game_uuid: externalGame._id,
            name: externalGame.gameName || externalGame.name,
            gameCode: gameCode,
            provider: externalGame.provider,
            coverImage: externalGame.image,
            isSaved: !!existingGame,
            existingGameData: existingGame,
            localFeatured: existingGame?.featured || false,
            localStatus: existingGame?.status ?? true,
            localFullScreen: existingGame?.fullScreen || false,
            localCategory: existingGame?.category || selectedCategory || "",
            localPortraitImage: null,
            localPortraitPreview: null,
            localLandscapeImage: null,
            localLandscapePreview: null,
            useDefaultImage: true,
          };
        });

        setGames(transformedGames);
        setFilteredGames(transformedGames);
        
        // Initialize useDefaultImage state for all games
        const defaultImageState = {};
        transformedGames.forEach(game => {
          defaultImageState[game._id] = true;
        });
        setUseDefaultImage(defaultImageState);
        
      } catch (error) {
        console.error("Error fetching and filtering games:", error);
        if (error.response) {
          toast.error(`Failed to fetch games: ${error.response.data.message || error.response.statusText}`);
        } else if (error.request) {
          toast.error('Failed to fetch games: No response from server');
        } else {
          toast.error('Failed to fetch games: ' + error.message);
        }
      } finally {
        setLoadingGames(false);
      }
    };

    if (selectedProvider) {
      fetchAndFilterGames();
    }
  }, [selectedProvider, providers]);

  // Apply search filter whenever games or search term changes
  useEffect(() => {
    const searchFiltered = filterGamesBySearch(games, searchTerm);
    setFilteredGames(searchFiltered);
  }, [games, searchTerm]);

  // Update category for all games when selected category changes
  useEffect(() => {
    if (selectedCategory) {
      setGames(prevGames => 
        prevGames.map(game => ({
          ...game,
          localCategory: selectedCategory
        }))
      );
    }
  }, [selectedCategory]);

  const handleGameDataChange = (gameId, field, value) => {
    setGames((prevGames) =>
      prevGames.map((game) =>
        game._id === gameId ? { ...game, [field]: value } : game
      )
    );
  };

  const handleImageUpload = (gameId, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGames((prevGames) =>
        prevGames.map((game) => {
          if (game._id === gameId) {
            return {
              ...game,
              localPortraitImage: file,
              localPortraitPreview: reader.result,
              localLandscapeImage: file,
              localLandscapePreview: reader.result,
            };
          }
          return game;
        })
      );
      
      // When user uploads an image, disable default image mode for this game
      setUseDefaultImage(prev => ({
        ...prev,
        [gameId]: false
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (gameId) => {
    setGames((prevGames) =>
      prevGames.map((game) => {
        if (game._id === gameId) {
          return {
            ...game,
            localPortraitImage: null,
            localPortraitPreview: null,
            localLandscapeImage: null,
            localLandscapePreview: null,
          };
        }
        return game;
      })
    );
    
    // When image is removed, revert to default image mode
    setUseDefaultImage(prev => ({
      ...prev,
      [gameId]: true
    }));
  };

  const toggleUseDefaultImage = (gameId) => {
    setUseDefaultImage(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
    
    // If switching to default image, clear any uploaded image
    if (!useDefaultImage[gameId]) {
      setGames((prevGames) =>
        prevGames.map((game) => {
          if (game._id === gameId) {
            return {
              ...game,
              localPortraitImage: null,
              localPortraitPreview: null,
              localLandscapeImage: null,
              localLandscapePreview: null,
            };
          }
          return game;
        })
      );
    }
  };

  const handleEditGame = (game) => {
    setEditingGame(game._id);
    // Scroll to the game
    setTimeout(() => {
      document.getElementById(`game-${game._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
  };

  const handleSaveOrUpdateGame = async (gameId) => {
    const gameToSave = games.find((g) => g._id === gameId);
    
    // Validation
    if (!gameToSave.localCategory) {
      toast.error("Please select a category for the game.");
      return;
    }

    // Check if using default image or uploaded image
    const isUsingDefaultImage = useDefaultImage[gameId];
    
    if (!isUsingDefaultImage && !gameToSave.localPortraitImage) {
      toast.error("Please upload an image or use the default image.");
      return;
    }

    // Determine if this is an update or new game
    const isUpdate = gameToSave.isSaved;
    
    if (isUpdate) {
      setUpdatingGameId(gameId);
    } else {
      setSavingGameId(gameId);
    }

    try {
      const formData = new FormData();
      // Basic game info
      formData.append("gameApiID", gameToSave.game_code);
      formData.append("name", gameToSave.gameName || gameToSave.name);
      formData.append("provider", gameToSave.provider?.providerName || gameToSave.provider?.name || "");
      
      const selectedCat = categories.find(cat => 
        cat._id === gameToSave.localCategory || cat.name === gameToSave.localCategory
      );
      
      if (selectedCat) {
        formData.append("category", selectedCat.name);
      } else {
        formData.append("category", gameToSave.localCategory || "");
      }
      
      formData.append("featured", gameToSave.localFeatured);
      formData.append("status", gameToSave.localStatus);
      formData.append("fullScreen", gameToSave.localFullScreen);
      
      // Handle image based on selection
      if (isUsingDefaultImage) {
        // Use default image URL from API
        const defaultImageUrl = gameToSave.image || gameToSave.coverImage;
        if (defaultImageUrl) {
          formData.append("defaultImage", defaultImageUrl);
          formData.append("portraitImage", defaultImageUrl);
          formData.append("landscapeImage", defaultImageUrl);
        } else {
          toast.error("No default image available for this game.");
          if (isUpdate) {
            setUpdatingGameId(null);
          } else {
            setSavingGameId(null);
          }
          return;
        }
      } else {
        // Use uploaded image
        if (gameToSave.localPortraitImage) {
          formData.append("portraitImage", gameToSave.localPortraitImage);
          formData.append("landscapeImage", gameToSave.localPortraitImage);
        }
      }

      const url = isUpdate 
        ? `/api/admin/games/${gameToSave.existingGameData?._id || gameId}`
        : '/api/admin/games';
      
      let response;
      if (isUpdate) {
        response = await api.put(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await api.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      console.log("response", response);
      
      if (response.status === 200 || response.status === 201) {
        toast.success(`Game "${gameToSave.gameName || gameToSave.name}" ${isUpdate ? 'updated' : 'added'} successfully!`);
        
        // Update the game in the list
        setGames(prevGames => 
          prevGames.map(game => {
            if (game._id === gameId) {
              return {
                ...game,
                isSaved: true,
                existingGameData: response.data.game || game.existingGameData,
                localPortraitImage: null,
                localPortraitPreview: null,
              };
            }
            return game;
          })
        );
        
        // Refresh local games list
        const updatedLocalGames = await fetchAllLocalGames();
        setLocalGames(updatedLocalGames);
        
        setEditingGame(null);
      } else {
        toast.error(`❌ Failed to ${isUpdate ? 'update' : 'add'} game.`);
      }
    } catch (error) {
      console.error(`Error ${isUpdate ? 'updating' : 'saving'} game:`, error);
      if (error.response) {
        toast.error(`❌ ${error.response.data.error || error.response.data.message || `Failed to ${isUpdate ? 'update' : 'add'} game.`}`);
      } else if (error.request) {
        toast.error(`❌ No response from server while ${isUpdate ? 'updating' : 'saving'} game.`);
      } else {
        toast.error(`❌ ${error.message}`);
      }
    } finally {
      setSavingGameId(null);
      setUpdatingGameId(null);
    }
  };

  const selectedProviderObj = providers.find(p => p._id === selectedProvider || p.value === selectedProvider);
  const selectedProviderName = selectedProviderObj?.providerName || selectedProviderObj?.name || "";

  return (
    <section className="font-nunito min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300 flex-1 p-4 md:p-6 overflow-y-auto min-h-[90vh] ${
            isSidebarOpen ? "md:ml-[40%] lg:ml-[28%] xl:ml-[17%]" : "ml-0"
          }`}
        >
          <div className="w-full mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                Manage Games
              </h1>
              <p className="text-gray-600">
                Add new games or update existing games from providers
              </p>
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Filter Games</h2>
                {selectedProvider && (
                  <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    Provider: {selectedProviderName}
                  </div>
                )}
              </div>
              
              <div>
                <SearchBar />
              </div>
              
              <div className="flex mt-[20px] justify-center w-full gap-[20px]">
                <CustomSelect
                  options={providers}
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                  placeholder="provider"
                  loading={loadingProviders}
                  icon={FaGamepad}
                  dropdownOpen={showProvidersDropdown}
                  setDropdownOpen={setShowProvidersDropdown}
                  label="Select Game Provider"
                />
                <CustomSelect
                  options={categories.filter(cat => cat.status)}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="category"
                  loading={loadingCategories}
                  icon={MdCategory}
                  dropdownOpen={showCategoriesDropdown}
                  setDropdownOpen={setShowCategoriesDropdown}
                  label="Default Category for New Games"
                />
              </div>

              {selectedCategory && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-sm text-orange-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    New games will be automatically assigned to <span className="font-semibold ml-1">
                      {categories.find(c => c._id === selectedCategory)?.name}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loadingGames && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <FaSpinner className="animate-spin text-orange-500 text-5xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent blur-xl"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading games from provider...</p>
                <p className="text-sm text-gray-500">Fetching all available games</p>
              </div>
            )}

            {/* Games Grid */}
            {!loadingGames && filteredGames.length > 0 && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {searchTerm ? 'Search Results' : 'Available Games'}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {searchTerm ? (
                        <>
                          Found <span className="font-semibold text-orange-600">{filteredGames.length}</span> game{filteredGames.length === 1 ? '' : 's'} matching "{searchTerm}"
                        </>
                      ) : (
                        <>
                          Showing <span className="font-semibold text-orange-600">{filteredGames.length}</span> game{filteredGames.length === 1 ? '' : 's'} from {selectedProviderName}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredGames.map((game) => (
                    <div
                      id={`game-${game._id}`}
                      key={game._id}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                        game.isSaved 
                          ? 'border-green-300 hover:border-green-400' 
                          : 'border-orange-300 hover:border-orange-400'
                      } ${editingGame === game._id ? 'ring-4 ring-orange-300' : ''}`}
                    >
                      {/* Game Header */}
                      <div className={`p-4 bg-gradient-to-r ${
                        game.isSaved 
                          ? 'from-green-50 to-white' 
                          : 'from-orange-50 to-white'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate pr-2">
                            {game.gameName || game.name}
                          </h3>
                          {game.isSaved ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center">
                              <FaCheck className="mr-1 text-xs" /> Added
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              New Game
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center">
                            <span className="font-medium mr-2">Provider:</span>
                            {game.provider?.providerName || game.provider?.name}
                          </p>
                          <p className="flex items-center">
                            <span className="font-medium mr-2">Game Code:</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {game.game_code || game.code}
                            </span>
                          </p>
                          {game.isSaved && game.existingGameData && (
                            <p className="flex items-center text-xs text-green-600 mt-1">
                              <span className="font-medium mr-2">Status:</span>
                              {game.existingGameData.status ? 'Active' : 'Inactive'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Game Preview */}
                      <div className="p-4">
                        <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group">
                          <img
                            src={useDefaultImage[game._id] 
                              ? (game.image || game.coverImage || game.existingGameData?.portraitImage)
                              : (game.localPortraitPreview || game.image || game.coverImage || game.existingGameData?.portraitImage)}
                            alt={game.gameName || game.name}
                            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Default Image Badge */}
                          {useDefaultImage[game._id] && (
                            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                              <FaImage className="mr-1" /> Default
                            </div>
                          )}
                        </div>

                        {/* Edit Button for Saved Games */}
                        {game.isSaved && editingGame !== game._id && (
                          <div className="mt-3">
                            <button
                              onClick={() => handleEditGame(game)}
                              className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
                            >
                              <FaEdit className="mr-2" /> Edit Game
                            </button>
                          </div>
                        )}

                        {/* Edit Mode for Saved Games */}
                        {editingGame === game._id && (
                          <>
                            {/* Image Source Toggle */}
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-sm text-gray-600">Use Default Image:</span>
                              <button
                                onClick={() => toggleUseDefaultImage(game._id)}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                                  useDefaultImage[game._id] ? 'bg-orange-500' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                                    useDefaultImage[game._id] ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Custom Category Selector */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign Category
                              </label>
                              <div className="relative">
                                <div className="flex flex-wrap gap-2">
                                  {categories
                                    .filter(cat => cat.status)
                                    .map((category) => (
                                      <button
                                        key={category._id}
                                        onClick={() => handleGameDataChange(game._id, 'localCategory', category._id)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                                          game.localCategory === category._id
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                        }`}
                                      >
                                        {category.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </div>

                            {/* Game Settings */}
                            <div className="mt-4">
                              <CustomCheckbox
                                id={`featured-${game._id}`}
                                checked={game.localFeatured}
                                onChange={(e) => handleGameDataChange(game._id, 'localFeatured', e.target.checked)}
                                label="Featured Game"
                                description="Show this game in featured section"
                              />
                              <CustomCheckbox
                                id={`status-${game._id}`}
                                checked={game.localStatus}
                                onChange={(e) => handleGameDataChange(game._id, 'localStatus', e.target.checked)}
                                label="Active Status"
                                description="Game will be visible to users"
                              />
                              <CustomCheckbox
                                id={`fullscreen-${game._id}`}
                                checked={game.localFullScreen}
                                onChange={(e) => handleGameDataChange(game._id, 'localFullScreen', e.target.checked)}
                                label="Full Screen Mode"
                                description="Launch game in full screen"
                              />
                            </div>

                            {/* Image Upload Section - Only show if not using default image */}
                            {!useDefaultImage[game._id] && (
                              <div className="mt-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Custom Image
                                    <span className="text-xs text-gray-500 ml-2">(Will be used for both portrait and landscape)</span>
                                  </label>
                                  {game.localPortraitPreview ? (
                                    <div className="relative group">
                                      <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                                        <img
                                          src={game.localPortraitPreview}
                                          alt="Game Image"
                                          className="w-full h-full object-contain p-2"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeImage(game._id)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <FaTimes className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="block cursor-pointer">
                                      <div className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 group">
                                        <FaUpload className="text-gray-400 text-xl mb-2 group-hover:text-orange-500 transition-colors" />
                                        <span className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">
                                          Upload Game Image
                                        </span>
                                        <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                                      </div>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(game._id, e.target.files[0])}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Default Image Info */}
                            {useDefaultImage[game._id] && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-700 flex items-center">
                                  <FaImage className="mr-2" />
                                  Using default image from provider. Toggle switch above to upload custom image.
                                </p>
                              </div>
                            )}

                            {/* Update and Cancel Buttons */}
                            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleCancelEdit()}
                                className="flex-1 px-4 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveOrUpdateGame(game._id)}
                                disabled={
                                  updatingGameId === game._id || 
                                  !game.localCategory || 
                                  (!useDefaultImage[game._id] && !game.localPortraitImage)
                                }
                                className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
                                  updatingGameId === game._id 
                                    ? 'bg-gray-400 cursor-wait' 
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                } ${
                                  (!game.localCategory || (!useDefaultImage[game._id] && !game.localPortraitImage)) 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'cursor-pointer'
                                }`}
                              >
                                {updatingGameId === game._id ? (
                                  <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    Update Game
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}

                        {/* Save Button for New Games */}
                        {!game.isSaved && editingGame !== game._id && (
                          <>
                            {/* Image Source Toggle */}
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-sm text-gray-600">Use Default Image:</span>
                              <button
                                onClick={() => toggleUseDefaultImage(game._id)}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                                  useDefaultImage[game._id] ? 'bg-orange-500' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                                    useDefaultImage[game._id] ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Custom Category Selector */}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign Category
                              </label>
                              <div className="relative">
                                <div className="flex flex-wrap gap-2">
                                  {categories
                                    .filter(cat => cat.status)
                                    .map((category) => (
                                      <button
                                        key={category._id}
                                        onClick={() => handleGameDataChange(game._id, 'localCategory', category._id)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                                          game.localCategory === category._id
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                        }`}
                                      >
                                        {category.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                              {!game.localCategory && (
                                <p className="text-xs text-red-500 mt-2 flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Category is required
                                </p>
                              )}
                            </div>

                            {/* Game Settings */}
                            <div className="mt-4">
                              <CustomCheckbox
                                id={`featured-${game._id}`}
                                checked={game.localFeatured}
                                onChange={(e) => handleGameDataChange(game._id, 'localFeatured', e.target.checked)}
                                label="Featured Game"
                                description="Show this game in featured section"
                              />
                              <CustomCheckbox
                                id={`status-${game._id}`}
                                checked={game.localStatus}
                                onChange={(e) => handleGameDataChange(game._id, 'localStatus', e.target.checked)}
                                label="Active Status"
                                description="Game will be visible to users"
                              />
                              <CustomCheckbox
                                id={`fullscreen-${game._id}`}
                                checked={game.localFullScreen}
                                onChange={(e) => handleGameDataChange(game._id, 'localFullScreen', e.target.checked)}
                                label="Full Screen Mode"
                                description="Launch game in full screen"
                              />
                            </div>

                            {/* Image Upload Section - Only show if not using default image */}
                            {!useDefaultImage[game._id] && (
                              <div className="mt-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Custom Image
                                    <span className="text-xs text-gray-500 ml-2">(Will be used for both portrait and landscape)</span>
                                  </label>
                                  {game.localPortraitPreview ? (
                                    <div className="relative group">
                                      <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                                        <img
                                          src={game.localPortraitPreview}
                                          alt="Game Image"
                                          className="w-full h-full object-contain p-2"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeImage(game._id)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <FaTimes className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="block cursor-pointer">
                                      <div className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 group">
                                        <FaUpload className="text-gray-400 text-xl mb-2 group-hover:text-orange-500 transition-colors" />
                                        <span className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">
                                          Upload Game Image
                                        </span>
                                        <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                                      </div>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(game._id, e.target.files[0])}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Default Image Info */}
                            {useDefaultImage[game._id] && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-700 flex items-center">
                                  <FaImage className="mr-2" />
                                  Using default image from provider. Toggle switch above to upload custom image.
                                </p>
                              </div>
                            )}

                            {/* Save Button */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={() => handleSaveOrUpdateGame(game._id)}
                                disabled={
                                  savingGameId === game._id || 
                                  !game.localCategory || 
                                  (!useDefaultImage[game._id] && !game.localPortraitImage)
                                }
                                className={`w-full px-4 py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
                                  savingGameId === game._id 
                                    ? 'bg-gray-400 cursor-wait' 
                                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                                } ${
                                  (!game.localCategory || (!useDefaultImage[game._id] && !game.localPortraitImage)) 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'cursor-pointer'
                                }`}
                              >
                                {savingGameId === game._id ? (
                                  <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    Save Game
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results Empty State */}
            {!loadingGames && selectedProvider && searchTerm && filteredGames.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <FaSearch className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Search Results</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  No games found matching "<span className="font-semibold">{searchTerm}</span>" in {selectedProviderName}.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors duration-200"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* Empty State - No games found */}
            {!loadingGames && selectedProvider && !searchTerm && filteredGames.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <FaGamepad className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Games Found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  No games available from <span className="font-semibold">{selectedProviderName}</span> at this time.
                </p>
                <button
                  onClick={() => setSelectedProvider("")}
                  className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors duration-200"
                >
                  Select Different Provider
                </button>
              </div>
            )}

            {/* Initial State - No provider selected */}
            {!loadingGames && !selectedProvider && (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
                  <FaFilter className="text-orange-400 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a Provider</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Choose a game provider from the filter above to see games available for import or update.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-medium">
                  ⚡ Shows both new and existing games
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Newgames;