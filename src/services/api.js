// File: AR_FRONTEND/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

if (!API_BASE_URL) {
  console.error("FATAL: VITE_BACKEND_API_URL is not set in environment variables. Frontend cannot connect to backend.");
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
export const requestUsdtWithdrawal = (data) => apiClient.post('/earn/request-usdt-withdrawal', data);


// --- Game API Endpoints ---
export const placeCoinflipBet = (data) => apiClient.post('/game/coinflip/bet', data);
export const getCoinflipHistoryForUser = (walletAddress) => apiClient.get(`/game/coinflip/history/${walletAddress}`);


// --- Task API Endpoints ---
// Pass userWalletAddress as a query parameter if available
export const getActiveTasks = (userWalletAddress) => {
    const params = userWalletAddress ? { userWalletAddress } : {};
    return apiClient.get('/task/active', { params });
};
export const submitTaskCompletion = (taskId, data) => apiClient.post(`/task/${taskId}/submit`, data);
export const getUserTaskHistory = (walletAddress) => apiClient.get(`/task/user/${walletAddress}`);


// --- User API Endpoints ---
// export const getUserProfile = (walletAddress) => apiClient.get(`/user/profile/${walletAddress}`); 

export default apiClient;