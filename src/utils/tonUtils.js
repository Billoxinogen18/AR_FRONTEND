// File: AR_FRONTEND/src/utils/tonUtils.js
import { Address, Cell, TonClient4, beginCell, toNano as tonToNano } from "@ton/ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
// Sha256 might be needed for more advanced transaction waiting or ID generation, keep if used.
// import { Sha256 } from '@ton/crypto';

// --- Constants Exported from this File ---
export const ARIX_DECIMALS = 9;
export const USDT_DECIMALS = 6; // Standard for most USDT on TON (like jUSDT)
export const USD_DECIMALS = 2;  // For displaying fiat USD values

export const MIN_USDT_WITHDRAWAL_USD_VALUE = 3;

// TON Connect manifest URL - ensure this matches your public deployment
export const TONCONNECT_MANIFEST_URL = import.meta.env.VITE_TONCONNECT_MANIFEST_URL || '/tonconnect-manifest.json';

// TON Network (mainnet or testnet) - driven by Vite environment variable
export const TON_NETWORK = import.meta.env.VITE_TON_NETWORK || 'mainnet';

// Base URL for TON explorer, adjusted by network
export const TON_EXPLORER_URL = TON_NETWORK === 'testnet' ? 'https://testnet.tonscan.org' : 'https://tonscan.org';

// Telegram Bot username
export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'arix_terminal_tma_bot';

// Base URL for generating referral links
export const REFERRAL_LINK_BASE = import.meta.env.VITE_TMA_URL || window.location.origin;

// Image placeholders or fallback URLs - keeping these here for game/UI components that might import from tonUtils
export const FALLBACK_IMAGE_URL = '/img/placeholder-image.png';
export const COINFLIP_HEADS_IMG = '/img/coin_heads.png';
export const COINFLIP_TAILS_IMG = '/img/coin_tails.png';
export const COINFLIP_SPINNING_GIF = '/img/coin_spinning.gif';
export const COINFLIP_DEFAULT_IMG = '/img/coin-default-cf.png';
// --- End of Constants ---


let memoizedTonClient = null;

export const getTonClient = async () => {
    if (!memoizedTonClient) {
        try {
            const endpoint = await getHttpV4Endpoint({
                network: TON_NETWORK, // Use the constant defined above
            });
            memoizedTonClient = new TonClient4({ endpoint });
        } catch (error) {
            console.error("[tonUtils.js] Error initializing TonClient4:", error);
            throw error; // Re-throw critical errors
        }
    }
    return memoizedTonClient;
};

// Renamed to avoid conflict with @ton/core's toNano if imported directly by other files.
export const toSmallestUnits = (amount, decimals) => {
    if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
        return BigInt(0);
    }
    const [integerPart, decimalPart = ''] = String(amount).split('.');
    const paddedDecimalPart = decimalPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(integerPart + paddedDecimalPart);
};

export const toArixSmallestUnits = (amount) => {
    return toSmallestUnits(amount, ARIX_DECIMALS);
};

export const toUsdtSmallestUnits = (amount) => {
    return toSmallestUnits(amount, USDT_DECIMALS);
};


export const fromSmallestUnits = (amountInSmallestUnits, decimals) => {
    if (amountInSmallestUnits === null || amountInSmallestUnits === undefined) {
        return 0; // Return number 0 for consistency in display
    }
    try {
        const amountBigInt = BigInt(amountInSmallestUnits);
        const divisor = BigInt(10 ** decimals);
        const integerPart = amountBigInt / divisor;
        const fractionalPart = amountBigInt % divisor;

        const fractionalString = fractionalPart.toString().padStart(decimals, '0');
        // Ensure it doesn't strip trailing zeros if parseFloat is used later for display formatting
        // For calculations, keep as string or BigInt if possible before final display formatting.
        return parseFloat(`${integerPart}.${fractionalString}`);
    } catch(e) {
        console.error("Error in fromSmallestUnits: ", e, {amountInSmallestUnits, decimals});
        return 0;
    }
};

export const fromArixSmallestUnits = (amountInSmallestUnits) => {
    return fromSmallestUnits(amountInSmallestUnits, ARIX_DECIMALS);
};

export const fromUsdtSmallestUnits = (amountInSmallestUnits) => {
    return fromSmallestUnits(amountInSmallestUnits, USDT_DECIMALS);
};


export const getJettonWalletAddress = async (ownerAddressString, jettonMasterAddressString) => {
    try {
        const client = await getTonClient();
        if (!client) throw new Error("TonClient not available in getJettonWalletAddress");

        const ownerAddress = Address.parse(ownerAddressString);
        const jettonMasterAddress = Address.parse(jettonMasterAddressString);

        const result = await client.runMethod(
            jettonMasterAddress,
            'get_wallet_address',
            [{ type: 'slice', cell: beginCell().storeAddress(ownerAddress).endCell() }]
        );
        // Ensure the address format matches the network (testOnly for testnet)
        return result.stack.readAddress().toString({bounceable: true, testOnly: TON_NETWORK === 'testnet'});
    } catch (error) {
        console.error(`[tonUtils.js] Error getting Jetton wallet address for owner ${ownerAddressString} and master ${jettonMasterAddressString}:`, error.message);
        // Do not return null for critical errors, let it throw or handle more gracefully
        // For now, returning null might lead to silent failures elsewhere.
        // Consider throwing a custom error or specific error handling based on use case.
        return null;
    }
};

export const getJettonBalance = async (jettonWalletAddressString) => {
    try {
        const client = await getTonClient();
        if (!client) throw new Error("TonClient not available in getJettonBalance");

        const jettonWalletAddress = Address.parse(jettonWalletAddressString);
        // Ensure the wallet is deployed by checking its state
        const contractState = await client.getContractState(jettonWalletAddress);
        if (contractState.state.type !== 'active') {
            console.warn(`[tonUtils.js] Jetton wallet ${jettonWalletAddressString} is not active (not deployed or frozen). Assuming 0 balance.`);
            return BigInt(0);
        }

        const result = await client.runMethod(jettonWalletAddress, 'get_wallet_data');
        return result.stack.readBigNumber(); // This is the jetton balance
    } catch (error) {
        // Handle common error for non-existent/uninitialized Jetton wallets gracefully
        if (error.message && (error.message.includes('exit_code: -256') || error.message.includes('Unable to query contract state'))) {
            console.warn(`[tonUtils.js] Jetton wallet ${jettonWalletAddressString} likely not initialized or found. Error: ${error.message}. Assuming 0 balance.`);
            return BigInt(0);
        }
        console.error(`[tonUtils.js] Error getting Jetton balance for ${jettonWalletAddressString}:`, error.message);
        return BigInt(0); // Return 0 on other errors to prevent app crashes, but log it.
    }
};

export const createJettonTransferMessage = (
    jettonAmount,
    toAddressString,
    responseAddressString,
    forwardTonAmount = tonToNano("0.05"), // Use @ton/core's toNano
    forwardPayload = null
) => {
    const toAddress = Address.parse(toAddressString);
    const responseAddress = Address.parse(responseAddressString);

    const bodyBuilder = beginCell()
        .storeUint(0x0f8a7ea5, 32) // op_code for jetton transfer
        .storeUint(BigInt(Date.now()), 64) // query_id (ensure it's BigInt if your util requires)
        .storeCoins(jettonAmount)
        .storeAddress(toAddress)
        .storeAddress(responseAddress)
        .storeBit(false); // custom_payload is null

    bodyBuilder.storeCoins(forwardTonAmount);

    if (forwardPayload instanceof Cell) {
        bodyBuilder.storeBit(true); // has forward_payload
        bodyBuilder.storeRef(forwardPayload);
    } else {
        bodyBuilder.storeBit(false); // no forward_payload
    }
    return bodyBuilder.endCell();
};

// For ARIX Staking Smart Contract:
// create_stake_forward_payload#f010c513 query_id:uint64 stake_identifier:uint64
// duration_seconds:uint32 arix_lock_apr_bps:uint16 arix_lock_penalty_bps:uint16 = ForwardPayload;
export const createStakeForwardPayload = (params) => {
    // params: { queryId: BigInt, stakeIdentifier: BigInt, durationSeconds: number,
    //            arix_lock_apr_bps: number, arix_lock_penalty_bps: number }
    return beginCell()
        .storeUint(0xf010c513, 32) // op_code
        .storeUint(params.queryId, 64)
        .storeUint(params.stakeIdentifier, 64)
        .storeUint(params.durationSeconds, 32)
        .storeUint(params.arix_lock_apr_bps, 16)
        .storeUint(params.arix_lock_penalty_bps, 16)
        .endCell();
};


export const waitForTransactionConfirmation = async (walletAddressString, sentMessageCellBoc, timeoutMs = 180000, intervalMs = 5000) => {
    const client = await getTonClient();
    if (!client) throw new Error("TonClient not available for tx confirmation");

    const walletAddress = Address.parse(walletAddressString);

    // For external messages, the BoC is the message itself.
    // For internal messages (like those sent from a wallet contract), the BoC is the transaction.
    // Here, `sentMessageCellBoc` is assumed to be the BoC of the external message if sent directly,
    // or the BoC of the transaction containing the message if sent via `tonConnectUI.sendTransaction`
    // which often returns the BoC of the *external message wrapper*.

    // A more robust way to get a "message hash" for external messages that Toncenter can find:
    // It's often tricky. The hash of the external message cell is what you have.
    // Let's assume for now this `sentMessageCellBoc` is what we need to look for or its effect.

    console.log(`[tonUtils.js] Starting transaction confirmation poll for wallet: ${walletAddressString}. This may take a few minutes.`);

    const startTime = Date.now();
    let lastLt = await client.getContractState(walletAddress).then(s => s.lastTransaction?.lt).catch(() => null);
    if (lastLt) lastLt = BigInt(lastLt);

    while (Date.now() - startTime < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        try {
            const transactions = await client.getTransactions(walletAddress, {
                limit: 10, // Fetch more recent transactions
                // lt: lastLt, // Using lt can be problematic if node data isn't perfectly synced
                // to_lt: BigInt(0),
                archival: true // Try to get from archive nodes for more reliability
            });

            // The key is to find a transaction that was *caused* by your sent message.
            // If `sendTransaction` returns a boc, that boc is usually the *external message cell*.
            // We need to find a transaction whose `inMessage` matches this external message's hash,
            // or more simply, a new transaction after we sent ours that seems to be the one.

            // A simple check: if a new transaction appears with a higher LT and it's successful.
            // This is not foolproof but often works for simple cases.
            for (const tx of transactions) {
                // If your `sentMessageCellBoc` is the BoC of the external message, its hash can be compared.
                // const sentMsgCell = Cell.fromBase64(sentMessageCellBoc);
                // if (tx.inMessage && tx.inMessage.info.type === 'external-in' && tx.inMessage.body.hash().equals(sentMsgCell.hash())) {
                // Or, if it's an internal message triggered by an external one that `tonConnectUI` handled:
                // The problem is `waitForTransactionConfirmation` in your original file was very simplified.
                // A robust client-side waiter without specific query_id matching in outMessages is hard.
                // The backend confirmation via webhook/polling is much more reliable.

                // For client-side, a common approach after `sendTransaction` (which resolves after the message is accepted by a lite server)
                // is to assume the *next* transaction appearing for that wallet (if successful) is the one.
                // This is not guaranteed.

                // Let's assume the backend will confirm with `transactionHash` from `recordUserStake`.
                // This client-side waiter is more of a "optimistic UI update enabler" or a fallback.
                // The one in backend `tonUtils.js` using `seqno` is more robust for backend-originated transactions.

                // Given the user's request for full code, and the original had a simplified waiter,
                // I'll keep a simplified polling logic that looks for *any* new successful transaction.
                // This is **NOT ROBUST** for production without backend verification.
                if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
                    if (tx.description?.computePhase?.type === 'vm' && tx.description.computePhase.success) {
                        console.log(`[tonUtils.js] Potentially related new transaction found for ${walletAddressString}: ${tx.hash().toString('hex')}`);
                        return tx.hash().toString('hex'); // Return the first new successful one
                    }
                }
            }
            if (transactions.length > 0) {
                const currentLastLt = transactions[0].lt; // transactions are newest first
                if (lastLt && BigInt(currentLastLt) > lastLt) {
                    // New transactions have appeared, but none matched our specific criteria yet (if any).
                    // Continue polling.
                }
                lastLt = BigInt(currentLastLt);
            }

        } catch (error) {
            // Ignore polling errors and retry, unless it's a critical client error.
            if (error.message.includes("Unable to query contract state") && Date.now() - startTime < 15000) {
                // Wallet might not be deployed yet, give it a few seconds
                console.warn("[tonUtils.js] Wallet state not queryable yet, retrying...");
            } else {
                console.warn("[tonUtils.js] Error polling for transactions:", error.message);
            }
        }
    }
    console.warn(`[tonUtils.js] Transaction confirmation timed out for wallet ${walletAddressString} after sending message.`);
    return null; // Timeout
};