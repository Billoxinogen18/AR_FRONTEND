// File: ar_terminal/tma_frontend/src/services/priceServiceFrontend.js
import axios from 'axios';

// HARDCODED FOR DEBUGGING: Replace with your actual deployed backend API URL
const API_BASE_URL = 'https://smartterminalbackend.vercel.app/api';

export const getArxUsdtPriceFromApi = async () => {
  try {
    const backendPriceEndpoint = `${API_BASE_URL}/earn/arx-price`;
    console.log("Fetching ARIX price from hardcoded backend URL:", backendPriceEndpoint); // Debug log
    const response = await axios.get(backendPriceEndpoint);
    if (response.data && typeof response.data.price === 'number') {
      return response.data.price;
    }
    console.warn("Could not get ARIX price from backend endpoint (hardcoded URL):", response.data);
    return null;
  } catch (error) {
    console.error("Error fetching ARIX/USDT price via backend (hardcoded URL):", error);
    return null;
  }
};