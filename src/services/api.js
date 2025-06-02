// File: ar_terminal/tma_frontend/src/services/api.js
import axios from 'axios';

// HARDCODED FOR DEBUGGING: Replace with your actual deployed backend API URL
const API_BASE_URL = 'https://smartterminalbackend.vercel.app/api'; 

console.log("HARDCODED API Base URL:", API_BASE_URL); 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStakingConfig = () => apiClient.get('/earn/config');
export const stakeArix = (data) => apiClient.post('/earn/stake', data);
export const unstakeArix = (data) => apiClient.post('/earn/unstake', data);
export const claimRewards = (data) => apiClient.post('/earn/claim', data);
export const getUserStakes = (walletAddress) => apiClient.get(`/earn/stakes/${walletAddress}`);

export const placeCoinflipBet = (data) => apiClient.post('/game/coinflip/bet', data);
export const getCoinflipGameData = () => apiClient.get('/game/coinflip/data');

export const getUserProfile = (walletAddress) => apiClient.get(`/user/profile/${walletAddress}`);

export default apiClient;