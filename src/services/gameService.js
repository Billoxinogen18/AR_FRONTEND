const db = require('../config/database');
const crypto = require('crypto');

const ARIX_DECIMALS = 9;

/**
 * A local helper to update a user's ARIX balance within a transaction.
 * This ensures consistent balance updates for all games, as per the documentation.
 * @param {object} client - The active database client from a transaction.
 * @param {string} userWalletAddress - The user's wallet address.
 * @param {number} amountDelta - The amount to add (positive) or subtract (negative).
 * @returns {Promise<{newBalance: number, userId: number}>}
 */
const updateUserBalanceInGame = async (client, userWalletAddress, amountDelta) => {
    // This query ensures the user exists and gets their current balance and ID.
    // It's the most robust pattern, combining creation and retrieval.
    const userRes = await client.query(
        `INSERT INTO users (wallet_address, created_at, updated_at, claimable_arix_rewards)
         VALUES ($1, NOW(), NOW(), 0)
         ON CONFLICT (wallet_address)
         DO UPDATE SET updated_at = NOW()
         RETURNING claimable_arix_rewards, user_id;`,
        [userWalletAddress]
    );

    const user = userRes.rows[0];
    const currentBalance = parseFloat(user.claimable_arix_rewards);

    if (currentBalance + amountDelta < 0) {
        throw new Error('Insufficient balance.');
    }

    const newBalance = currentBalance + amountDelta;

    await client.query(
        'UPDATE users SET claimable_arix_rewards = $1, updated_at = NOW() WHERE user_id = $2',
        [newBalance.toFixed(ARIX_DECIMALS), user.user_id]
    );

    return { newBalance, userId: user.user_id };
};


// ========================================================================
// CRASH GAME ENGINE (Self-contained within this service file)
// ========================================================================

const crashGameState = {
    status: 'waiting',
    roundId: null,
    crashMultiplier: 0,
    currentMultiplier: 1.00,
    startTime: null,
    gameLoop: null,
    players: new Map(), // Stores { userId: { betAmountArix, status } }
};

const TICK_RATE = 100;
const WAITING_TIME = 8000;

const getMultiplierForTime = (seconds) => Math.max(1, Math.pow(1.015, seconds * 2));

const generateCrashPoint = () => {
    const e = 2 ** 32;
    const h = crypto.randomBytes(4).readUInt32LE(0);
    const crashPoint = Math.floor(100 * e - h) / (100 * (e - h));
    return Math.max(1.00, parseFloat(crashPoint.toFixed(2)));
};

const runGameCycle = async () => {
    try {
        console.log(`[Crash] Starting new round... Waiting for ${WAITING_TIME / 1000}s.`);
        crashGameState.status = 'waiting';
        crashGameState.currentMultiplier = 1.00;
        crashGameState.players.clear();

        const crashPoint = generateCrashPoint();
        crashGameState.crashMultiplier = crashPoint;

        const { rows } = await db.query('INSERT INTO crash_rounds (crash_multiplier, status) VALUES ($1, $2) RETURNING id', [crashPoint, 'waiting']);
        crashGameState.roundId = rows[0].id;

        await new Promise(resolve => setTimeout(resolve, WAITING_TIME));

        crashGameState.status = 'running';
        crashGameState.startTime = Date.now();
        await db.query('UPDATE crash_rounds SET status = $1 WHERE id = $2', ['running', crashGameState.roundId]);

        crashGameState.gameLoop = setInterval(async () => {
            const elapsed = (Date.now() - crashGameState.startTime) / 1000;
            crashGameState.currentMultiplier = getMultiplierForTime(elapsed);

            if (crashGameState.currentMultiplier >= crashGameState.crashMultiplier) {
                clearInterval(crashGameState.gameLoop);
                crashGameState.status = 'crashed';
                await db.query('UPDATE crash_rounds SET status = $1 WHERE id = $2', ['crashed', crashGameState.roundId]);

                for (const [userId, player] of crashGameState.players.entries()) {
                    if (player.status === 'placed') {
                        player.status = 'lost';
                        await db.query('UPDATE crash_bets SET status = $1 WHERE user_id = $2 AND round_id = $3', ['lost', userId, crashGameState.roundId]);
                    }
                }
                setTimeout(runGameCycle, 5000);
            }
        }, TICK_RATE);
    } catch (error) {
        console.error('[Crash] A critical error occurred in the game cycle:', error);
        setTimeout(runGameCycle, 15000); // Attempt to recover
    }
};

// ========================================================================
// GAME SERVICE CLASS
// ========================================================================

class GameService {
    async playCoinflip({ userWalletAddress, betAmountArix, choice }) {
        const randomNumber = Math.random();
        const serverCoinSide = randomNumber < 0.5 ? 'heads' : 'tails';
        const outcome = choice === serverCoinSide ? 'win' : 'loss';
        const amountDelta = outcome === 'win' ? betAmountArix : -betAmountArix;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // This now updates the main balance, aligning with the PDF and ensuring players are rewarded/debited.
            const { newBalance } = await updateUserBalanceInGame(client, userWalletAddress, amountDelta);

            await client.query(
                `INSERT INTO coinflip_history (user_wallet_address, bet_amount_arix, choice, server_coin_side, outcome, amount_delta_arix) VALUES ($1, $2, $3, $4, $5, $6)`,
                [userWalletAddress, betAmountArix, choice, serverCoinSide, outcome, amountDelta]
            );

            await client.query('COMMIT');
            return {
                outcome,
                serverCoinSide,
                newClaimableArixRewards: newBalance.toFixed(ARIX_DECIMALS),
            };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("GameService.playCoinflip error:", error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getCoinflipHistory(userWalletAddress) {
        const { rows } = await db.query(
            "SELECT * FROM coinflip_history WHERE user_wallet_address = $1 ORDER BY played_at DESC LIMIT 50", 
            [userWalletAddress]
        );
        return rows.map(row => ({ ...row, bet_amount_arix: parseFloat(row.bet_amount_arix), amount_delta_arix: parseFloat(row.amount_delta_arix) }));
    }

    // --- Crash Game Methods ---
    getCrashState() {
        return {
            status: crashGameState.status,
            multiplier: crashGameState.currentMultiplier.toFixed(2),
        };
    }

    async placeCrashBet({ userWalletAddress, betAmountArix }) {
        if (crashGameState.status !== 'waiting') throw new Error('Betting is currently closed.');

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const balanceChange = -Math.abs(betAmountArix);
            const { newBalance, userId } = await updateUserBalanceInGame(client, userWalletAddress, balanceChange);
            
            if (crashGameState.players.has(userId)) throw new Error('You have already placed a bet in this round.');

            await client.query('INSERT INTO crash_bets (user_id, round_id, bet_amount, status) VALUES ($1, $2, $3, $4)', [userId, crashGameState.roundId, betAmountArix, 'placed']);
            crashGameState.players.set(userId, { betAmountArix, status: 'placed' });

            await client.query('COMMIT');
            return { success: true, newBalance };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[Crash] Error placing bet:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async cashOutCrashBet({ userWalletAddress }) {
        if (crashGameState.status !== 'running') throw new Error('Cannot cash out, game is not running.');

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // We must get the userId first to find the bet.
            const userRes = await client.query('SELECT user_id FROM users WHERE wallet_address = $1', [userWalletAddress]);
            if (userRes.rows.length === 0) throw new Error('User not found.');
            const userId = userRes.rows[0].user_id;
            
            const player = crashGameState.players.get(userId);
            if (!player || player.status !== 'placed') throw new Error('No active bet to cash out.');

            const cashOutMultiplier = parseFloat(crashGameState.currentMultiplier.toFixed(2));
            const payout = player.betAmountArix * cashOutMultiplier;
            const { newBalance } = await updateUserBalanceInGame(client, userWalletAddress, payout);

            await client.query('UPDATE crash_bets SET status = $1, cash_out_multiplier = $2, payout = $3 WHERE user_id = $4 AND round_id = $5', ['cashed_out', cashOutMultiplier, payout.toFixed(4), userId, crashGameState.roundId]);
            player.status = 'cashed_out';
            
            await client.query('COMMIT');
            return { success: true, newBalance, payout, cashOutMultiplier };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[Crash] Error cashing out:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    async getCrashHistory(limit = 20) {
        const { rows } = await db.query("SELECT crash_multiplier FROM crash_rounds WHERE status = 'crashed' ORDER BY created_at DESC LIMIT $1", [limit]);
        return rows.map(r => r.crash_multiplier);
    }
}

const gameServiceInstance = new GameService();

const startCrashGameEngine = () => {
    console.log('[Game Service] Initializing Crash Game Engine...');
    runGameCycle();
};

// Export both the service instance for controllers and the engine starter for app.js
module.exports = {
    gameService: gameServiceInstance,
    startCrashGameEngine,
};
