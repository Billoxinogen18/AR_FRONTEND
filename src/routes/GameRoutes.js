// File: AR_Proj/ar_backend/src/routes/gameRoutes.js
const express = require('express');
const gameController = require('../controllers/gameController'); // We'll create this
// const { authenticate } = require('../middlewares/authMiddleware'); // Optional: if auth is needed

const router = express.Router();

// POST /api/game/coinflip/bet
router.post('/coinflip/bet', gameController.handleCoinflipBet);

// GET /api/game/coinflip/history/:userWalletAddress (Example for game history)
// router.get('/coinflip/history/:userWalletAddress', gameController.getCoinflipHistoryForUser);


module.exports = router;