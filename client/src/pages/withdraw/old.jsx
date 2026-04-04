import React, { useState, useEffect, useContext } from "react";
import { Header } from "../../components/header/Header";
import Sidebar from "../../components/sidebar/Sidebar";
import Footer from "../../components/footer/Footer";
import axios from "axios";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { LanguageContext } from "../../context/LanguageContext";

const Withdraw = () => {
  const { t, language } = useContext(LanguageContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [withdrawMethods, setWithdrawMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [wageringInfo, setWageringInfo] = useState({
    required: 0,
    completed: 0,
    remaining: 0,
    isCompleted: true
  });

  // Method-specific form fields
  const [formData, setFormData] = useState({
    // bKash fields
    bkashPhoneNumber: "",
    bkashAccountType: "personal",
    
    // Rocket fields
    rocketPhoneNumber: "",
    
    // Nagad fields
    nagadPhoneNumber: "",
    
    // Bank fields
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    branchName: "",
    district: "",
    routingNumber: ""
  });

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const quickAmounts = [100, 500, 1000, 2000, 5000];

  // Get translated labels based on language
  const getMethodLabels = (methodName) => {
    const labels = {
      bkash: {
        phoneLabel: language.code === 'bn' ? "আপনার বিকাশ নাম্বার লিখুন" : "Enter your bKash number",
        phonePlaceholder: "01XXXXXXXXX",
        accountTypeLabel: language.code === 'bn' ? "মেথড ধরন সিলেক্ট করুন" : "Select account type",
        personal: language.code === 'bn' ? "পারসোনাল" : "Personal",
        agent: language.code === 'bn' ? "এজেন্ট" : "Agent"
      },
      rocket: {
        phoneLabel: language.code === 'bn' ? "আপনার রকেট নাম্বার লিখুন" : "Enter your Rocket number",
        phonePlaceholder: "01XXXXXXXXX"
      },
      nagad: {
        phoneLabel: language.code === 'bn' ? "আপনার নগদ নাম্বার লিখুন" : "Enter your Nagad number",
        phonePlaceholder: "01XXXXXXXXX"
      },
      bank: {
        bankName: language.code === 'bn' ? "ব্যাংক নাম লিখুন" : "Bank Name",
        bankPlaceholder: language.code === 'bn' ? "যেমন: Sonali Bank, Dutch-Bangla Bank" : "e.g., Sonali Bank, Dutch-Bangla Bank",
        accountHolder: language.code === 'bn' ? "একাউন্ট হোল্ডার নাম লিখুন" : "Account Holder Name",
        accountHolderPlaceholder: language.code === 'bn' ? "আপনার একাউন্টের নাম" : "Your account name",
        accountNumber: language.code === 'bn' ? "একাউন্ট নাম্বার লিখুন" : "Account Number",
        accountNumberPlaceholder: language.code === 'bn' ? "আপনার ব্যাংক একাউন্ট নাম্বার" : "Your bank account number",
        branchName: language.code === 'bn' ? "ব্রাঞ্চ নাম লিখুন" : "Branch Name",
        branchPlaceholder: language.code === 'bn' ? "ব্যাংকের শাখার নাম" : "Bank branch name",
        district: language.code === 'bn' ? "জেলা লিখুন" : "District",
        districtPlaceholder: language.code === 'bn' ? "আপনার জেলার নাম" : "Your district",
        routingNumber: language.code === 'bn' ? "রাউটিং নাম্বার দিন" : "Routing Number",
        routingPlaceholder: language.code === 'bn' ? "৯ ডিজিটের রাউটিং নাম্বার" : "9-digit routing number"
      }
    };
    return labels[methodName] || {};
  };

  // Fetch withdraw methods
  useEffect(() => {
    const fetchWithdrawMethods = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/withdraw-methods`);
        if (response.data.success && response.data.method) {
          setWithdrawMethods(response.data.method);
          if (response.data.method.length > 0) {
            setActiveMethod(response.data.method[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching withdraw methods:", err);
        setError(t.failedToFetchTransactions || "Failed to load withdraw methods");
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchWithdrawMethods();
  }, [API_BASE_URL, t]);

  // Calculate wagering requirements
  const calculateWageringRequirements = (userData) => {
    if (!userData) return { required: 0, completed: 0, remaining: 0, isCompleted: true };
    
    const depositAmount = parseFloat(userData.depositamount) || 0;
    const wageringNeed = parseFloat(userData.waigeringneed) || 0;
    const totalBet = parseFloat(userData.total_bet) || 0;
    
    if (depositAmount > 0 && wageringNeed === 0) {
      const requiredWager = depositAmount * 1.1;
      const remainingWager = Math.max(0, requiredWager - totalBet);
      const isCompleted = remainingWager <= 0;
      
      return {
        required: requiredWager,
        completed: totalBet,
        remaining: remainingWager,
        isCompleted: isCompleted,
        isSpecialCase: true
      };
    }
    
    const requiredWager = depositAmount * wageringNeed;
    const remainingWager = Math.max(0, requiredWager - totalBet);
    const isCompleted = remainingWager <= 0;
    
    return {
      required: requiredWager,
      completed: totalBet,
      remaining: remainingWager,
      isCompleted: isCompleted,
      isSpecialCase: false
    };
  };

  // Check if user has active bonus wagering requirements
  const checkBonusWagering = (userData) => {
    if (!userData?.bonusInfo?.activeBonuses || userData.bonusInfo.activeBonuses.length === 0) {
      return { hasActiveBonus: false, totalWagerRequired: 0, totalWagered: 0, remaining: 0 };
    }
    
    let totalWagerRequired = 0;
    let totalWagered = 0;
    
    userData.bonusInfo.activeBonuses.forEach(bonus => {
      const bonusAmount = parseFloat(bonus.originalAmount || bonus.amount) || 0;
      const wageringRequirement = parseFloat(bonus.wageringRequirement) || 0;
      const amountWagered = parseFloat(bonus.amountWagered) || 0;
      
      totalWagerRequired += bonusAmount * wageringRequirement;
      totalWagered += amountWagered;
    });
    
    return {
      hasActiveBonus: true,
      totalWagerRequired: totalWagerRequired,
      totalWagered: totalWagered,
      remaining: Math.max(0, totalWagerRequired - totalWagered)
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("usertoken");

        if (!token) {
          setError(t.authenticationRequired || "Authentication token not found");
          setLoading(false);
          return;
        }

        const userResponse = await axios.get(
          `${API_BASE_URL}/api/user/all-information/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (userResponse.data.success) {
          const userData = userResponse.data.data;
          setUserData(userData);
          
          const wageringReq = calculateWageringRequirements(userData);
          setWageringInfo(wageringReq);
        } else {
          setError(userResponse.data.message);
        }

        try {
          const historyResponse = await axios.get(
            `${API_BASE_URL}/api/user/withdraw/history/${user.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (historyResponse.data.success) {
            setWithdrawalHistory(historyResponse.data.data);
          }
        } catch (historyError) {
          console.error("Error fetching withdrawal history:", historyError);
          setWithdrawalHistory([]);
        }
      } catch (err) {
        setError(t.failedToFetchUserData || "Failed to fetch user data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, t]);

  const getPaymentInstructions = (method) => {
    if (!method) return [];
    
    const baseInstructions = [
      {
        step: language.code === 'bn' ? "অ্যাকাউন্ট প্রস্তুত করুন" : "Prepare Account",
        description: language.code === 'bn' 
          ? `আপনার ${method.gatewayName} অ্যাকাউন্ট সক্রিয় এবং যাচাইকৃত আছে কিনা নিশ্চিত করুন।`
          : `Ensure your ${method.gatewayName} account is active and verified.`,
      },
      {
        step: language.code === 'bn' ? "তথ্য প্রদান করুন" : "Enter Details",
        description: language.code === 'bn'
          ? `আপনার ${method.gatewayName} অ্যাকাউন্টের তথ্য সঠিকভাবে প্রদান করুন।`
          : `Provide your ${method.gatewayName} account details correctly.`,
      },
      { 
        step: language.code === 'bn' ? "পরিমাণ লিখুন" : "Enter Amount", 
        description: language.code === 'bn'
          ? `উত্তোলনের পরিমাণ লিখুন (ন্যূনতম: ৳${method.minAmount}, সর্বোচ্চ: ৳${method.maxAmount})`
          : `Input the withdrawal amount (Min: ৳${method.minAmount}, Max: ৳${method.maxAmount}).`
      },
      {
        step: language.code === 'bn' ? "চার্জ যাচাই করুন" : "Review Charges",
        description: language.code === 'bn'
          ? `নোট: ${method.fixedCharge}৳ নির্ধারিত + ${method.percentCharge}% চার্জ প্রযোজ্য হবে।`
          : `Note: ${method.fixedCharge}৳ fixed + ${method.percentCharge}% charge will be applied.`,
      },
      {
        step: language.code === 'bn' ? "অনুরোধ জমা দিন" : "Submit Request",
        description: language.code === 'bn'
          ? "আপনার উত্তোলন অনুরোধ প্রক্রিয়াকরণের জন্য জমা দিন।"
          : "Submit your withdrawal request for processing.",
      },
    ];

    return baseInstructions;
  };

  // Calculate charges and final amount
  const calculateCharges = () => {
    if (!amount || !activeMethod) return { charge: 0, finalAmount: 0, youWillGet: 0 };
    
    const amountNum = parseFloat(amount);
    const fixedCharge = parseFloat(activeMethod.fixedCharge) || 0;
    const percentCharge = parseFloat(activeMethod.percentCharge) || 0;
    
    const percentAmount = (amountNum * percentCharge) / 100;
    const totalCharge = fixedCharge + percentAmount;
    const finalAmount = amountNum - totalCharge;
    const youWillGet = amountNum - totalCharge;
    
    return {
      charge: totalCharge,
      finalAmount: finalAmount,
      youWillGet: youWillGet,
      fixedCharge,
      percentCharge: percentAmount
    };
  };

  const charges = calculateCharges();

  // Get current method's form data
  const getCurrentMethodData = () => {
    if (!activeMethod) return {};
    
    switch(activeMethod.gatewayName?.toLowerCase()) {
      case "bkash":
        return {
          phoneNumber: formData.bkashPhoneNumber,
          accountType: formData.bkashAccountType
        };
      case "rocket":
        return {
          phoneNumber: formData.rocketPhoneNumber
        };
      case "nagad":
        return {
          phoneNumber: formData.nagadPhoneNumber
        };
      case "bank":
        return {
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          branchName: formData.branchName,
          district: formData.district,
          routingNumber: formData.routingNumber
        };
      default:
        return {};
    }
  };

  const validateForm = () => {
    const errors = {};
    const currentData = getCurrentMethodData();

    if (!activeMethod) {
      errors.method = language.code === 'bn' ? "পেমেন্ট মেথড নির্বাচন করুন" : "Please select a payment method";
    }

    // Check wagering requirements
    if (userData?.depositamount && userData?.depositamount > 0) {
      const wageringReq = calculateWageringRequirements(userData);
      if (!wageringReq.isCompleted) {
        if (wageringReq.isSpecialCase) {
          errors.wagering = language.code === 'bn'
            ? `উত্তোলনের আগে আরও ৳${wageringReq.remaining.toLocaleString()} বাজি রাখতে হবে। প্রয়োজন: ১.১x ডিপোজিট (৳${wageringReq.required.toLocaleString()}), বাজি রাখা হয়েছে: ৳${wageringReq.completed.toLocaleString()}`
            : `You need to wager ৳${wageringReq.remaining.toLocaleString()} more before withdrawing. Required: 1.1x deposit (৳${wageringReq.required.toLocaleString()}), Wagered: ৳${wageringReq.completed.toLocaleString()}`;
        } else {
          errors.wagering = language.code === 'bn'
            ? `উত্তোলনের আগে আরও ৳${wageringReq.remaining.toLocaleString()} বাজি রাখতে হবে। প্রয়োজন: ৳${wageringReq.required.toLocaleString()}, বাজি রাখা হয়েছে: ৳${wageringReq.completed.toLocaleString()}`
            : `You need to wager ৳${wageringReq.remaining.toLocaleString()} more before withdrawing. Required: ৳${wageringReq.required.toLocaleString()}, Wagered: ৳${wageringReq.completed.toLocaleString()}`;
        }
      }
    }

    // Check bonus wagering requirements
    const bonusWagering = checkBonusWagering(userData);
    if (bonusWagering.hasActiveBonus && bonusWagering.remaining > 0) {
      errors.bonusWagering = language.code === 'bn'
        ? `আপনার সক্রিয় বোনাস ওয়েজারিং প্রয়োজনীয়তা রয়েছে। আরও ৳${bonusWagering.remaining.toLocaleString()} বাজি রাখতে হবে (৳${bonusWagering.totalWagered.toLocaleString()}/${bonusWagering.totalWagerRequired.toLocaleString()})`
        : `You have active bonus wagering requirements. Need to wager ৳${bonusWagering.remaining.toLocaleString()} more (৳${bonusWagering.totalWagered.toLocaleString()}/${bonusWagering.totalWagerRequired.toLocaleString()})`;
    }

    // Validate based on method
    if (activeMethod) {
      const methodName = activeMethod.gatewayName?.toLowerCase();
      
      if (methodName === "bkash") {
        if (!currentData.phoneNumber) {
          errors.phoneNumber = language.code === 'bn' ? "বিকাশ নাম্বার প্রয়োজন" : "bKash number is required";
        } else if (!/^(01[3-9]\d{8})$/.test(currentData.phoneNumber)) {
          errors.phoneNumber = language.code === 'bn' ? "সঠিক বিকাশ নাম্বার দিন (01XXXXXXXXX)" : "Enter valid bKash number (01XXXXXXXXX)";
        }
        if (!currentData.accountType) {
          errors.accountType = language.code === 'bn' ? "অ্যাকাউন্ট টাইপ নির্বাচন করুন" : "Account type is required";
        }
      } else if (methodName === "rocket") {
        if (!currentData.phoneNumber) {
          errors.phoneNumber = language.code === 'bn' ? "রকেট নাম্বার প্রয়োজন" : "Rocket number is required";
        } else if (!/^(01[3-9]\d{8})$/.test(currentData.phoneNumber)) {
          errors.phoneNumber = language.code === 'bn' ? "সঠিক রকেট নাম্বার দিন (01XXXXXXXXX)" : "Enter valid Rocket number (01XXXXXXXXX)";
        }
      } else if (methodName === "nagad") {
        if (!currentData.phoneNumber) {
          errors.phoneNumber = language.code === 'bn' ? "নগদ নাম্বার প্রয়োজন" : "Nagad number is required";
        } else if (!/^(01[3-9]\d{8})$/.test(currentData.phoneNumber)) {
          errors.phoneNumber = language.code === 'bn' ? "সঠিক নগদ নাম্বার দিন (01XXXXXXXXX)" : "Enter valid Nagad number (01XXXXXXXXX)";
        }
      } else if (methodName === "bank") {
        if (!currentData.bankName) errors.bankName = language.code === 'bn' ? "ব্যাংকের নাম প্রয়োজন" : "Bank name is required";
        if (!currentData.accountHolderName) errors.accountHolderName = language.code === 'bn' ? "একাউন্ট হোল্ডারের নাম প্রয়োজন" : "Account holder name is required";
        if (!currentData.accountNumber) errors.accountNumber = language.code === 'bn' ? "একাউন্ট নাম্বার প্রয়োজন" : "Account number is required";
        if (!currentData.branchName) errors.branchName = language.code === 'bn' ? "ব্রাঞ্চের নাম প্রয়োজন" : "Branch name is required";
        if (!currentData.district) errors.district = language.code === 'bn' ? "জেলা প্রয়োজন" : "District is required";
        if (!currentData.routingNumber) errors.routingNumber = language.code === 'bn' ? "রাউটিং নাম্বার প্রয়োজন" : "Routing number is required";
        if (currentData.routingNumber && !/^\d{9}$/.test(currentData.routingNumber)) {
          errors.routingNumber = language.code === 'bn' ? "রাউটিং নাম্বার ৯ ডিজিট হতে হবে" : "Routing number must be 9 digits";
        }
      }
    }

    // Amount validation
    if (!amount) {
      errors.amount = language.code === 'bn' ? "পরিমাণ প্রয়োজন" : "Amount is required";
    } else if (parseFloat(amount) < parseFloat(activeMethod?.minAmount || 100)) {
      errors.amount = language.code === 'bn'
        ? `ন্যূনতম উত্তোলনের পরিমাণ ৳${activeMethod?.minAmount || 100}`
        : `Minimum withdrawal amount is ৳${activeMethod?.minAmount || 100}`;
    } else if (parseFloat(amount) > parseFloat(activeMethod?.maxAmount || 30000)) {
      errors.amount = language.code === 'bn'
        ? `সর্বোচ্চ উত্তোলনের পরিমাণ ৳${activeMethod?.maxAmount || 30000}`
        : `Maximum withdrawal amount is ৳${activeMethod?.maxAmount || 30000}`;
    } else if (parseFloat(amount) > (userData?.balance || 0)) {
      errors.amount = language.code === 'bn'
        ? "পর্যাপ্ত ব্যালেন্স নেই"
        : "Insufficient balance for this withdrawal";
    } else if (!/^\d+$/.test(amount)) {
      errors.amount = language.code === 'bn'
        ? "পরিমাণ অবশ্যই পূর্ণ সংখ্যা হতে হবে"
        : "Amount must be a whole number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsProcessing(true);
    setTransactionStatus(null);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("usertoken");
      const currentData = getCurrentMethodData();
      const methodName = activeMethod.gatewayName?.toLowerCase();

      let payload = {
        method: methodName,
        amount: parseFloat(amount)
      };

      if (methodName === "bkash") {
        payload.phoneNumber = currentData.phoneNumber;
        payload.accountType = currentData.accountType;
      } else if (methodName === "rocket" || methodName === "nagad") {
        payload.phoneNumber = currentData.phoneNumber;
      } else if (methodName === "bank") {
        payload.bankName = currentData.bankName;
        payload.accountHolderName = currentData.accountHolderName;
        payload.accountNumber = currentData.accountNumber;
        payload.branchName = currentData.branchName;
        payload.district = currentData.district;
        payload.routingNumber = currentData.routingNumber;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/user/withdraw`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTransactionStatus({
          success: true,
          message: response.data.message || (language.code === 'bn'
            ? "উত্তোলন অনুরোধ সফলভাবে জমা দেওয়া হয়েছে! শীঘ্রই প্রক্রিয়া করা হবে।"
            : "Withdrawal request submitted successfully! It will be processed shortly."),
        });

        setUserData({
          ...userData,
          balance: userData.balance - parseFloat(amount),
        });

        setAmount("");
        if (methodName === "bkash") {
          handleInputChange("bkashPhoneNumber", "");
          handleInputChange("bkashAccountType", "personal");
        } else if (methodName === "rocket") {
          handleInputChange("rocketPhoneNumber", "");
        } else if (methodName === "nagad") {
          handleInputChange("nagadPhoneNumber", "");
        } else if (methodName === "bank") {
          handleInputChange("bankName", "");
          handleInputChange("accountHolderName", "");
          handleInputChange("accountNumber", "");
          handleInputChange("branchName", "");
          handleInputChange("district", "");
          handleInputChange("routingNumber", "");
        }

        const historyResponse = await axios.get(
          `${API_BASE_URL}/api/user/withdraw/history/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (historyResponse.data.success) {
          setWithdrawalHistory(historyResponse.data.data);
        }
      } else {
        setTransactionStatus({
          success: false,
          message: response.data.message || (language.code === 'bn'
            ? "উত্তোলন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
            : "Withdrawal failed. Please try again."),
        });
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      let errorMessage = language.code === 'bn'
        ? "উত্তোলন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
        : "Withdrawal failed. Please try again.";

      if (err.response?.status === 401) {
        errorMessage = language.code === 'bn'
          ? "অনুগ্রহ করে পুনরায় লগইন করুন।"
          : "Please login again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setTransactionStatus({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("usertoken");

      if (!token) {
        setError(t.authenticationRequired || "Authentication token not found");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/user/all-information/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const userData = response.data.data;
        setUserData(userData);
        
        const wageringReq = calculateWageringRequirements(userData);
        setWageringInfo(wageringReq);
      }
    } catch (err) {
      console.error("Error refreshing balance:", err);
      setError(t.failedRefreshBalance || "Failed to refresh balance");
    }
  };

  // Render method-specific form fields
  const renderMethodFields = () => {
    if (!activeMethod) return null;
    
    const methodName = activeMethod.gatewayName?.toLowerCase();
    const labels = getMethodLabels(methodName);
    
    switch(methodName) {
      case "bkash":
        return (
          <>
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.phoneLabel}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="tel"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.phoneNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.phonePlaceholder}
                value={formData.bkashPhoneNumber}
                onChange={(e) => handleInputChange("bkashPhoneNumber", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.phoneNumber && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.phoneNumber}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.accountTypeLabel}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="personal"
                    checked={formData.bkashAccountType === "personal"}
                    onChange={() => handleInputChange("bkashAccountType", "personal")}
                    className="mr-2"
                    disabled={!wageringInfo.isCompleted}
                  />
                  <span className="text-white text-sm">{labels.personal}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="agent"
                    checked={formData.bkashAccountType === "agent"}
                    onChange={() => handleInputChange("bkashAccountType", "agent")}
                    className="mr-2"
                    disabled={!wageringInfo.isCompleted}
                  />
                  <span className="text-white text-sm">{labels.agent}</span>
                </label>
              </div>
              {formErrors.accountType && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.accountType}</p>
              )}
            </div>
          </>
        );
        
      case "rocket":
        return (
          <div className="mb-4 md:mb-6">
            <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
              {labels.phoneLabel}
              <span className="text-[#ff6b6b] ml-1">*</span>
            </label>
            <input
              type="tel"
              className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                formErrors.phoneNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
              }`}
              placeholder={labels.phonePlaceholder}
              value={formData.rocketPhoneNumber}
              onChange={(e) => handleInputChange("rocketPhoneNumber", e.target.value)}
              disabled={!wageringInfo.isCompleted}
            />
            {formErrors.phoneNumber && (
              <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.phoneNumber}</p>
            )}
          </div>
        );
        
      case "nagad":
        return (
          <div className="mb-4 md:mb-6">
            <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
              {labels.phoneLabel}
              <span className="text-[#ff6b6b] ml-1">*</span>
            </label>
            <input
              type="tel"
              className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                formErrors.phoneNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
              }`}
              placeholder={labels.phonePlaceholder}
              value={formData.nagadPhoneNumber}
              onChange={(e) => handleInputChange("nagadPhoneNumber", e.target.value)}
              disabled={!wageringInfo.isCompleted}
            />
            {formErrors.phoneNumber && (
              <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.phoneNumber}</p>
            )}
          </div>
        );
        
      case "bank":
        return (
          <>
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.bankName}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.bankName ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.bankPlaceholder}
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.bankName && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.bankName}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.accountHolder}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.accountHolderName ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.accountHolderPlaceholder}
                value={formData.accountHolderName}
                onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.accountHolderName && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.accountHolderName}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.accountNumber}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.accountNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.accountNumberPlaceholder}
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.accountNumber && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.accountNumber}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.branchName}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.branchName ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.branchPlaceholder}
                value={formData.branchName}
                onChange={(e) => handleInputChange("branchName", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.branchName && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.branchName}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.district}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.district ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={language.code === 'bn' ? "আপনার জেলার নাম" : "Your district"}
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.district && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.district}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.routingNumber}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.routingNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.routingPlaceholder}
                value={formData.routingNumber}
                onChange={(e) => handleInputChange("routingNumber", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.routingNumber && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.routingNumber}</p>
              )}
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  // Helper function to render payment method buttons
  const renderPaymentMethodButton = (method) => (
    <button
      type="button"
      key={method._id}
      className={`px-3 py-3 md:px-4 md:py-4 rounded-lg flex flex-col items-center justify-center transition-all ${
        activeMethod?._id === method._id
          ? "bg-[#1a2a2a] border-2 border-[#3a8a6f]"
          : "bg-[#1a1f1f] hover:bg-[#1f2525] border-2 border-transparent"
      }`}
      onClick={() => setActiveMethod(method)}
      disabled={!wageringInfo.isCompleted}
    >
      <img
        src={`${API_BASE_URL}/images/${method.image}`}
        alt={method.gatewayName}
        className="w-8 h-8 md:w-10 md:h-10 mb-1 md:mb-2 object-contain"
      />
      <span className="text-xs font-medium">{method.gatewayName}</span>
    </button>
  );

  if (error && !userData) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0f0f]">
        <div className="bg-[#1a1f1f] text-[#ff6b6b] p-6 rounded-lg max-w-md text-center border border-[#2a2f2f]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium mb-2">{t.error || "Error"}</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#2a5c45] hover:bg-[#3a6c55] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {t.tryAgain || "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden font-rubik bg-[#0a0f0f] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex overflow-y-auto h-screen">
        <Sidebar isOpen={sidebarOpen} />

        <div
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <div className="max-w-6xl mx-auto py-4 md:py-8 pb-[30px] p-3 md:p-0">
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-white">
                {t.withdrawal || "Withdraw Funds"}
              </h1>
              <p className="text-sm md:text-base text-[#8a9ba8]">
                {language.code === 'bn'
                  ? "আপনার অ্যাকাউন্ট থেকে মোবাইল ব্যাংকিং বা ব্যাংকে টাকা উত্তোলন করুন"
                  : "Withdraw money from your account to mobile banking or bank"}
              </p>
            </div>

            {/* Wagering Requirement Alert */}
            {(userData?.depositamount && userData?.depositamount > 0 && !wageringInfo.isCompleted) && (
              <div className="bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 border border-[#3a2f2f] shadow-lg">
                <div className="flex items-center mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 md:h-8 md:w-8 text-[#e6db74] mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-base md:text-lg font-semibold text-[#e6db74]">
                    {wageringInfo.isSpecialCase 
                      ? (language.code === 'bn' ? "১.১x ওয়েজারিং প্রয়োজনীয়তা" : "1.1x Wagering Requirement Pending")
                      : (language.code === 'bn' ? "ওয়েজারিং প্রয়োজনীয়তা" : "Wagering Requirement Pending")}
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm md:text-base text-[#a8b9c6]">
                    {wageringInfo.isSpecialCase 
                      ? (language.code === 'bn' 
                        ? "উত্তোলনের আগে আপনাকে ১.১x ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করতে হবে।"
                        : "You need to complete 1.1x wagering requirement before you can withdraw.")
                      : (language.code === 'bn'
                        ? "উত্তোলনের আগে আপনাকে ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করতে হবে।"
                        : "You need to complete wagering requirements before you can withdraw.")}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-3">
                    <div className="bg-[#1a1f1f] p-3 rounded-lg">
                      <p className="text-xs md:text-sm text-[#8a9ba8]">
                        {wageringInfo.isSpecialCase 
                          ? (language.code === 'bn' ? "প্রয়োজনীয় (১.১x)" : "Required (1.1x)")
                          : (language.code === 'bn' ? "প্রয়োজনীয় ওয়েজারিং" : "Required Wagering")}
                      </p>
                      <p className="text-base md:text-lg font-bold text-white">
                        ৳{wageringInfo.required.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#1a1f1f] p-3 rounded-lg">
                      <p className="text-xs md:text-sm text-[#8a9ba8]">
                        {language.code === 'bn' ? "ওয়েজার সম্পন্ন" : "Wagered"}
                      </p>
                      <p className="text-base md:text-lg font-bold text-[#4ecdc4]">
                        ৳{wageringInfo.completed.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#1a1f1f] p-3 rounded-lg">
                      <p className="text-xs md:text-sm text-[#8a9ba8]">
                        {language.code === 'bn' ? "বাকি" : "Remaining"}
                      </p>
                      <p className="text-base md:text-lg font-bold text-[#ff6b6b]">
                        ৳{wageringInfo.remaining.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-[#1a1f1f] rounded-full h-3 md:h-4">
                      <div 
                        className="bg-gradient-to-r from-[#3a8a6f] to-[#4ecdc4] h-3 md:h-4 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${wageringInfo.required > 0 ? (wageringInfo.completed / wageringInfo.required) * 100 : 0}%`,
                          maxWidth: '100%'
                        }}
                      ></div>
                    </div>
                    <p className="text-xs md:text-sm text-[#8a9ba8] mt-2 text-center">
                      {((wageringInfo.completed / wageringInfo.required) * 100 || 0).toFixed(1)}% {language.code === 'bn' ? "সম্পন্ন" : "Complete"}
                    </p>
                  </div>
                  <p className="text-xs md:text-sm text-[#ff6b6b] mt-3">
                    <strong>{language.code === 'bn' ? "নোট:" : "Note:"}</strong> {language.code === 'bn'
                      ? `উত্তোলনের আগে আরও ৳${wageringInfo.remaining.toLocaleString()} বাজি রাখতে হবে।`
                      : `You must wager ৳${wageringInfo.remaining.toLocaleString()} more before you can make a withdrawal.`}
                  </p>
                </div>
              </div>
            )}

            {/* User Info Card */}
            {userData && (
              <div className="bg-[#1a1f1f] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 border border-[#2a2f2f] shadow-lg">
                <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white">
                  {language.code === 'bn' ? "অ্যাকাউন্ট তথ্য" : "Account Information"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-[#8a9ba8]">{t.playerId || "Player ID"}</p>
                    <p className="text-sm md:text-base font-medium text-white">
                      {userData.player_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-[#8a9ba8]">{t.username || "Username"}</p>
                    <p className="text-sm md:text-base font-medium text-white">
                      {userData.username}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-[#8a9ba8]">{t.phone || "Phone"}</p>
                    <p className="text-sm md:text-base font-medium text-white">
                      {userData.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-[#1a2525] to-[#2a3535] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 shadow-lg border border-[#2a2f2f]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
                <div>
                  <p className="text-xs md:text-sm text-[#a8b9c6]">
                    {language.code === 'bn' ? "বর্তমান ব্যালেন্স" : "Current Balance"}
                  </p>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                    ৳ {userData ? userData.balance?.toLocaleString() : "0.00"}
                  </h2>
                  {userData?.bonusBalance > 0 && (
                    <p className="text-xs md:text-sm text-[#4ecdc4] mt-1">
                      {language.code === 'bn' ? "বোনাস ব্যালেন্স:" : "Bonus Balance:"} ৳{userData.bonusBalance?.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefreshBalance}
                    className="bg-[#2a5c45] cursor-pointer px-4 py-2 md:px-6 md:py-3 rounded-[5px] text-xs md:text-sm font-medium transition-colors flex items-center hover:bg-[#3a6c55]"
                    disabled={!wageringInfo.isCompleted}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {t.refreshBalance || "Refresh Balance"}
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State for Withdraw Methods */}
            {loadingMethods ? (
              <div className="bg-[#1a1f1f] rounded-lg p-8 text-center border border-[#2a2f2f]">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#2a2f2f] rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent rounded-full border-t-[#3a8a6f] animate-spin"></div>
                  </div>
                  <div>
                    <p className="text-[#8a9ba8] font-medium">{t.loading || "Loading..."}</p>
                  </div>
                </div>
              </div>
            ) : withdrawMethods.length === 0 ? (
              <div className="bg-[#1a1f1f] rounded-[2px] p-8 text-center border border-[#2a2f2f]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-[#8a9ba8] mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-[#8a9ba8]">
                  {language.code === 'bn' 
                    ? "কোন উত্তোলন পদ্ধতি উপলব্ধ নেই।"
                    : "No withdrawal methods available at the moment."}
                </p>
              </div>
            ) : (
              /* Withdrawal Methods */
              <div className="bg-[#1a1f1f] rounded-[2px] overflow-hidden mb-6 md:mb-8 border border-[#2a2f2f]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 md:p-4 border-b border-[#2a2f2f]">
                  {withdrawMethods.map((method) => renderPaymentMethodButton(method))}
                </div>

                {activeMethod && (
                  <>
                    {/* Wagering Error Message */}
                    {(!wageringInfo.isCompleted || formErrors.wagering || formErrors.bonusWagering) && (
                      <div className="p-4 md:p-6 border-t border-[#2a2f2f] bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f]">
                        <div className="flex items-center mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 md:h-6 md:w-6 text-[#ff6b6b] mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <h4 className="text-sm md:text-base font-semibold text-[#ff6b6b]">
                            {language.code === 'bn' ? "উত্তোলন সীমাবদ্ধতা" : "Withdrawal Restrictions"}
                          </h4>
                        </div>
                        {formErrors.wagering && (
                          <p className="text-xs md:text-sm text-[#ff6b6b] mb-2">
                            {formErrors.wagering}
                          </p>
                        )}
                        {formErrors.bonusWagering && (
                          <p className="text-xs md:text-sm text-[#ff6b6b]">
                            {formErrors.bonusWagering}
                          </p>
                        )}
                        {!formErrors.wagering && !formErrors.bonusWagering && !wageringInfo.isCompleted && (
                          <p className="text-xs md:text-sm text-[#ff6b6b]">
                            {wageringInfo.isSpecialCase 
                              ? (language.code === 'bn'
                                ? "উত্তোলনের আগে ১.১x ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করুন।"
                                : "You need to complete 1.1x wagering requirement before withdrawing.")
                              : (language.code === 'bn'
                                ? "উত্তোলনের আগে ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করুন।"
                                : "You need to complete wagering requirements before withdrawing.")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Payment Instructions */}
                    <div className="p-4 md:p-6 border-t border-[#2a2f2f]">
                      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#3a8a6f]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {activeMethod.gatewayName} {language.code === 'bn' ? "উত্তোলন নির্দেশনা" : "Withdrawal Instructions"}
                      </h3>
                      <ul className="text-xs md:text-sm text-[#8a9ba8] space-y-2 md:space-y-3">
                        {getPaymentInstructions(activeMethod).map((step, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-[#3a8a6f] mr-2">•</span>
                            <span>
                              <strong>{step.step}:</strong> {step.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Charges Information */}
                    <div className="p-4 md:p-6 border-t border-[#2a2f2f] bg-[#1f2525]">
                      <h4 className="text-sm md:text-base font-semibold mb-3 text-white">
                        {language.code === 'bn' ? "চার্জের তথ্য" : "Charges Information"}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
                        <div>
                          <p className="text-[#8a9ba8]">{language.code === 'bn' ? "নির্ধারিত চার্জ" : "Fixed Charge"}</p>
                          <p className="text-white font-medium">৳{activeMethod.fixedCharge}</p>
                        </div>
                        <div>
                          <p className="text-[#8a9ba8]">{language.code === 'bn' ? "শতকরা চার্জ" : "Percent Charge"}</p>
                          <p className="text-white font-medium">{activeMethod.percentCharge}%</p>
                        </div>
                        <div>
                          <p className="text-[#8a9ba8]">{language.code === 'bn' ? "ন্যূনতম পরিমাণ" : "Min Amount"}</p>
                          <p className="text-white font-medium">৳{activeMethod.minAmount}</p>
                        </div>
                        <div>
                          <p className="text-[#8a9ba8]">{language.code === 'bn' ? "সর্বোচ্চ পরিমাণ" : "Max Amount"}</p>
                          <p className="text-white font-medium">৳{activeMethod.maxAmount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Withdrawal Form */}
                    <div className="p-4 md:p-6">
                      <form onSubmit={handleSubmit}>
                        {/* Method-specific form fields */}
                        {renderMethodFields()}

                        {/* Amount Field */}
                        <div className="mb-4 md:mb-6">
                          <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                            {language.code === 'bn' ? "পরিমাণ (৳)" : "Amount (৳)"}
                            <span className="text-[#ff6b6b] ml-1">*</span>
                          </label>
                          <input
                            type="number"
                            className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                              formErrors.amount ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                            }`}
                            placeholder={language.code === 'bn'
                              ? `পরিমাণ লিখুন (ন্যূনতম: ৳${activeMethod.minAmount}, সর্বোচ্চ: ৳${activeMethod.maxAmount})`
                              : `Enter amount (Min: ৳${activeMethod.minAmount}, Max: ৳${activeMethod.maxAmount})`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min={activeMethod.minAmount}
                            max={Math.min(activeMethod.maxAmount, userData?.balance || 0)}
                            required
                            disabled={!wageringInfo.isCompleted}
                          />
                          {formErrors.amount && (
                            <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">
                              {formErrors.amount}
                            </p>
                          )}

                          {/* Amount Breakdown */}
                          {amount && (
                            <div className="mt-3 p-3 bg-[#1f2525] rounded-lg border border-[#2a2f2f]">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-[#8a9ba8]">{language.code === 'bn' ? "উত্তোলনের পরিমাণ:" : "Withdrawal Amount:"}</p>
                                  <p className="text-white font-medium">৳{parseFloat(amount).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[#8a9ba8]">{language.code === 'bn' ? "মোট চার্জ:" : "Total Charge:"}</p>
                                  <p className="text-red-400 font-medium">-৳{charges.charge.toFixed(2)}</p>
                                </div>
                                <div className="col-span-2 border-t border-[#2a2f2f] mt-2 pt-2">
                                  <p className="text-[#8a9ba8]">{language.code === 'bn' ? "আপনি পাবেন:" : "You Will Get:"}</p>
                                  <p className="text-[#3a8a6f] font-bold">৳{charges.youWillGet.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                            {quickAmounts.map((quickAmount) => (
                              <button
                                key={quickAmount}
                                type="button"
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                                  amount === quickAmount.toString()
                                    ? "bg-[#2a5c45] text-white"
                                    : "bg-[#1f2525] text-[#8a9ba8] hover:bg-[#252b2b]"
                                }`}
                                onClick={() => setAmount(quickAmount.toString())}
                                disabled={
                                  !wageringInfo.isCompleted ||
                                  quickAmount > (userData?.balance || 0) || 
                                  quickAmount > activeMethod.maxAmount || 
                                  quickAmount < activeMethod.minAmount
                                }
                              >
                                ৳ {quickAmount.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          className="w-full bg-gradient-to-r from-[#2a5c45] to-[#3a6c55] hover:from-[#3a6c55] hover:to-[#4a7c65] py-3 md:py-4 rounded-lg text-sm md:text-base text-white font-medium flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          type="submit"
                          disabled={
                            !wageringInfo.isCompleted ||
                            isProcessing ||
                            !amount ||
                            parseFloat(amount) > (userData?.balance || 0) ||
                            parseFloat(amount) < parseFloat(activeMethod?.minAmount || 100) ||
                            parseFloat(amount) > parseFloat(activeMethod?.maxAmount || 30000)
                          }
                        >
                          {!wageringInfo.isCompleted ? (
                            wageringInfo.isSpecialCase 
                              ? (language.code === 'bn' ? "প্রথমে ১.১x ওয়েজারিং সম্পন্ন করুন" : "Complete 1.1x Wagering Requirements First")
                              : (language.code === 'bn' ? "প্রথমে ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করুন" : "Complete Wagering Requirements First")
                          ) : isProcessing ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              {language.code === 'bn' ? "প্রক্রিয়াকরণ..." : "Processing..."}
                            </>
                          ) : (
                            `${language.code === 'bn' ? "উত্তোলন করুন" : "Withdraw to"} ${activeMethod.gatewayName}`
                          )}
                        </button>
                      </form>

                      {transactionStatus && (
                        <div
                          className={`mt-3 md:mt-4 p-3 md:p-4 rounded-lg text-xs md:text-sm ${
                            transactionStatus.success
                              ? "bg-[#1a2525] text-[#4ecdc4] border border-[#2a3535]"
                              : "bg-[#2a1f1f] text-[#ff6b6b] border border-[#3a2f2f]"
                          }`}
                        >
                          <div className="flex items-center">
                            {transactionStatus.success ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 md:h-5 md:w-5 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 md:h-5 md:w-5 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            {transactionStatus.message}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Instructions and Transaction History */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-8">
              {/* Instructions */}
              {activeMethod && (
                <div className="bg-[#1a1f1f] rounded-[2px] p-4 md:p-6 border border-[#2a2f2f]">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#3a8a6f]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {language.code === 'bn' ? "উত্তোলনের তথ্য" : "Withdrawal Information"}
                  </h3>
                  <ul className="text-xs md:text-sm text-[#8a9ba8] space-y-2 md:space-y-3">
                    <li className="flex items-start">
                      <span className="text-[#3a8a6f] mr-2">•</span>
                      <span>{language.code === 'bn' ? "ন্যূনতম উত্তোলনের পরিমাণ:" : "Minimum withdrawal amount:"} ৳{activeMethod?.minAmount || 100}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#3a8a6f] mr-2">•</span>
                      <span>{language.code === 'bn' ? "সর্বোচ্চ উত্তোলনের পরিমাণ:" : "Maximum withdrawal amount:"} ৳{activeMethod?.maxAmount || 30000}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#3a8a6f] mr-2">•</span>
                      <span>{language.code === 'bn' ? "নির্ধারিত চার্জ:" : "Fixed charge:"} ৳{activeMethod?.fixedCharge || 0}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#3a8a6f] mr-2">•</span>
                      <span>{language.code === 'bn' ? "শতকরা চার্জ:" : "Percent charge:"} {activeMethod?.percentCharge || 0}%</span>
                    </li>
                    {userData?.depositamount && userData?.depositamount > 0 && (
                      <>
                        <li className="flex items-start">
                          <span className="text-[#3a8a6f] mr-2">•</span>
                          <span>
                            {userData.waigeringneed === 0 
                              ? (language.code === 'bn' ? "ওয়েজারিং প্রয়োজনীয়তা: ডিপোজিটের ১.১x গুণ" : "Wagering requirement: 1.1x deposit amount")
                              : (language.code === 'bn' ? `ওয়েজারিং প্রয়োজনীয়তা: ডিপোজিটের ${userData.waigeringneed}x গুণ` : `Wagering requirement: ${userData.waigeringneed}x deposit amount`)}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#3a8a6f] mr-2">•</span>
                          <span>
                            {language.code === 'bn' ? "প্রয়োজনীয় ওয়েজারিং:" : "Required wagering:"} ৳{(userData.waigeringneed === 0 
                              ? userData.depositamount * 1.1 
                              : userData.depositamount * userData.waigeringneed).toLocaleString()}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#3a8a6f] mr-2">•</span>
                          <span>
                            {language.code === 'bn' ? "সম্পন্ন ওয়েজারিং:" : "Completed wagering:"} ৳{userData.total_bet?.toLocaleString() || 0}
                          </span>
                        </li>
                      </>
                    )}
                    <li className="flex items-start">
                      <span className="text-[#3a8a6f] mr-2">•</span>
                      <span>{language.code === 'bn' ? "উত্তোলন প্রক্রিয়াকরণ সময়: ৫-৩০ মিনিট" : "Withdrawal processing time: 5-30 minutes"}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#3a8a6f] mr-2">•</span>
                      <span>{language.code === 'bn' ? "আপনার অ্যাকাউন্ট সক্রিয় এবং যাচাইকৃত আছে কিনা নিশ্চিত করুন" : "Ensure your account is active and verified"}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#3a8a6f] mr-2">•</span>
                      <span>{language.code === 'bn' ? "কোন সমস্যা হলে সাপোর্টে যোগাযোগ করুন" : "Contact support if you face any issues"}</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Transaction History */}
              <div className="bg-[#1a1f1f] rounded-[2px] overflow-hidden border border-[#2a2f2f]">
                <div className="p-4 md:p-6 border-b border-[#2a2f2f] flex justify-between items-center">
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    {language.code === 'bn' ? "সাম্প্রতিক উত্তোলন" : "Recent Withdrawals"}
                  </h3>
                  <button className="text-[#3a8a6f] text-xs md:text-sm hover:text-[#4a9a7f] transition-colors">
                    {t.viewAll || "View All"}
                  </button>
                </div>
                <div className="p-3 md:p-4">
                  {withdrawalHistory.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {withdrawalHistory
                        .slice(0, 5)
                        .map((transaction, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-[#1f2525] rounded-lg hover:bg-[#252b2b] transition-colors"
                          >
                            <div className="flex items-center">
                              <div
                                className={`p-1.5 md:p-2 rounded-full mr-2 md:mr-3 ${
                                  transaction.status === "completed"
                                    ? "bg-[#1a2525] text-[#4ecdc4]"
                                    : transaction.status === "pending"
                                    ? "bg-[#2a2a1f] text-[#e6db74]"
                                    : "bg-[#2a1f1f] text-[#ff6b6b]"
                                }`}
                              >
                                {transaction.status === "completed" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 md:h-5 md:w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : transaction.status === "pending" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 md:h-5 md:w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 md:h-5 md:w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-xs md:text-sm font-medium text-white">
                                  {new Date(
                                    transaction.date || transaction.createdAt
                                  ).toLocaleDateString(language.code === 'bn' ? 'bn-BD' : 'en-US')}
                                </p>
                                <p className="text-xs text-[#8a9ba8] capitalize">
                                  {transaction.method}
                                </p>
                                {transaction.details && (
                                  <p className="text-xs text-[#8a9ba8]">
                                    {transaction.details.phoneNumber || transaction.details.accountNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs md:text-sm font-medium text-white">
                                ৳ {transaction.amount?.toLocaleString()}
                              </p>
                              <p
                                className={`text-xs ${
                                  transaction.status === "completed"
                                    ? "text-[#4ecdc4]"
                                    : transaction.status === "pending"
                                    ? "text-[#e6db74]"
                                    : "text-[#ff6b6b]"
                                }`}
                              >
                                {transaction.status === "completed"
                                  ? (language.code === 'bn' ? "সম্পূর্ণ" : "Completed")
                                  : transaction.status === "pending"
                                  ? (language.code === 'bn' ? "মুলতুবি" : "Pending")
                                  : (language.code === 'bn' ? "ব্যর্থ" : "Failed")}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center flex justify-center items-center flex-col py-6 md:py-8 text-[#8a9ba8]">
                      <div className="w-[40px] h-[40px] flex justify-center items-center border-[2px] border-[#2a2f2f] mb-[10px] rounded-full">
                        <FaBangladeshiTakaSign className="text-[#5a6b78]" />
                      </div>
                      <p className="text-sm md:text-base">
                        {language.code === 'bn' ? "কোন সাম্প্রতিক উত্তোলন নেই" : "No recent withdrawals"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Withdraw;