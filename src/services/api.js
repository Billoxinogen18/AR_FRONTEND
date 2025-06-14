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

// Staking/Earn endpoints
export const getStakingConfig = () => apiClient.get('/earn/config');
export const recordUserStake = (data) => apiClient.post('/earn/stake', data);
export const initiateArixUnstake = (data) => apiClient.post('/earn/initiate-arix-unstake', data);
export const confirmArixUnstake = (data) => apiClient.post('/earn/confirm-arix-unstake', data);
export const getUserStakesAndRewards = (walletAddress) => apiClient.get(`/earn/stakes/${walletAddress}`);

// Withdrawal endpoints
export const requestUsdtWithdrawal = (data) => apiClient.post('/earn/request-usdt-withdrawal', data); 
export const requestArixRewardWithdrawal = (data) => apiClient.post('/earn/request-arix-withdrawal', data);

// Game endpoints
export const placeCoinflipBet = (data) => apiClient.post('/game/coinflip/bet', data);
export const getCoinflipHistoryForUser = (walletAddress) => apiClient.get(`/game/coinflip/history/${walletAddress}`);
// REVISION: Added the missing function export below
export const getCrashHistoryForUser = (walletAddress) => apiClient.get(`/game/crash/history/${walletAddress}`);


// Task endpoints
export const getActiveTasks = (userWalletAddress) => {
    const params = userWalletAddress ? { userWalletAddress } : {};
    return apiClient.get('/tasks/active', { params });
};
export const submitTaskCompletion = (taskId, data) => apiClient.post(`/tasks/${taskId}/submit`, data);
export const getUserTaskHistory = (walletAddress) => apiClient.get(`/tasks/user/${walletAddress}`);


// Push/Announcement endpoints
export const getAnnouncements = () => apiClient.get('/push/announcements');


// User profile endpoint
export const getUserProfile = (walletAddress, launchParams) => {
  return apiClient.get(`/users/profile/${walletAddress}`, { params: launchParams });
};


// Referral endpoints
export const getUserReferralData = (walletAddress) => apiClient.get(`/referrals/data/${walletAddress}`);
export const getReferralProgramDetails = () => apiClient.get('/referrals/program-details');


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