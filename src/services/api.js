import axios from 'axios';

const VITE_BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

if (!VITE_BACKEND_API_URL) {
  const errorMsg = "FATAL: VITE_BACKEND_API_URL is not set in environment variables. Frontend cannot connect to backend.";
  console.error(errorMsg);
}

const API_URL = `${VITE_BACKEND_API_URL}/api`;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});

// --- YOUR ORIGINAL ENDPOINTS (PRESERVED) ---
export const getStakingConfig = () => apiClient.get('/earn/config');
export const recordUserStake = (data) => apiClient.post('/earn/stake', data);
export const initiateArixUnstake = (data) => apiClient.post('/earn/initiate-arix-unstake', data);
export const confirmArixUnstake = (data) => apiClient.post('/earn/confirm-arix-unstake', data);
export const getUserStakesAndRewards = (walletAddress) => apiClient.get(`/earn/stakes/${walletAddress}`);
export const requestUsdtWithdrawal = (data) => apiClient.post('/earn/request-usdt-withdrawal', data); 
export const requestArixRewardWithdrawal = (data) => apiClient.post('/earn/request-arix-withdrawal', data);
export const getActiveTasks = (userWalletAddress) => {
    const params = userWalletAddress ? { userWalletAddress } : {};
    return apiClient.get('/tasks/active', { params });
};
export const submitTaskCompletion = (taskId, data) => apiClient.post(`/tasks/${taskId}/submit`, data);
export const getUserTaskHistory = (walletAddress) => apiClient.get(`/tasks/user/${walletAddress}`);
export const getAnnouncements = () => apiClient.get('/push/announcements');
export const getUserReferralData = (walletAddress) => apiClient.get(`/referrals/data/${walletAddress}`);
export const getReferralProgramDetails = () => apiClient.get('/referrals/program-details');
export const getCoinflipHistoryForUser = (walletAddress) => apiClient.get(`/game/coinflip/history/${walletAddress}`);
export const getCrashHistoryForUser = (walletAddress) => apiClient.get(`/game/crash/history/${walletAddress}`);
export const placeCoinflipBet = (data) => apiClient.post('/game/coinflip/bet', data);

// --- USER PROFILE ENDPOINT (PRESERVED) ---
export const getUserProfile = (walletAddress, launchParams) => {
  return apiClient.get(`/users/profile/${walletAddress}`, { params: launchParams });
};

// --- NEW ENDPOINTS (ADDED) ---
// NEW Game Endpoints
export const playPlinko = (data) => apiClient.post('/game/plinko/play', data);
export const getCrashState = () => apiClient.get('/game/crash/state');
export const placeCrashBet = (data) => apiClient.post('/game/crash/bet', data);
export const cashOutCrash = (data) => apiClient.post('/game/crash/cashout', data);

// NEW Swap Endpoints
export const getSwapQuote = (from, to) => apiClient.get('/swap/quote', { params: { from, to } });
export const performSwap = (data) => apiClient.post('/swap/execute', data);

// NEW Transactions Endpoint
export const getUserTransactions = (walletAddress) => apiClient.get(`/users/transactions/${walletAddress}`);

// YOUR ORIGINAL INTERCEPTOR (PRESERVED)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('API Error Response:', { 
        data: error.response.data, 
        status: error.response.status, 
        headers: error.response.headers,
        url: error.config.url
      });
    } else if (error.request) {
      console.error('API No Response (Network error or CORS):', error.request);
    } else {
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
