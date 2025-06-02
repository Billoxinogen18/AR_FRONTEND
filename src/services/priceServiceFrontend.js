import { getCurrentArxPrice } from './api';

export const getArxUsdtPriceFromApi = async () => {
  try {
    const response = await getCurrentArxPrice();
    if (response.data && typeof response.data.price === 'number') {
      return response.data.price;
    }
    
    if (response) {
      console.warn("Could not get ARIX price from backend endpoint (priceServiceFrontend.js). Response data:", response.data);
    } else {
      console.warn("Could not get ARIX price from backend endpoint (priceServiceFrontend.js). No response object.");
    }
    return null;
  } catch (error) {
    let errorMessage = "Error fetching ARIX/USDT price via backend (priceServiceFrontend.js).";
    if (error.isAxiosError && error.response) {
      errorMessage += " Status: " + error.response.status + ", Data: " + JSON.stringify(error.response.data);
    } else if (error.isAxiosError && error.request) {
      errorMessage += " No response received from backend.";
    } else if (error.message) {
      errorMessage += " Message: " + error.message;
    }
    console.error(errorMessage, error);
    return null;
  }
};