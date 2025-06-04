// File: AR_FRONTEND/src/utils/constants.js

// Number of decimals for token amounts
export const ARIX_DECIMALS = 9;
export const USDT_DECIMALS = 6; // Standard for most USDT on TON (like jUSDT)
export const USD_DECIMALS = 2;  // For displaying fiat USD values

// Minimum withdrawal amount in USD for USDT rewards
export const MIN_USDT_WITHDRAWAL_USD_VALUE = 3;

// TON Connect manifest URL - ensure this is correctly placed in your /public folder
// and the path here correctly points to it from your deployment root.
export const TONCONNECT_MANIFEST_URL = '/tonconnect-manifest.json';

// TON Network (mainnet or testnet) - driven by Vite environment variable
export const TON_NETWORK = import.meta.env.VITE_TON_NETWORK || 'mainnet';

// Base URL for TON explorer, adjusted by network
export const TON_EXPLORER_URL = TON_NETWORK === 'testnet' ? 'https://testnet.tonscan.org' : 'https://tonscan.org';

// Telegram Bot username - replace with your actual bot username if not using env var
export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'arix_terminal_tma_bot'; // Default or from .env

// Base URL for generating referral links (usually the TMA's deployed URL)
export const REFERRAL_LINK_BASE = import.meta.env.VITE_TMA_URL || window.location.origin;

// Default error message
export const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

// Default success message
export const DEFAULT_SUCCESS_MESSAGE = 'Operation successful!';

// Image placeholders or fallback URLs
export const FALLBACK_IMAGE_URL = '/img/coin_spinning.gif'; // Create a generic placeholder in /public/img
export const COINFLIP_HEADS_IMG = '/img/coin_heads.png'; // Provided in mockups
export const COINFLIP_TAILS_IMG = '/img/coin_tails.png'; // Provided in mockups
export const COINFLIP_SPINNING_GIF = '/img/coin_spinning.gif'; // Provided in mockups
export const COINFLIP_DEFAULT_IMG = '/img/coin-default-cf.png'; // Provided in mockups

// Add any other frontend-specific constants here as your app grows
// Example:
// export const API_REQUEST_TIMEOUT = 30000; // 30 seconds
