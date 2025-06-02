// File: AR_Proj/ar_backend/src/controllers/gameController.js
const gameService = require('../services/gameService'); // We'll create this
const { ARIX_TOKEN_MASTER_ADDRESS } = require('../config/envConfig');
const { Address } = require('@ton/core'); // For address validation if needed

// Helper to validate TON address string (can be moved to a util if used elsewhere)
const isValidTonAddress = (addr) => {
    try {
        Address.parse(addr);
        return true;
    } catch (e) {
        return false;
    }
};

exports.handleCoinflipBet = async (req, res, next) => {
    try {
        const { userWalletAddress, betAmountArix, choice } = req.body;

        // Basic Validations
        if (!userWalletAddress || !betAmountArix || !choice) {
            return res.status(400).json({ message: "Missing required bet information (userWalletAddress, betAmountArix, choice)." });
        }
        if (!isValidTonAddress(userWalletAddress)) {
             return res.status(400).json({ message: "Invalid userWalletAddress format." });
        }
        const numericBetAmount = parseFloat(betAmountArix);
        if (isNaN(numericBetAmount) || numericBetAmount <= 0) {
            return res.status(400).json({ message: "Invalid ARIX bet amount."});
        }
        if (choice !== 'heads' && choice !== 'tails') {
            return res.status(400).json({ message: "Invalid choice. Must be 'heads' or 'tails'." });
        }

        // Here, you would typically verify the user's actual ARIX balance.
        // For an MVP without direct on-chain balance check from backend for *every* bet,
        // this example proceeds with the game logic. A real system needs robust balance checks.
        // Consider fetching on-chain balance or checking a reliable off-chain ledger.
        // For now, we assume frontend did a basic check.

        const gameResult = await gameService.playCoinflip({
            userWalletAddress,
            betAmountArix: numericBetAmount,
            choice
        });

        res.status(200).json(gameResult);

    } catch (error) {
        if (error.message.includes("Insufficient balance for bet") || error.message.includes("Bet amount exceeds limit")) { // Example custom errors from service
            return res.status(400).json({ message: error.message });
        }
        console.error("CTRL: Error in handleCoinflipBet:", error.message, error.stack);
        next(error);
    }
};

// Placeholder for game history controller function
// exports.getCoinflipHistoryForUser = async (req, res, next) => {
// try {
// const { userWalletAddress } = req.params;
// if (!isValidTonAddress(userWalletAddress)) {
// return res.status(400).json({ message: "Invalid userWalletAddress format." });
//     }
//     const history = await gameService.getCoinflipHistory(userWalletAddress);
//     res.status(200).json(history);
//   } catch (error) {
//     console.error("CTRL: Error in getCoinflipHistoryForUser:", error.message);
//     next(error);
//   }
// };