// File: AR_FRONTEND/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

if (!API_BASE_URL) {
  const errorMsg = "FATAL: VITE_BACKEND_API_URL is not set in environment variables. Frontend cannot connect to backend.";
  console.error(errorMsg);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});

// --- Earn API Endpoints ---
export const getStakingConfig = () => apiClient.get('/earn/config');
export const recordUserStake = (data) => apiClient.post('/earn/stake', data);
export const initiateArixUnstake = (data) => apiClient.post('/earn/initiate-arix-unstake', data);
export const confirmArixUnstake = (data) => apiClient.post('/earn/confirm-arix-unstake', data);
export const getUserStakesAndRewards = (walletAddress) => apiClient.get(`/earn/stakes/${walletAddress}`);
// Corrected endpoint for USDT withdrawal
export const requestUsdtWithdrawal = (data) => apiClient.post('/earn/request-usdt-withdrawal', data); 
export const requestArixRewardWithdrawal = (data) => apiClient.post('/earn/request-arix-withdrawal', data);


// --- Game API Endpoints ---
export const placeCoinflipBet = (data) => apiClient.post('/game/coinflip/bet', data);
export const getCoinflipHistoryForUser = (walletAddress) => apiClient.get(`/game/coinflip/history/${walletAddress}`);

// --- Task API Endpoints ---
export const getActiveTasks = (userWalletAddress) => {
    const params = userWalletAddress ? { userWalletAddress } : {};
    return apiClient.get('/task/active', { params });
};
export const submitTaskCompletion = (taskId, data) => apiClient.post(`/task/${taskId}/submit`, data);
export const getUserTaskHistory = (walletAddress) => apiClient.get(`/task/user/${walletAddress}`);

// --- Push/Announcements API Endpoints ---
export const getAnnouncements = () => apiClient.get('/push/announcements');

// --- User API Endpoints ---
export const getUserProfile = (walletAddress, launchParams) => {
  return apiClient.get(`/user/profile/${walletAddress}`, { params: launchParams });
};

// --- Referral API Endpoints ---
export const getUserReferralData = (walletAddress) => apiClient.get(`/referral/data/${walletAddress}`);
export const getReferralProgramDetails = () => apiClient.get('/referral/program-details');


apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('API Error Response:', error.response.data, error.response.status, error.response.headers);
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
