// File: AR_Proj/ar_backend/src/services/gameService.js
const db = require('../config/database');
const ARIX_DECIMALS = 9; // Defined in tonUtils on frontend, good to have consistency or fetch from config

class GameService {
    /**
     * Plays a game of Coinflip.
     * @param {object} betData
     * @param {string} betData.userWalletAddress
     * @param {number} betData.betAmountArix
     * @param {string} betData.choice - 'heads' or 'tails'
     * @returns {Promise<object>} Game result: { outcome: 'win'/'loss', amountDelta: number, serverCoinSide: 'heads'/'tails', newBalance?: number }
     */
    async playCoinflip({ userWalletAddress, betAmountArix, choice }) {
        // --- Simulate Coin Flip (Replace with secure randomness for production) ---
        const randomNumber = Math.random();
        const serverCoinSide = randomNumber < 0.5 ? 'heads' : 'tails'; // 50/50 chance

        let outcome;
        let amountDelta; // Change in user's ARIX balance

        // Determine outcome
        if (choice === serverCoinSide) {
            outcome = 'win';
            amountDelta = betAmountArix; // User wins their bet amount (total payout 2x bet)
        } else {
            outcome = 'loss';
            amountDelta = -betAmountArix; // User loses their bet amount
        }

        // For MVP, we'll just record the bet.
        // A full implementation would need to manage user ARIX balances for games,
        // potentially via a game-specific wallet or smart contract interaction.
        // If using a DB balance:
        // 1. Fetch user's current game ARIX balance from DB.
        // 2. Check if balance >= betAmountArix.
        // 3. Update balance: newBalance = balance + amountDelta.
        // 4. Store updated balance.

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Ensure user exists (or create them if game is first interaction)
            await client.query("INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT (wallet_address) DO NOTHING", [userWalletAddress]);

            // Record the game
            const gameRecord = await client.query(
                `INSERT INTO coinflip_history (user_wallet_address, bet_amount_arix, choice, server_coin_side, outcome, amount_delta_arix)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userWalletAddress, betAmountArix, choice, serverCoinSide, outcome, amountDelta]
            );

            // --- CONCEPTUAL BALANCE UPDATE ---
            // This part is crucial and depends on your architecture for handling ARIX.
            // If you had an `arix_game_balance` column in your `users` table:
            // const balanceUpdateQuery = `
            // UPDATE users
            // SET arix_game_balance = arix_game_balance + $1
            // WHERE wallet_address = $2
            // RETURNING arix_game_balance;
            // `;
            // const balanceResult = await client.query(balanceUpdateQuery, [amountDelta, userWalletAddress]);
            // const newBalance = balanceResult.rows[0]?.arix_game_balance;
            // --- END CONCEPTUAL BALANCE UPDATE ---

            await client.query('COMMIT');
            console.log(`Coinflip game played by ${userWalletAddress}: Bet ${betAmountArix} on ${choice}, Server: ${serverCoinSide}, Outcome: ${outcome}, Delta: ${amountDelta}`);

            return {
                userWalletAddress,
                betAmountArix,
                choice,
                serverCoinSide,
                outcome,
                amountDelta, // This is the change (+/-)
                // newBalance: newBalance, // Include if you implement DB balance updates
                gameId: gameRecord.rows[0].game_id
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("GameService.playCoinflip error:", error.message);
            // Re-throw specific errors if needed for controller to handle (e.g., insufficient balance if checked from DB)
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Fetches Coinflip game history for a user.
     * @param {string} userWalletAddress
     * @returns {Promise<Array>} List of game history records.
     */
    async getCoinflipHistory(userWalletAddress) {
        const { rows } = await db.query(
            "SELECT * FROM coinflip_history WHERE user_wallet_address = $1 ORDER BY played_at DESC LIMIT 50", // Example: last 50 games
            [userWalletAddress]
        );
        return rows.map(row => ({
            ...row,
            bet_amount_arix: parseFloat(row.bet_amount_arix),
            amount_delta_arix: parseFloat(row.amount_delta_arix)
        }));
    }
}

module.exports = new GameService();