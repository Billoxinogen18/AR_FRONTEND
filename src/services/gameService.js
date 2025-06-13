// This is the CORRECT FRONTEND service file.
// Its only job is to make API calls to your backend.
// It should NOT contain any 'require' statements or database logic.
import api from './api';

// --- COINFLIP FUNCTIONS ---

/**
 * Calls the backend to play a round of Coinflip.
 * @param {number} betAmountArix - The amount of ARIX to bet.
 * @param {string} choice - The user's choice, either 'heads' or 'tails'.
 * @returns {Promise<object>} The result of the game from the backend.
 */
export const playCoinFlip = async (betAmountArix, choice) => {
    const response = await api.post('/game/coinflip', {
        betAmountArix,
        choice
    });
    return response.data;
};

/**
 * Fetches the history of Coinflip games for the current user.
 * @returns {Promise<Array>} A list of past game records.
 */
export const getCoinflipHistory = async () => {
    const response = await api.get('/game/coinflip/history');
    return response.data;
}


// --- CRASH GAME FUNCTIONS ---
// These are the functions that your CrashGame.jsx component needs.

/**
 * Fetches the current state of the crash game from the backend.
 * @returns {Promise<object>} The current game state including status and multiplier.
 */
export const getCrashGameState = async () => {
    const response = await api.get('/game/crash/state');
    return response.data;
};

/**
 * Places a bet for the current user in the crash game.
 * @param {number} betAmountArix - The amount of ARIX to bet.
 * @returns {Promise<object>} The result of placing the bet.
 */
export const placeCrashBet = async (betAmountArix) => {
    const response = await api.post('/game/crash/bet', { betAmountArix });
    return response.data;
};

/**
 * Cashes out the current user's active bet in the crash game.
 * @returns {Promise<object>} The result of the cashout, including payout.
 */
export const cashOutCrashBet = async () => {
    const response = await api.post('/game/crash/cashout');
    return response.data;
};
