// File: AR_Proj/AR_FRONTEND/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

if (!API_BASE_URL) {
  console.error("FATAL: VITE_BACKEND_API_URL is not set in environment variables. Frontend cannot connect to backend.");
} else {
  console.log("API Base URL (Frontend):", API_BASE_URL);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// --- Earn API Endpoints ---
export const getStakingConfig = () => apiClient.get('/earn/config');
export const recordUserStake = (data) => apiClient.post('/earn/stake', data);
export const initiateUnstake = (data) => apiClient.post('/earn/initiate-unstake', data);
export const confirmUnstake = (data) => apiClient.post('/earn/confirm-unstake', data);
export const getUserStakes = (walletAddress) => apiClient.get(`/earn/stakes/${walletAddress}`);

// --- Game API Endpoints ---
export const placeCoinflipBet = (data) => apiClient.post('/game/coinflip/bet', data); // Ensure this line is present and correct
export const getCoinflipGameData = () => apiClient.get('/game/coinflip/data'); // Placeholder for now

// --- User API Endpoints ---
export const getUserProfile = (walletAddress) => apiClient.get(`/user/profile/${walletAddress}`); // Placeholder for now

export default apiClient;