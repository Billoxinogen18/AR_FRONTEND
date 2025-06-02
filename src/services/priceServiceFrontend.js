// File: AR_Proj/AR_FRONTEND/src/services/priceServiceFrontend.js
// This service is now primarily a fallback or direct helper if backend config doesn't include price.
// EarnPage should ideally get price from the backend config endpoint (/api/earn/config).

import apiClient from './api'; // Uses the apiClient with configured baseURL

export const getArxUsdtPriceFromBackend = async () => {
  try {
    // Call the dedicated price endpoint if needed, or rely on getStakingConfig
    const response = await apiClient.get('/earn/arx-price');
    if (response.data && typeof response.data.price === 'number') {
      return response.data.price;
    }
    console.warn("Could not get ARIX price from backend dedicated endpoint (priceServiceFrontend.js):", response.data);
    return null;
  } catch (error) {
    let errorMessage = "Error fetching ARIX/USDT price via backend.";
    if (error.isAxiosError && error.response) {
      errorMessage += ` Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
    } else if (error.isAxiosError && error.request) {
      errorMessage += " No response received from backend.";
    } else {
      errorMessage += ` ${error.message}`;
    }
    console.error(errorMessage, error);
    return null;
  }
};

// The alias 'getArxUsdtPriceFromApi' has been removed to simplify exports.
// If any other part of your application was using 'getArxUsdtPriceFromApi',
// it should be updated to use 'getArxUsdtPriceFromBackend' or you can re-add the alias if necessary,
// though for resolving the current build error, simplifying is a good first step.