
const db = require('../config/database');
const ARIX_DECIMALS = 9; 

class GameService {
    
    async playCoinflip({ userWalletAddress, betAmountArix, choice }) {
        
        const randomNumber = Math.random();
        const serverCoinSide = randomNumber < 0.5 ? 'heads' : 'tails'; 

        let outcome;
        let amountDelta; 

        
        if (choice === serverCoinSide) {
            outcome = 'win';
            amountDelta = betAmountArix; 
        } else {
            outcome = 'loss';
            amountDelta = -betAmountArix; 
        }

        
        
        
        
        
        
        
        

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            
            await client.query("INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT (wallet_address) DO NOTHING", [userWalletAddress]);

            
            const gameRecord = await client.query(
                `INSERT INTO coinflip_history (user_wallet_address, bet_amount_arix, choice, server_coin_side, outcome, amount_delta_arix)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userWalletAddress, betAmountArix, choice, serverCoinSide, outcome, amountDelta]
            );

            
            
            
            
            
            
            
            
            
            
            
            

            await client.query('COMMIT');
            console.log(`Coinflip game played by ${userWalletAddress}: Bet ${betAmountArix} on ${choice}, Server: ${serverCoinSide}, Outcome: ${outcome}, Delta: ${amountDelta}`);

            return {
                userWalletAddress,
                betAmountArix,
                choice,
                serverCoinSide,
                outcome,
                amountDelta, 
                
                gameId: gameRecord.rows[0].game_id
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("GameService.playCoinflip error:", error.message);
            
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
        return rows.map(row => ({
            ...row,
            bet_amount_arix: parseFloat(row.bet_amount_arix),
            amount_delta_arix: parseFloat(row.amount_delta_arix)
        }));
    }
}

module.exports = new GameService();