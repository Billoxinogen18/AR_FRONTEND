// File: AR_FRONTEND/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

if (!API_BASE_URL) {
  console.error("FATAL: VITE_BACKEND_API_URL is not set in environment variables. Frontend cannot connect to backend.");
} else {
  // console.log("API Base URL (Frontend):", API_BASE_URL);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // Increased timeout for potentially longer operations
});

// --- Earn API Endpoints ---
export const getStakingConfig = () => apiClient.get('/earn/config');
export const recordUserStake = (data) => apiClient.post('/earn/stake', data);

// For ARIX principal unstaking from Smart Contract
export const initiateArixUnstake = (data) => apiClient.post('/earn/initiate-arix-unstake', data);
export const confirmArixUnstake = (data) => apiClient.post('/earn/confirm-arix-unstake', data);

// For user's stakes history and USDT reward summary
export const getUserStakesAndRewards = (walletAddress) => apiClient.get(`/earn/stakes/${walletAddress}`);

// For USDT reward withdrawal
export const requestUsdtWithdrawal = (data) => apiClient.post('/earn/request-usdt-withdrawal', data);


// --- Game API Endpoints ---
export const placeCoinflipBet = (data) => apiClient.post('/game/coinflip/bet', data);
// Fetches Coinflip game history for a specific user
export const getCoinflipHistoryForUser = (walletAddress) => apiClient.get(`/game/coinflip/history/${walletAddress}`);
// Placeholder if you need general game data (e.g., min/max bets, available games)
export const getCoinflipGameData = () => apiClient.get('/game/coinflip/data'); 


// --- User API Endpoints ---
// This might be redundant if UserPage gets all its data from getUserStakesAndRewards
export const getUserProfile = (walletAddress) => apiClient.get(`/user/profile/${walletAddress}`); 

export default apiClient;