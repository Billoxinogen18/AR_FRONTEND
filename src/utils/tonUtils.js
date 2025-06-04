
import { Address, Cell, TonClient4, beginCell, toNano as tonToNano } from "@ton/ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";




export const ARIX_DECIMALS = 9;
export const USDT_DECIMALS = 6; 
export const USD_DECIMALS = 2;  

export const MIN_USDT_WITHDRAWAL_USD_VALUE = 3;


export const TONCONNECT_MANIFEST_URL = import.meta.env.VITE_TONCONNECT_MANIFEST_URL || '/tonconnect-manifest.json';


export const TON_NETWORK = import.meta.env.VITE_TON_NETWORK || 'mainnet';


export const TON_EXPLORER_URL = TON_NETWORK === 'testnet' ? 'https://testnet.tonscan.org' : 'https://tonscan.org';


export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'arix_terminal_tma_bot';


export const REFERRAL_LINK_BASE = import.meta.env.VITE_TMA_URL || window.location.origin;


export const FALLBACK_IMAGE_URL = '/img/placeholder-image.png';
export const COINFLIP_HEADS_IMG = '/img/coin_heads.png';
export const COINFLIP_TAILS_IMG = '/img/coin_tails.png';
export const COINFLIP_SPINNING_GIF = '/img/coin_spinning.gif';
export const COINFLIP_DEFAULT_IMG = '/img/coin-default-cf.png';



let memoizedTonClient = null;

export const getTonClient = async () => {
    if (!memoizedTonClient) {
        try {
            const endpoint = await getHttpV4Endpoint({
                network: TON_NETWORK, 
            });
            memoizedTonClient = new TonClient4({ endpoint });
        } catch (error) {
            console.error("[tonUtils.js] Error initializing TonClient4:", error);
            throw error; 
        }
    }
    return memoizedTonClient;
};


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
        return 0; 
    }
    try {
        const amountBigInt = BigInt(amountInSmallestUnits);
        const divisor = BigInt(10 ** decimals);
        const integerPart = amountBigInt / divisor;
        const fractionalPart = amountBigInt % divisor;

        const fractionalString = fractionalPart.toString().padStart(decimals, '0');
        
        
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
        
        return result.stack.readAddress().toString({bounceable: true, testOnly: TON_NETWORK === 'testnet'});
    } catch (error) {
        console.error(`[tonUtils.js] Error getting Jetton wallet address for owner ${ownerAddressString} and master ${jettonMasterAddressString}:`, error.message);
        
        
        
        return null;
    }
};

export const getJettonBalance = async (jettonWalletAddressString) => {
    try {
        const client = await getTonClient();
        if (!client) throw new Error("TonClient not available in getJettonBalance");

        const jettonWalletAddress = Address.parse(jettonWalletAddressString);
        
        const contractState = await client.getContractState(jettonWalletAddress);
        if (contractState.state.type !== 'active') {
            console.warn(`[tonUtils.js] Jetton wallet ${jettonWalletAddressString} is not active (not deployed or frozen). Assuming 0 balance.`);
            return BigInt(0);
        }

        const result = await client.runMethod(jettonWalletAddress, 'get_wallet_data');
        return result.stack.readBigNumber(); 
    } catch (error) {
        
        if (error.message && (error.message.includes('exit_code: -256') || error.message.includes('Unable to query contract state'))) {
            console.warn(`[tonUtils.js] Jetton wallet ${jettonWalletAddressString} likely not initialized or found. Error: ${error.message}. Assuming 0 balance.`);
            return BigInt(0);
        }
        console.error(`[tonUtils.js] Error getting Jetton balance for ${jettonWalletAddressString}:`, error.message);
        return BigInt(0); 
    }
};

export const createJettonTransferMessage = (
    jettonAmount,
    toAddressString,
    responseAddressString,
    forwardTonAmount = tonToNano("0.05"), 
    forwardPayload = null
) => {
    const toAddress = Address.parse(toAddressString);
    const responseAddress = Address.parse(responseAddressString);

    const bodyBuilder = beginCell()
        .storeUint(0x0f8a7ea5, 32) 
        .storeUint(BigInt(Date.now()), 64) 
        .storeCoins(jettonAmount)
        .storeAddress(toAddress)
        .storeAddress(responseAddress)
        .storeBit(false); 

    bodyBuilder.storeCoins(forwardTonAmount);

    if (forwardPayload instanceof Cell) {
        bodyBuilder.storeBit(true); 
        bodyBuilder.storeRef(forwardPayload);
    } else {
        bodyBuilder.storeBit(false); 
    }
    return bodyBuilder.endCell();
};




export const createStakeForwardPayload = (params) => {
    
    
    return beginCell()
        .storeUint(0xf010c513, 32) 
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

    
    
    
    
    

    
    
    

    console.log(`[tonUtils.js] Starting transaction confirmation poll for wallet: ${walletAddressString}. This may take a few minutes.`);

    const startTime = Date.now();
    let lastLt = await client.getContractState(walletAddress).then(s => s.lastTransaction?.lt).catch(() => null);
    if (lastLt) lastLt = BigInt(lastLt);

    while (Date.now() - startTime < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        try {
            const transactions = await client.getTransactions(walletAddress, {
                limit: 10, 
                
                
                archival: true 
            });

            
            
            
            

            
            
            for (const tx of transactions) {
                
                
                
                
                
                
                

                
                
                

                
                
                

                
                
                
                if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
                    if (tx.description?.computePhase?.type === 'vm' && tx.description.computePhase.success) {
                        console.log(`[tonUtils.js] Potentially related new transaction found for ${walletAddressString}: ${tx.hash().toString('hex')}`);
                        return tx.hash().toString('hex'); 
                    }
                }
            }
            if (transactions.length > 0) {
                const currentLastLt = transactions[0].lt; 
                if (lastLt && BigInt(currentLastLt) > lastLt) {
                    
                    
                }
                lastLt = BigInt(currentLastLt);
            }

        } catch (error) {
            
            if (error.message.includes("Unable to query contract state") && Date.now() - startTime < 15000) {
                
                console.warn("[tonUtils.js] Wallet state not queryable yet, retrying...");
            } else {
                console.warn("[tonUtils.js] Error polling for transactions:", error.message);
            }
        }
    }
    console.warn(`[tonUtils.js] Transaction confirmation timed out for wallet ${walletAddressString} after sending message.`);
    return null; 
};