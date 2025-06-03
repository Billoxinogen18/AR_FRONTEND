import { Address, Cell, contractAbi, TonClient4, Slice, beginCell, exoticPrerequisites, exoticMerkleProof, exoticMerkleUpdate, exoticHashUpdate, exoticStore, exoticLoad } from "@ton/ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { Sha256 } from '@ton/crypto'; // For hashing if needed, e.g. for waitForTransactionConfirmation

export const ARIX_DECIMALS = 9; // Standard for many Jettons

let memoizedTonClient = null;

export const getTonClient = async () => {
  if (!memoizedTonClient) {
    try {
      const endpoint = await getHttpV4Endpoint({
        network: import.meta.env.VITE_TON_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
      });
      memoizedTonClient = new TonClient4({ endpoint });
    } catch (error) {
      console.error("[tonUtils.js] Error initializing TonClient4:", error);
      // Fallback or re-throw, depending on how critical this is for app startup
      // For now, we'll let it throw so the issue is visible
      throw error;
    }
  }
  return memoizedTonClient;
};

export const toArixSmallestUnits = (amount) => {
  if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
    return BigInt(0);
  }
  // Multiply by 10^ARIX_DECIMALS
  // Use string manipulation for precision with decimals
  const [integerPart, decimalPart = ''] = String(amount).split('.');
  const paddedDecimalPart = decimalPart.padEnd(ARIX_DECIMALS, '0').slice(0, ARIX_DECIMALS);
  return BigInt(integerPart + paddedDecimalPart);
};

export const fromArixSmallestUnits = (amountInSmallestUnits) => {
  if (amountInSmallestUnits === null || amountInSmallestUnits === undefined) {
    return 0;
  }
  const amountBigInt = BigInt(amountInSmallestUnits);
  const divisor = BigInt(10 ** ARIX_DECIMALS);
  const integerPart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;

  // Format as a string with correct decimal places
  const fractionalString = fractionalPart.toString().padStart(ARIX_DECIMALS, '0');
  return parseFloat(`${integerPart}.${fractionalString}`);
};


export const getJettonWalletAddress = async (ownerAddressString, jettonMasterAddressString) => {
  try {
    const client = await getTonClient();
    if (!client) throw new Error("TonClient not available");

    const ownerAddress = Address.parse(ownerAddressString);
    const jettonMasterAddress = Address.parse(jettonMasterAddressString);

    const result = await client.runMethod(
      jettonMasterAddress,
      'get_wallet_address',
      [{ type: 'slice', cell: beginCell().storeAddress(ownerAddress).endCell() }]
    );
    return result.stack.readAddress().toString();
  } catch (error) {
    console.error(`[tonUtils.js] Error getting Jetton wallet address for owner ${ownerAddressString} and master ${jettonMasterAddressString}:`, error);
    return null;
  }
};

export const getJettonBalance = async (jettonWalletAddressString) => {
  try {
    const client = await getTonClient();
    if (!client) throw new Error("TonClient not available");

    const jettonWalletAddress = Address.parse(jettonWalletAddressString);
    const result = await client.runMethod(jettonWalletAddress, 'get_wallet_data');
    // Stack items for get_wallet_data: balance, owner_address, jetton_master_address, jetton_wallet_code
    return result.stack.readBigNumber(); // This is the jetton balance
  } catch (error) {
    console.error(`[tonUtils.js] Error getting Jetton balance for ${jettonWalletAddressString}:`, error);
    return BigInt(0);
  }
};

// Creates the body for a jetton transfer
export const createJettonTransferMessage = (
  jettonAmount, // BigInt: amount of jettons to transfer in smallest units
  toAddressString, // string: recipient user's wallet address (not their jetton wallet)
  responseAddressString, // string: address to send response to (usually sender's address)
  forwardTonAmount, // BigInt: amount of TONs to attach for processing the forwarded message by recipient's jetton wallet
  forwardPayload // Cell: optional payload to be sent to the recipient
) => {
  const toAddress = Address.parse(toAddressString);
  const responseAddress = Address.parse(responseAddressString);

  return beginCell()
    .storeUint(0x0f8a7ea5, 32) // op_code for jetton transfer
    .storeUint(0, 64) // query_id
    .storeCoins(jettonAmount)
    .storeAddress(toAddress)
    .storeAddress(responseAddress)
    .storeBit(false) // custom_payload (not used here, forward_payload is different)
    .storeCoins(forwardTonAmount)
    .storeBit(true) // forward_payload in this slice, not separate cell
    .storeRef(forwardPayload) // Storing the forward payload as a reference
    .endCell();
};

// For Staking: create_stake_forward_payload#f010c513 query_id:uint64 stake_identifier:uint64 duration_seconds:uint32 arix_lock_apr_bps:uint16 arix_lock_penalty_bps:uint16 = ForwardPayload;
export const createStakeForwardPayload = (params) => {
    // params: { queryId: BigInt, stakeIdentifier: BigInt, durationSeconds: number, arix_lock_apr_bps: number, arix_lock_penalty_bps: number }
    return beginCell()
        .storeUint(0xf010c513, 32) // op_code for create_stake_forward_payload
        .storeUint(params.queryId, 64)
        .storeUint(params.stakeIdentifier, 64)
        .storeUint(params.durationSeconds, 32)
        .storeUint(params.arix_lock_apr_bps, 16)
        .storeUint(params.arix_lock_penalty_bps, 16)
        .endCell();
};


// Basic transaction confirmation waiter.
// This is a simplified version. For robust production use, you might need a more sophisticated approach.
export const waitForTransactionConfirmation = async (walletAddressString, externalMessageCell, timeoutMs = 120000, intervalMs = 3000) => {
    const client = await getTonClient();
    if (!client) throw new Error("TonClient not available for tx confirmation");

    const walletAddress = Address.parse(walletAddressString);
    const messageHash = externalMessageCell.hash().toString('hex'); // Use Cell's hash

    console.log(`[tonUtils.js] Waiting for transaction confirmation for message hash: ${messageHash}`);

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            const transactions = await client.getTransactions(walletAddress, { limit: 5 }); // Fetch recent transactions
            for (const tx of transactions) {
                if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
                    // For external messages, the hash of the sent message body might not directly match
                    // a field in the transaction object easily.
                    // A common way is to check if a transaction appears AFTER you sent yours
                    // and then verify its specifics, or rely on backend confirmation via webhooks.

                    // A simple check (might not be robust enough):
                    // If the external message led to an internal message with the same hash (less common for jetton ops)
                    // Or, more practically, if the backend can confirm via a unique ID (like query_id) embedded in the payload.
                    // For now, we'll assume that if *any* new transaction appears for the user after sending,
                    // we take its hash. This is NOT ideal for production.
                    // A better client-side approach would involve parsing the transaction's outMessages
                    // to see if one corresponds to an expected operation, e.g., a JettonNotify.

                    // Let's assume for now a backend will confirm and this is a placeholder.
                    // If your contract sends a response message to the `responseAddress` you specified in transfer,
                    // you could look for that specific message.

                    // For this simplified example, if a new transaction appears, we'll return its hash.
                    // This is highly dependent on your specific contract logic and how you track tx.
                    console.log(`[tonUtils.js] Found new transaction for ${walletAddressString}: ${tx.hash().toString('hex')}`);
                    // THIS IS A VERY SIMPLIFIED CONFIRMATION.
                    // Ideally, you match based on query_id or specific out_msgs.
                    return tx.hash().toString('hex');
                }
                 // Check internal messages if the external message caused an internal one that can be identified
                if (tx.inMessage && tx.inMessage.info.type === 'internal') {
                    // A common pattern for jetton transfers is that the user's jetton wallet
                    // receives an internal message. The body of this internal message (if it's a Jetton transfer notification)
                    // might contain the original query_id. This is more robust.
                    // For now, this is a placeholder.
                }
            }
        } catch (error) {
            console.warn("[tonUtils.js] Error polling for transactions:", error.message);
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    console.warn(`[tonUtils.js] Transaction confirmation timed out for message hash: ${messageHash}`);
    return null; // Timeout
};