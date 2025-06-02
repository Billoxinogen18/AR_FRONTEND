#!/bin/bash

# Script to create/update files for the ARIX Terminal's Fixed Reward APR Staking System.
#
# IMPORTANT:
# 1. RUN THIS SCRIPT FROM THE ROOT OF YOUR 'AR_Proj' DIRECTORY:
#    /Users/israelbill/Development/ar_terminal/AR_Proj
# 2. ENSURE YOU HAVE BACKED UP YOUR PROJECT OR COMMITTED CHANGES TO GIT BEFORE RUNNING.
#    This script will overwrite existing files if they have the same name and path.

echo "🚀 Setting up Fixed Reward APR Staking System for ARIX Terminal..."
echo "This script will create/overwrite several files. Ensure you have a backup!"
read -p "   Press [Enter] to continue, or [Ctrl+C] to cancel."

# Define base paths relative to the script's execution directory
# Assuming the script is run from /Users/israelbill/Development/ar_terminal/AR_Proj
FRONTEND_DIR="./AR_FRONTEND"
BACKEND_DIR="./ar_backend"
CONTRACTS_DIR="${BACKEND_DIR}/contracts" # New directory for smart contracts

# --- Create Directories ---
echo ""
echo "🔄 Creating necessary directories..."
mkdir -p "${FRONTEND_DIR}/src/components/earn"
mkdir -p "${BACKEND_DIR}/db_migrations"
mkdir -p "${BACKEND_DIR}/src/controllers"
mkdir -p "${BACKEND_DIR}/src/services"
mkdir -p "${CONTRACTS_DIR}"
echo "   - Directories ensured."

# --- Frontend File Updates ---
echo ""
echo "🔄 Updating Frontend Files..."

# 1. Create/Update tma_frontend/src/components/earn/StakingPlans.jsx
# This version is based on the structure your previous script intended,
# using hardcoded plans for initial UI structure. Your EarnPage will fetch dynamic plans.
echo "   - Creating/Updating ${FRONTEND_DIR}/src/components/earn/StakingPlans.jsx"
cat << 'EOF' > "${FRONTEND_DIR}/src/components/earn/StakingPlans.jsx"
// File: AR_FRONTEND/src/components/earn/StakingPlans.jsx
// Note: This component displays plan structures. Actual plan data is fetched from the backend in EarnPage.
import React from 'react';
import { Card, Row, Col, Button, Statistic, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ARIX_DECIMALS } from '../../utils/tonUtils'; // Assuming this path is correct

const { Title: AntTitle, Text } = Typography;

// This component receives 'plans' and 'currentArxPrice' as props from EarnPage.
// The hardcoded data from your example script is not used here directly,
// as the component is designed to be dynamic.
const StakingPlans = ({ plans, onSelectPlan, currentArxPrice }) => {
  if (!plans || plans.length === 0) {
    return <div style={{textAlign: 'center', color: '#aaa', marginTop: 40, padding: 20}} className="glass-pane">No staking plans available at the moment. Please check back later or ensure the backend is providing them.</div>;
  }
  return (
    <div>
      <AntTitle level={2} style={{ textAlign: 'center', marginBottom: '30px', color: 'white', fontWeight: 'bold' }}>
        Choose Your Staking Plan
      </AntTitle>
      <Row gutter={[24, 24]} justify="center">
        {plans.map((plan) => {
          // Ensure plan properties are accessed correctly, e.g., plan.apr, plan.duration, plan.minStakeArix
          // The backend provides 'apr', 'duration', 'earlyUnstakePenaltyPercent', 'minStakeArix'
          const minStakeArixNum = parseFloat(plan.minStakeArix || 0);
          const minStakeUsdtApprox = currentArxPrice && minStakeArixNum > 0 ? (minStakeArixNum * currentArxPrice).toFixed(2) : null;

          return (
            <Col xs={24} sm={18} md={12} lg={8} key={plan.key || plan.id}>
              <Card
                className="neumorphic-glass-card"
                hoverable
                actions={[
                  <Button
                    type="primary"
                    key={`select-${plan.key || plan.id}`}
                    onClick={() => onSelectPlan(plan)}
                    style={{ margin: '0 auto', display: 'block', width: 'calc(100% - 48px)'}}
                    icon={<CheckCircleOutlined />}
                  >
                    Select Plan
                  </Button>,
                ]}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Text style={{ color: '#00adee', fontWeight: 'bold', fontSize: '1.4em' }}>{plan.title}</Text>
                </div>
                <Statistic
                  title={<Text style={{color: '#aaa'}}>Duration</Text>}
                  value={`${plan.duration || plan.duration_days} Days`} // Handles if backend sends duration or duration_days
                  valueStyle={{ color: '#00adee', fontWeight: 'bold', fontSize: '1.8em' }}
                />
                <Statistic
                  title={<Text style={{color: '#aaa'}}>Fixed Reward APR</Text>}
                  value={`${plan.apr}%`} // Assumes 'apr' is the fixed total APR
                  suffix={<Text style={{color: '#52c41a', fontSize: '0.8em', marginLeft: 4}}> ARIX</Text>}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: '1.8em' }}
                />
                <Statistic
                  title={<Text style={{color: '#aaa'}}>Min. Stake</Text>}
                  value={`${minStakeArixNum.toFixed(ARIX_DECIMALS)} ARIX`}
                  valueStyle={{ color: '#e0e0e0', fontWeight: 'normal', fontSize: '1.1em' }}
                  suffix={minStakeUsdtApprox ? <Text style={{color: '#888', fontSize: '0.8em', marginLeft: 4}}>(~${minStakeUsdtApprox} USDT)</Text> : ""}
                />
                <Statistic
                  title={<Text style={{color: '#aaa'}}>Early Unstake Penalty <Tooltip title={`Penalty applies to staked ARIX if unstaked before ${plan.duration || plan.duration_days} days. Rewards are forfeited.`}><InfoCircleOutlined style={{marginLeft: '4px', color: '#aaa'}}/></Tooltip></Text>}
                  value={`${plan.earlyUnstakePenaltyPercent}%`}
                  valueStyle={{ color: '#ff7875', fontWeight: '500', fontSize: '1.1em' }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default StakingPlans;
EOF
echo "   - ${FRONTEND_DIR}/src/components/earn/StakingPlans.jsx updated."


# --- Backend File Updates ---
echo ""
echo "🔄 Updating Backend Files..."

# 1. Create/Update backend/db_migrations/001_initial_schema.sql
echo "   - Creating/Updating ${BACKEND_DIR}/db_migrations/001_initial_schema.sql"
cat << 'EOF' > "${BACKEND_DIR}/db_migrations/001_initial_schema.sql"
-- Updated Schema for ARIX Terminal Backend (ARIX-Only Staking with Fixed APR)

DROP TABLE IF EXISTS user_stakes CASCADE;
DROP TABLE IF EXISTS staking_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS coinflip_history CASCADE; -- Ensuring this is also dropped if it exists, for a clean slate if needed

CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(68) PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staking_plans (
    plan_id SERIAL PRIMARY KEY,
    plan_key VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL,
    fixed_apr_percent NUMERIC(5, 2) NOT NULL, -- Renamed from base_apr, removed bonus_apr
    early_unstake_penalty_percent NUMERIC(5, 2) NOT NULL,
    min_stake_arix NUMERIC(20, 9) DEFAULT 0,
    max_stake_arix NUMERIC(20, 9),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stakes (
    stake_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet_address VARCHAR(68) NOT NULL REFERENCES users(wallet_address),
    staking_plan_id INTEGER NOT NULL REFERENCES staking_plans(plan_id),
    arix_amount_staked NUMERIC(20, 9) NOT NULL,
    reference_usdt_value_at_stake_time NUMERIC(20, 6),
    stake_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    unlock_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    onchain_stake_tx_boc TEXT, -- Can store tx hash or full BOC
    onchain_stake_tx_hash VARCHAR(64), -- Optional: for easier lookup
    status VARCHAR(30) NOT NULL DEFAULT 'pending_confirmation', -- e.g., pending_confirmation, active, early_unstaked, completed, failed
    arix_reward_calculated NUMERIC(20, 9),
    arix_reward_paid NUMERIC(20, 9) DEFAULT 0,
    arix_penalty_applied NUMERIC(20, 9) DEFAULT 0,
    onchain_unstake_tx_boc TEXT,
    onchain_unstake_tx_hash VARCHAR(64), -- Optional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coinflip_history (
    game_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet_address VARCHAR(68) NOT NULL REFERENCES users(wallet_address),
    bet_amount_arix NUMERIC(20, 9) NOT NULL,
    choice VARCHAR(10) NOT NULL, -- 'heads' or 'tails'
    server_coin_side VARCHAR(10) NOT NULL,
    outcome VARCHAR(10) NOT NULL, -- 'win' or 'loss'
    amount_delta_arix NUMERIC(20, 9) NOT NULL, -- Positive for win, negative for loss
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- onchain_tx_hash VARCHAR(64) -- If game bets become on-chain
);

CREATE INDEX IF NOT EXISTS idx_user_stakes_wallet_address ON user_stakes(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_stakes_status ON user_stakes(status);
CREATE INDEX IF NOT EXISTS idx_coinflip_history_wallet_address ON coinflip_history(user_wallet_address);


-- Example Staking Plan Data (Updated with Fixed APR structure)
INSERT INTO staking_plans (plan_key, title, duration_days, fixed_apr_percent, early_unstake_penalty_percent, min_stake_arix, is_active) VALUES
('PLAN_30D', '30 Day Stake', 30, 1.00, 7.00, 100, TRUE),
('PLAN_60D', '60 Day Stake', 60, 2.00, 8.00, 200, TRUE),
('PLAN_120D', '120 Day Stake', 120, 3.00, 9.00, 500, TRUE),
('PLAN_240D', '240 Day Stake', 240, 4.00, 10.00, 1000, TRUE)
ON CONFLICT (plan_key) DO UPDATE SET
    title = EXCLUDED.title,
    duration_days = EXCLUDED.duration_days,
    fixed_apr_percent = EXCLUDED.fixed_apr_percent,
    early_unstake_penalty_percent = EXCLUDED.early_unstake_penalty_percent,
    min_stake_arix = EXCLUDED.min_stake_arix,
    is_active = EXCLUDED.is_active;
EOF
echo "   - ${BACKEND_DIR}/db_migrations/001_initial_schema.sql updated."

# 2. Create/Update backend/src/controllers/earnController.js
echo "   - Creating/Updating ${BACKEND_DIR}/src/controllers/earnController.js"
cat << 'EOF' > "${BACKEND_DIR}/src/controllers/earnController.js"
// File: ar_backend/src/controllers/earnController.js
const earnService = require('../services/earnService');
const priceService = require('../services/priceService'); // Assuming you have this for ARIX price
const { ARIX_TOKEN_MASTER_ADDRESS, STAKING_CONTRACT_ADDRESS } = require('../config/envConfig'); // Ensure these are in your .env

exports.getStakingConfig = async (req, res, next) => {
    try {
        const plansFromDb = await earnService.getActiveStakingPlans();
        const currentArxPrice = await priceService.getArxUsdtPrice(); // Fetches current ARIX price

        const config = {
            stakingContractAddress: STAKING_CONTRACT_ADDRESS, // Address of your deployed staking smart contract
            arxToken: {
                masterAddress: ARIX_TOKEN_MASTER_ADDRESS, // Master address of ARIX Jetton
                decimals: 9, // ARIX token decimals
            },
            stakingPlans: plansFromDb.map(p => ({
                key: p.plan_key,
                id: p.plan_id.toString(), // Ensure ID is string for frontend if needed
                title: p.title,
                duration: parseInt(p.duration_days, 10),
                apr: parseFloat(p.fixed_apr_percent), // This is the total fixed APR
                earlyUnstakePenaltyPercent: parseFloat(p.early_unstake_penalty_percent),
                minStakeArix: parseFloat(p.min_stake_arix)
            })),
            currentArxUsdtPrice: currentArxPrice
        };
        res.status(200).json(config);
    } catch (error) {
        console.error("CTRL: Error in getStakingConfig:", error);
        next(error);
    }
};

exports.getCurrentArxPrice = async (req, res, next) => {
    try {
        const price = await priceService.getArxUsdtPrice();
        if (price !== null) {
            res.status(200).json({ price });
        } else {
            res.status(503).json({ message: "Could not fetch ARIX/USDT price at the moment." });
        }
    } catch (error)
        console.error("CTRL: Error in getCurrentArxPrice:", error);
        next(error);
    }
};

exports.recordUserStake = async (req, res, next) => {
    try {
        const { planKey, arixAmount, userWalletAddress, transactionBoc, referenceUsdtValue } = req.body;

        // Basic Validations
        if (!planKey || !arixAmount || !userWalletAddress || !transactionBoc) {
            return res.status(400).json({ message: "Missing required stake information (planKey, arixAmount, userWalletAddress, transactionBoc)." });
        }
        const numericArixAmount = parseFloat(arixAmount);
        if (isNaN(numericArixAmount) || numericArixAmount <= 0) {
            return res.status(400).json({ message: "Invalid ARIX amount."});
        }
        const numericReferenceUsdtValue = referenceUsdtValue ? parseFloat(referenceUsdtValue) : null;

        // TODO: Implement robust backend verification of transactionBoc against the TON blockchain.
        // This step is CRITICAL to confirm the user actually sent ARIX to the staking contract.
        // For now, we proceed to record, but status should be 'pending_confirmation'.
        // let onChainTxHash = null; // Extract or derive from BOC if possible/needed

        const newStake = await earnService.createStake({
            planKey,
            arixAmount: numericArixAmount,
            userWalletAddress,
            transactionBoc, // Store the BOC for later verification
            // onchainStakeTxHash: onChainTxHash, // Store if available
            referenceUsdtValue: numericReferenceUsdtValue,
        });

        res.status(201).json({
            message: "Stake recorded and awaiting on-chain confirmation. Your stake will become active once verified.",
            stake: newStake
        });
    } catch (error) {
        console.error("CTRL: Error recording stake:", error.message, error.stack);
        if (error.message.includes("Invalid staking plan key") || error.message.includes("Minimum stake for")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

exports.getUserStakes = async (req, res, next) => {
    try {
        const { userWalletAddress } = req.params;
        if (!userWalletAddress) {
            return res.status(400).json({ message: "User wallet address is required." });
        }
        const currentArxPrice = await priceService.getArxUsdtPrice();
        // This service method should fetch all stakes (active, pending, completed, etc.) for history
        const stakes = await earnService.findAllStakesByUserWithDetails(userWalletAddress, currentArxPrice);
        res.status(200).json(stakes);
    } catch (error) {
        console.error("CTRL: Error in getUserStakes:", error);
        next(error);
    }
};

exports.initiateUnstake = async (req, res, next) => {
    try {
        const { userWalletAddress, stakeId } = req.body;
        if (!userWalletAddress || !stakeId) {
            return res.status(400).json({ message: "User wallet address and stake ID are required." });
        }
        // This service method prepares information for unstaking, including penalties if any.
        const unstakePreparationDetails = await earnService.prepareUnstake(userWalletAddress, stakeId);
        res.status(200).json(unstakePreparationDetails);
    } catch (error) {
        console.error("CTRL: Error in initiateUnstake:", error.message);
         if (error.message.includes("Stake not found") || error.message.includes("not owned by user") || error.message.includes("Stake is not active")) {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

exports.confirmUnstake = async (req, res, next) => {
    try {
        const { userWalletAddress, stakeId, unstakeTransactionBoc } = req.body;
        if (!userWalletAddress || !stakeId || !unstakeTransactionBoc) {
            return res.status(400).json({ message: "Missing required unstake confirmation information (userWalletAddress, stakeId, unstakeTransactionBoc)." });
        }

        // TODO: Implement robust backend verification of unstakeTransactionBoc.
        // Confirm the smart contract processed the unstake and ARIX was returned.
        // let onChainUnstakeTxHash = null; // Extract or derive

        // This service method finalizes the unstake in the DB after on-chain confirmation (simulated for now).
        const result = await earnService.finalizeUnstake({
            userWalletAddress,
            stakeId,
            unstakeTransactionBoc,
            // onchainUnstakeTxHash: onChainUnstakeTxHash
        });
        res.status(200).json(result);
    } catch (error) {
        console.error("CTRL: Error in confirmUnstake:", error.message);
        if (error.message.includes("Stake not found") || error.message.includes("does not allow finalization")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};
EOF
echo "   - ${BACKEND_DIR}/src/controllers/earnController.js updated."

# 3. Create/Update backend/src/services/earnService.js
echo "   - Creating/Updating ${BACKEND_DIR}/src/services/earnService.js"
cat << 'EOF' > "${BACKEND_DIR}/src/services/earnService.js"
// File: ar_backend/src/services/earnService.js
const db = require('../config/database'); // Your database connection setup

const ARIX_DECIMALS = 9; // For formatting consistency, though calculations are numeric

class EarnService {
    async getActiveStakingPlans() {
        const { rows } = await db.query(
            "SELECT plan_id, plan_key, title, duration_days, fixed_apr_percent, early_unstake_penalty_percent, min_stake_arix, is_active FROM staking_plans WHERE is_active = TRUE ORDER BY duration_days ASC"
        );
        return rows;
    }

    async getPlanByKey(planKey) {
        const { rows } = await db.query("SELECT * FROM staking_plans WHERE plan_key = $1 AND is_active = TRUE", [planKey]);
        return rows[0];
    }

    async createStake({ planKey, arixAmount, userWalletAddress, transactionBoc, onchainStakeTxHash, referenceUsdtValue }) {
        const plan = await this.getPlanByKey(planKey);
        if (!plan) {
            throw new Error("Invalid or inactive staking plan key.");
        }

        const numericMinStakeArix = parseFloat(plan.min_stake_arix);
        if (arixAmount < numericMinStakeArix) {
            throw new Error(`Minimum stake for ${plan.title} is ${numericMinStakeArix.toFixed(ARIX_DECIMALS)} ARIX.`);
        }

        const stakeTimestamp = new Date();
        const unlockTimestamp = new Date(stakeTimestamp.getTime() + parseInt(plan.duration_days, 10) * 24 * 60 * 60 * 1000);

        const { rows } = await db.query(
            `INSERT INTO user_stakes (user_wallet_address, staking_plan_id, arix_amount_staked, reference_usdt_value_at_stake_time, stake_timestamp, unlock_timestamp, onchain_stake_tx_boc, onchain_stake_tx_hash, status, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
            [userWalletAddress, plan.plan_id, arixAmount, referenceUsdtValue, stakeTimestamp, unlockTimestamp, transactionBoc, onchainStakeTxHash, 'pending_confirmation']
        );
        // TODO: After this, a background job should monitor this stake and verify the onchain_stake_tx_boc.
        // Upon successful verification, status changes to 'active'.
        return rows[0];
    }

    // Renamed to reflect fetching ALL stakes for history purposes
    async findAllStakesByUserWithDetails(userWalletAddress, currentArxPrice) {
        const query = `
            SELECT
                us.stake_id,
                sp.plan_key,
                sp.title AS plan_title,
                sp.duration_days AS plan_duration_days,
                sp.fixed_apr_percent,
                sp.early_unstake_penalty_percent,
                us.arix_amount_staked,
                us.reference_usdt_value_at_stake_time,
                us.stake_timestamp,
                us.unlock_timestamp,
                us.status,
                us.arix_reward_calculated,
                us.arix_penalty_applied,
                us.onchain_stake_tx_hash,
                us.onchain_unstake_tx_hash,
                (EXTRACT(EPOCH FROM (us.unlock_timestamp - NOW())) / (24 * 60 * 60))::INTEGER AS remaining_days
            FROM user_stakes us
            JOIN staking_plans sp ON us.staking_plan_id = sp.plan_id
            WHERE us.user_wallet_address = $1
            ORDER BY us.stake_timestamp DESC;
        `;
        const { rows } = await db.query(query, [userWalletAddress]);

        return rows.map(row => {
            const arixAmountStakedNum = parseFloat(row.arix_amount_staked);
            const fixedAprNum = parseFloat(row.fixed_apr_percent);
            const durationDaysNum = parseInt(row.plan_duration_days, 10);

            let accruedArixRewardEstimate = 0;
            if (row.status === 'active' || row.status === 'pending_confirmation') {
                const timeElapsedMs = new Date() - new Date(row.stake_timestamp);
                const daysElapsed = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24));
                // Accrual should not exceed the plan duration for estimation purposes
                const effectiveDaysForAccrual = Math.min(daysElapsed, durationDaysNum);
                accruedArixRewardEstimate = (arixAmountStakedNum * (fixedAprNum / 100) * effectiveDaysForAccrual) / 365;
            }

            return {
                id: row.stake_id,
                planKey: row.plan_key,
                planTitle: row.plan_title,
                arixAmountStaked: arixAmountStakedNum.toFixed(ARIX_DECIMALS),
                currentUsdtValueRef: currentArxPrice && arixAmountStakedNum > 0 ? (arixAmountStakedNum * currentArxPrice).toFixed(2) : 'N/A',
                referenceUsdtValueAtStakeTime: row.reference_usdt_value_at_stake_time ? parseFloat(row.reference_usdt_value_at_stake_time).toFixed(2) : 'N/A',
                apr: fixedAprNum,
                earlyUnstakePenaltyPercent: parseFloat(row.early_unstake_penalty_percent),
                // For display, show calculated reward if stake is completed/early_unstaked, otherwise show estimate
                accruedArixReward: (row.status === 'completed' || row.status === 'early_unstaked') && row.arix_reward_calculated
                                     ? parseFloat(row.arix_reward_calculated).toFixed(ARIX_DECIMALS)
                                     : accruedArixRewardEstimate.toFixed(ARIX_DECIMALS),
                arixPenaltyApplied: row.arix_penalty_applied ? parseFloat(row.arix_penalty_applied).toFixed(ARIX_DECIMALS) : '0.00',
                remainingDays: row.status === 'active' || row.status === 'pending_confirmation' ? (Math.max(0, row.remaining_days)) : 0,
                status: row.status,
                stakeTimestamp: new Date(row.stake_timestamp).toISOString(),
                unlockTimestamp: new Date(row.unlock_timestamp).toISOString(),
                onchainStakeTxHash: row.onchain_stake_tx_hash,
                onchainUnstakeTxHash: row.onchain_unstake_tx_hash,
                planDurationDays: durationDaysNum
            };
        });
    }

    async prepareUnstake(userWalletAddress, stakeId) {
        const { rows } = await db.query(
            `SELECT us.*, sp.duration_days, sp.fixed_apr_percent, sp.early_unstake_penalty_percent
             FROM user_stakes us
             JOIN staking_plans sp ON us.staking_plan_id = sp.plan_id
             WHERE us.stake_id = $1 AND us.user_wallet_address = $2`,
            [stakeId, userWalletAddress]
        );

        if (rows.length === 0) throw new Error("Stake not found or not owned by user.");
        const stake = rows[0];

        if (stake.status !== 'active') { // User can only initiate unstake for 'active' stakes
             throw new Error(`Stake is not active. Current status: ${stake.status}. Cannot initiate unstake.`);
        }

        const now = new Date();
        const unlockTime = new Date(stake.unlock_timestamp);
        const principalArix = parseFloat(stake.arix_amount_staked);
        const fixedApr = parseFloat(stake.fixed_apr_percent);
        const durationDays = parseInt(stake.duration_days, 10);

        let penaltyPercentToApply = 0;
        let calculatedReward = 0;
        let message = "";
        const isEarly = now < unlockTime;

        if (isEarly) { // Early unstake
            penaltyPercentToApply = parseFloat(stake.early_unstake_penalty_percent);
            calculatedReward = 0; // Rewards are forfeited
            message = `This is an EARLY unstake. A ${penaltyPercentToApply}% penalty on the staked ARIX will apply. All accrued ARIX rewards will be forfeited.`;
        } else { // Full term or late unstake
            penaltyPercentToApply = 0;
            calculatedReward = (principalArix * (fixedApr / 100) * durationDays) / 365;
            message = "Ready for full-term unstake. You will receive your principal ARIX and calculated ARIX rewards.";
        }

        return {
            message,
            stakeId: stake.stake_id,
            isEarly,
            penaltyPercentApplied: penaltyPercentToApply, // The penalty rate
            estimatedRewardArix: calculatedReward.toFixed(ARIX_DECIMALS), // Reward if full term, 0 if early
            principalArix: principalArix.toFixed(ARIX_DECIMALS)
        };
    }

    async finalizeUnstake({ userWalletAddress, stakeId, unstakeTransactionBoc, onchainUnstakeTxHash }) {
        // This function is called AFTER the user has submitted the on-chain unstake transaction
        // and the backend has (ideally) verified it.

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                `SELECT us.*, sp.fixed_apr_percent, sp.duration_days, sp.early_unstake_penalty_percent
                 FROM user_stakes us
                 JOIN staking_plans sp ON us.staking_plan_id = sp.plan_id
                 WHERE us.stake_id = $1 AND us.user_wallet_address = $2 FOR UPDATE`, // Lock the row
                [stakeId, userWalletAddress]
            );
            if (rows.length === 0) throw new Error("Stake not found for finalization.");
            const stake = rows[0];

            // Status should be 'active' or 'pending_unstake' (if we introduce such a state)
            if (stake.status !== 'active') {
                 throw new Error(`Stake status (${stake.status}) does not allow finalization. Expected 'active'.`);
            }

            let arixRewardFinal = 0;
            const now = new Date(); // Use current time for determining early vs full term
            const unlockTime = new Date(stake.unlock_timestamp);
            const principalArix = parseFloat(stake.arix_amount_staked);
            const fixedApr = parseFloat(stake.fixed_apr_percent);
            const durationDays = parseInt(stake.duration_days, 10);
            const earlyUnstakePenaltyRate = parseFloat(stake.early_unstake_penalty_percent);

            let finalStatus = '';
            let penaltyAmountArix = 0;
            // let actualPrincipalReturnedByContract = principalArix; // This would be confirmed by SC event/query

            if (now < unlockTime) { // Early unstake
                finalStatus = 'early_unstaked';
                arixRewardFinal = 0; // No rewards for early unstake
                penaltyAmountArix = principalArix * (earlyUnstakePenaltyRate / 100);
                // actualPrincipalReturnedByContract -= penaltyAmountArix;
            } else { // Full term or late unstake
                finalStatus = 'completed';
                // Reward is based on the full original duration and APR
                arixRewardFinal = (principalArix * (fixedApr / 100) * durationDays) / 365;
            }

            arixRewardFinal = parseFloat(arixRewardFinal.toFixed(ARIX_DECIMALS));
            penaltyAmountArix = parseFloat(penaltyAmountArix.toFixed(ARIX_DECIMALS));

            // Update the stake record in the database
            // arix_reward_paid would be updated if the SC confirms payout. For now, we record calculated.
            const updateQuery = `
                UPDATE user_stakes
                SET status = $1,
                    arix_reward_calculated = $2,
                    arix_penalty_applied = $3,
                    onchain_unstake_tx_boc = $4,
                    onchain_unstake_tx_hash = $5,
                    updated_at = NOW()
                WHERE stake_id = $6 RETURNING *;
            `;
            const updatedStakeResult = await client.query(updateQuery, [
                finalStatus,
                arixRewardFinal,
                penaltyAmountArix,
                unstakeTransactionBoc,
                onchainUnstakeTxHash,
                stakeId
            ]);

            await client.query('COMMIT');

            return {
                message: `Unstake finalized in DB. Status: ${finalStatus}. Calculated ARIX Reward: ${arixRewardFinal}. Penalty Applied: ${penaltyAmountArix}.`,
                updatedStake: updatedStakeResult.rows[0]
            };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("SERVICE: Error in finalizeUnstake:", error.message, error.stack);
            throw error; // Re-throw to be caught by controller
        } finally {
            client.release();
        }
    }

    // Placeholder for a background job function
    async verifyOnChainStake(stakeId) {
        // 1. Fetch stake with 'pending_confirmation' and its onchain_stake_tx_boc/hash
        // 2. Query TON blockchain (using TonClient or an API like Toncenter/TonAPI) for the transaction status.
        // 3. Verify:
        //    - Transaction was successful.
        //    - Correct amount of ARIX was transferred.
        //    - Destination was the STAKING_CONTRACT_ADDRESS's Jetton Wallet.
        //    - Source was the user_wallet_address's Jetton Wallet.
        //    - Forward payload matches expected parameters (optional deep check).
        // 4. If verified: UPDATE user_stakes SET status = 'active' WHERE stake_id = $1
        // 5. If failed/invalid: UPDATE user_stakes SET status = 'failed', notes = 'On-chain verification failed: reason' WHERE stake_id = $1
        console.log(`TODO: Implement on-chain verification for stake ID: ${stakeId}`);
        // Example update to active for testing:
        // await db.query("UPDATE user_stakes SET status = 'active', updated_at = NOW() WHERE stake_id = $1 AND status = 'pending_confirmation'", [stakeId]);
    }

    async verifyOnChainUnstake(stakeId) {
        // Similar to verifyOnChainStake, but for unstake transactions.
        // 1. Fetch stake with 'pending_unstake' (if you use this status) or 'active' and its onchain_unstake_tx_boc/hash.
        // 2. Query TON blockchain for the unstake transaction status.
        // 3. Verify:
        //    - Transaction was successful (call to staking contract's unstake method).
        //    - Correct amount of ARIX (principal +/- rewards/penalty) was transferred back to user.
        // 4. If verified, the finalizeUnstake might already set to 'completed'/'early_unstaked'.
        //    This job might be more about confirming the smart contract's actions rather than triggering DB state changes if finalizeUnstake is robust.
        console.log(`TODO: Implement on-chain verification for unstake of stake ID: ${stakeId}`);
    }
}

module.exports = new EarnService();
EOF
echo "   - ${BACKEND_DIR}/src/services/earnService.js updated."


# 4. Create ar_backend/contracts/staking_contract.tact
echo "   - Creating ${CONTRACTS_DIR}/staking_contract.tact"
cat << 'EOF' > "${CONTRACTS_DIR}/staking_contract.tact"
import "@stdlib/deploy";         // Standard library for deployment
import "@stdlib/ownable";        // For ownership/admin features (optional for now)
import "@stdlib/jetton";         // For TEP-74 Jetton Wallet interaction
import "@stdlib/math";           // For math utilities like min/max, power, etc.
import "@stdlib/int";            // For integer utilities

// ------------ CONTRACT CONFIGURATION ------------ //

const ARIX_DECIMALS: Int = 9; // Assuming ARIX has 9 decimals for display/calculation alignment
const SECONDS_IN_YEAR: Int = 31536000; // 365 * 24 * 60 * 60

// ------------ DATA STRUCTURES ------------ //

// Information stored for each individual stake
struct StakeInfo {
    amount_staked: Coins;        // Amount of ARIX staked
    start_time: Int as uint32;   // Unix timestamp when the stake became active
    duration_seconds: Int as uint32; // Original duration of the stake in seconds
    unlock_time: Int as uint32;  // Calculated as start_time + duration_seconds
    apr_bps: Int as uint16;      // Annual Percentage Rate in Basis Points (e.g., 5% = 500)
    penalty_bps: Int as uint16;  // Early Unstake Penalty in Basis Points (e.g., 10% = 1000)
    is_withdrawn: Bool;          // Flag to prevent double withdrawal
    original_staker: Address;    // The TON address of the user who initiated the stake
}

// Parameters sent by the user (via backend preparation) in the forward_payload
// of a jetton transfer when they initiate a stake.
struct StakeParametersFromUser {
    query_id: Int as uint64;         // Optional: query_id from the user's initial action
    duration_seconds: Int as uint32; // Duration for this specific stake
    apr_bps: Int as uint16;          // Fixed APR for this stake (in Basis Points)
    penalty_bps: Int as uint16;      // Early unstake penalty for this stake (in Basis Points)
}

// Message sent by a user directly to this StakingContract to initiate an unstake operation.
struct UserUnstakeMessage {
    query_id: Int as uint64;            // Standard TON message query_id for a response
    stake_id_to_withdraw: Int as uint64;// The ID of the stake the user wants to withdraw
}

// Notification structure this StakingContract expects from its own ARIX Jetton Wallet.
// This is triggered when the Jetton Wallet receives ARIX intended for staking.
struct JettonWalletStakeNotification {
    query_id: Int as uint64;    // Query ID from the jetton transfer
    amount: Coins;              // Amount of ARIX received by the jetton wallet
    original_staker: Address;   // Address of the user who initially sent the jettons
    forward_payload: Slice;     // The forward_payload from the user's original jetton transfer,
                                // expected to contain StakeParametersFromUser
}

// ------------ CONTRACT STORAGE ------------ //

storage StakingContract {
    owner_address: Address;                 // Deployer/admin address
    arx_jetton_master_address: Address;     // Address of the ARIX Jetton Master contract
    my_arx_jetton_wallet_address: Address;  // This contract's own ARIX Jetton Wallet address
    next_stake_id: Int as uint64;           // Global counter for unique stake IDs

    // Main storage: UserAddress -> (StakeID -> StakeInfo)
    stakes: map<Address, map<Int, StakeInfo>>;
}

// ------------ INITIALIZATION ------------ //

init(owner: Address, arx_master: Address, my_jetton_wallet: Address) {
    self.owner_address = owner;
    self.arx_jetton_master_address = arx_master;
    self.my_arx_jetton_wallet_address = my_jetton_wallet; // Must be known at deployment
    self.next_stake_id = 1; // Start stake IDs from 1
    self.stakes = emptyMap<Address, map<Int, StakeInfo>>();

    // It's crucial that 'my_jetton_wallet_address' is the address of a Jetton Wallet
    // for 'arx_jetton_master_address' and that THIS StakingContract is its owner.
}

// ------------ HELPER FUNCTIONS (MATH) ------------ //

// Calculates reward for a full term.
// Uses precise integer math by scaling: (P * APR_bps * Duration_Years_Scaled) / Scale_Factor
fun calculateFixedReward(principal: Coins, apr_bps: Int, duration_seconds: Int): Coins {
    if (principal == 0 || apr_bps == 0 || duration_seconds == 0) {
        return 0;
    }
    // Reward = (Principal * APR_bps * Duration_Seconds) / (10000 * Seconds_In_Year)
    let numerator: Int = principal * apr_bps * duration_seconds;
    let denominator: Int = 10000 * SECONDS_IN_YEAR;
    if (denominator == 0) { return 0; } // Avoid division by zero, though SECONDS_IN_YEAR is constant
    return numerator / denominator;
}

// Calculates early unstake penalty.
fun calculatePenalty(principal: Coins, penalty_bps: Int): Coins {
    if (principal == 0 || penalty_bps == 0) {
        return 0;
    }
    // Penalty = (Principal * Penalty_Bps) / 10000
    return (principal * penalty_bps) / 10000;
}


// ------------ RECEIVE FUNCTIONS (MESSAGE HANDLERS) ------------ //

// 1. Handler for STAKE Notifications from this contract's ARIX Jetton Wallet
receive(msg: JettonWalletStakeNotification) {
    require(context().sender == self.my_arx_jetton_wallet_address, "ERR:NOTIFICATION_NOT_FROM_OWN_JETTON_WALLET");

    let staker_address: Address = msg.original_staker;
    let amount_staked_by_user: Coins = msg.amount;

    let params_slice: Slice = msg.forward_payload;
    require(params_slice.remainingBits() >= (64 + 32 + 16 + 16), "ERR:INVALID_FORWARD_PAYLOAD_SIZE"); // Basic size check
    let stake_params: StakeParametersFromUser = params_slice.load(StakeParametersFromUser);

    require(amount_staked_by_user > 0, "ERR:STAKE_AMOUNT_MUST_BE_POSITIVE");
    require(stake_params.duration_seconds > 0, "ERR:DURATION_MUST_BE_POSITIVE");
    require(stake_params.apr_bps > 0, "ERR:APR_MUST_BE_POSITIVE");

    let current_time: Int = now();

    let user_stakes_map_opt: map<Int, StakeInfo>? = self.stakes.get(staker_address);
    let user_stakes_map: map<Int, StakeInfo>;
    if (user_stakes_map_opt == null) {
        user_stakes_map = emptyMap<Int, StakeInfo>();
    } else {
        user_stakes_map = user_stakes_map_opt!!;
    }

    let new_stake_id: Int = self.next_stake_id;
    self.next_stake_id += 1;

    let new_stake_record: StakeInfo = StakeInfo{
        amount_staked: amount_staked_by_user,
        start_time: current_time,
        duration_seconds: stake_params.duration_seconds,
        unlock_time: current_time + stake_params.duration_seconds,
        apr_bps: stake_params.apr_bps,
        penalty_bps: stake_params.penalty_bps,
        is_withdrawn: false,
        original_staker: staker_address
    };

    user_stakes_map.set(new_stake_id, new_stake_record);
    self.stakes.set(staker_address, user_stakes_map);
}

// 2. Handler for UNSTAKE Messages from a User
receive(msg: UserUnstakeMessage) {
    let staker_address: Address = context().sender;
    let stake_id_to_process: Int = msg.stake_id_to_withdraw;

    let user_stakes_map_opt: map<Int, StakeInfo>? = self.stakes.get(staker_address);
    require(user_stakes_map_opt != null, "ERR:USER_HAS_NO_STAKES");
    let user_stakes_map: map<Int, StakeInfo> = user_stakes_map_opt!!;

    let stake_info_opt: StakeInfo? = user_stakes_map.get(stake_id_to_process);
    require(stake_info_opt != null, "ERR:STAKE_ID_NOT_FOUND");
    let stake_info: StakeInfo = stake_info_opt!!;

    require(stake_info.original_staker == staker_address, "ERR:SENDER_NOT_STAKE_OWNER");
    require(!stake_info.is_withdrawn, "ERR:STAKE_ALREADY_WITHDRAWN");

    let current_time: Int = now();
    let principal: Coins = stake_info.amount_staked;
    let reward_to_pay: Coins = 0;
    let penalty_to_apply: Coins = 0;
    let final_amount_to_return: Coins;

    if (current_time >= stake_info.unlock_time) {
        reward_to_pay = self.calculateFixedReward(principal, stake_info.apr_bps, stake_info.duration_seconds);
        final_amount_to_return = principal + reward_to_pay;
    } else {
        penalty_to_apply = self.calculatePenalty(principal, stake_info.penalty_bps);
        final_amount_to_return = principal - penalty_to_apply;
        reward_to_pay = 0;
    }

    if (final_amount_to_return < 0) {
        final_amount_to_return = 0;
    }

    let updated_stake_info: StakeInfo = StakeInfo{
        ...stake_info,
        is_withdrawn: true
    };
    user_stakes_map.set(stake_id_to_process, updated_stake_info);
    self.stakes.set(staker_address, user_stakes_map);

    if (final_amount_to_return > 0) {
        let jetton_wallet: JettonWallet = JettonWallet.bind(self.my_arx_jetton_wallet_address);

        let response_payload_builder: StringBuilder = beginCell()
            .storeUint(msg.query_id, 64)
            .storeAddress(staker_address)
            .storeUint(stake_id_to_process, 64)
            .storeCoins(final_amount_to_return)
            .storeCoins(reward_to_pay)
            .storeCoins(penalty_to_apply);

        jetton_wallet.sendTransfer(
            staker_address,
            final_amount_to_return,
            staker_address,
            response_payload_builder.toCell(),
            ton("0.05"),
            true
        );
    } else {
        send(SendParameters{
            to: staker_address,
            value: 0,
            mode: SendPayGasSeparately + SendIgnoreErrors,
            body: beginCell()
                  .storeUint(msg.query_id, 64)
                  .storeAddress(staker_address)
                  .storeUint(stake_id_to_process, 64)
                  .storeStringTail("Unstake processed. No ARIX returned due to full penalty or zero principal after penalty.")
                  .endCell()
        });
    }
}

receive() {
    // Default receive for unhandled messages. Can be used to bounce or log.
    // For now, let it throw an error for unexpected messages.
    dump("StakingContract received an unhandled message");
    throw(132); // Standard error code for unhandled message
}

// ------------ GET METHODS (for off-chain queries) ------------ //

get fun get_stake_info(user: Address, stake_id: Int): StakeInfo? {
    let user_stakes_map: map<Int, StakeInfo>? = self.stakes.get(user);
    if (user_stakes_map == null) {
        return null;
    }
    return user_stakes_map!!.get(stake_id);
}

get fun get_user_stake_ids(user: Address): map<Int, Bool>? {
    let user_stakes_map: map<Int, StakeInfo>? = self.stakes.get(user);
    if (user_stakes_map == null) {
        return null;
    }
    let result_map: map<Int, Bool> = emptyMap<Int, Bool>();
    let stake_ids: map<Int, StakeInfo> = user_stakes_map!!; // Ensure it's not null

    // Iterate over map keys (stake_id)
    // Tact's map iteration might be different; this is conceptual.
    // A common pattern is to get keys then iterate.
    // For simplicity, assuming a way to iterate keys or entries.
    // If Tact requires getting all keys first:
    // let keys_list: List<Int> = stake_ids.keys();
    // for (id_key in keys_list) {
    //    result_map.set(id_key, stake_ids.get(id_key)!!.is_withdrawn);
    // }
    // A direct iteration if supported:
    forEach (stake_id_key: Int, stake_val: StakeInfo) in stake_ids {
        result_map.set(stake_id_key, stake_val.is_withdrawn);
    }
    return result_map;
}

get fun get_owner(): Address {
    return self.owner_address;
}

get fun get_arx_jetton_master(): Address {
    return self.arx_jetton_master_address;
}

get fun get_my_arx_jetton_wallet(): Address {
    return self.my_arx_jetton_wallet_address;
}

get fun get_next_stake_id(): Int {
    return self.next_stake_id;
}

get fun get_estimated_current_reward(user: Address, stake_id: Int): Coins {
    let stake_info_opt: StakeInfo? = self.get_stake_info(user, stake_id);
    if (stake_info_opt == null) {
        return 0;
    }
    let stake: StakeInfo = stake_info_opt!!;
    if (stake.is_withdrawn) {
        return 0;
    }

    let current_time: Int = now();
    if (current_time <= stake.start_time) {
        return 0;
    }

    let effective_elapsed_time: Int = min(current_time, stake.unlock_time) - stake.start_time;

    if (effective_elapsed_time <= 0) {
        return 0;
    }

    // Use the same reward calculation logic, but with effective_elapsed_time
    // Reward = (Principal * APR_bps * Effective_Elapsed_Time_Seconds) / (10000 * Seconds_In_Year)
    let reward_numerator: Int = stake.amount_staked * stake.apr_bps * effective_elapsed_time;
    let reward_denominator: Int = 10000 * SECONDS_IN_YEAR;
    if (reward_denominator == 0) { return 0; }
    return reward_numerator / reward_denominator;
}
EOF
echo "   - ${CONTRACTS_DIR}/staking_contract.tact created."


echo ""
echo "✅ Script finished."
echo "IMPORTANT NEXT STEPS:"
echo "1. Review ALL changes and created files carefully."
echo "2. Database: Run the updated '${BACKEND_DIR}/db_migrations/001_initial_schema.sql' against your PostgreSQL database."
echo "   This WILL DROP existing tables if they exist. Ensure you have backups if needed."
echo "3. Backend: Install dependencies (npm install) in '${BACKEND_DIR}' if you haven't already."
echo "   Ensure your .env file in '${BACKEND_DIR}/src/config/' (or wherever your envConfig.js expects it) is correctly set up with database credentials, ARIX_TOKEN_MASTER_ADDRESS, and STAKING_CONTRACT_ADDRESS (this will be the address of the deployed Tact contract)."
echo "4. Smart Contract: "
echo "   - Set up your TON development environment (Tact compiler, ton-cli, etc.)."
echo "   - Compile the '${CONTRACTS_DIR}/staking_contract.tact' file."
echo "   - Deploy the compiled smart contract to TON Testnet first. Note its address."
echo "   - Update STAKING_CONTRACT_ADDRESS in your backend's .env file with the deployed address."
echo "   - Deploy an ARIX Jetton Wallet FOR THE STAKING CONTRACT, and set the Staking Contract as its owner. The Staking Contract's 'init' function needs this Jetton Wallet's address."
echo "5. Frontend: Ensure your .env file in '${FRONTEND_DIR}' has VITE_BACKEND_API_URL, VITE_ARIX_TOKEN_MASTER_ADDRESS, and VITE_STAKING_CONTRACT_ADDRESS correctly set."
echo "6. Thoroughly test the entire staking and unstaking flow: frontend -> backend -> smart contract -> blockchain -> backend verification -> database updates -> frontend display."
echo "7. Implement the TODOs in the backend code, especially for on-chain transaction verification."

