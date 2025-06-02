// File: AR_FRONTEND/src/utils/tonUtils.js
import { TonClient } from "@ton/ton";
import { Address, Cell, toNano, fromNano, Builder } from "@ton/core"; // Added Builder
import { getHttpEndpoint } from "@orbs-network/ton-access";

async function getTonClient() {
  const network = import.meta.env.VITE_TON_NETWORK || "mainnet"; 
  // console.log("[tonUtils.js] Using network for TonClient:", network); // Use VITE_TON_NETWORK
  const endpoint = await getHttpEndpoint({ network: network });
  return new TonClient({ endpoint });
}

export async function getJettonWalletAddress(ownerAddress, jettonMasterAddress) {
  if (!ownerAddress || !jettonMasterAddress) {
    console.warn("getJettonWalletAddress: Missing ownerAddress or jettonMasterAddress");
    return null;
  }
  try {
    const client = await getTonClient();
    const masterAddr = Address.parse(jettonMasterAddress);
    const ownerAddr = Address.parse(ownerAddress);

    const result = await client.runMethod(
      masterAddr,
      "get_wallet_address",
      [{ type: "slice", cell: new Cell().asBuilder().storeAddress(ownerAddr).endCell() }]
    );
    const networkForAddress = import.meta.env.VITE_TON_NETWORK || "mainnet";
    return result.stack.readAddress().toString({ testOnly: networkForAddress === "testnet" });
  } catch (error) {
    console.error("Error getting Jetton wallet address:", error);
    return null; 
  }
}

export async function getJettonBalance(jettonWalletAddressString) {
  if (!jettonWalletAddressString) return BigInt(0);
  try {
    const client = await getTonClient();
    const jettonWalletAddress = Address.parse(jettonWalletAddressString);

    const result = await client.runMethod(
      jettonWalletAddress,
      "get_wallet_data"
    );
    // The balance is typically the first value in the stack for get_wallet_data
    return result.stack.readBigNumber(); 
  } catch (error) {
    console.error("Error getting Jetton balance:", error);
    return BigInt(0);
  }
}

/**
 * Creates a message body for a Jetton transfer.
 * Standard TEP-74 operation.
 * @param {bigint} jettonAmount - Amount of Jettons to transfer (in smallest units).
 * @param {string} toAddress - Destination address for the Jettons.
 * @param {string} responseAddress - Address for an optional response.
 * @param {Coins} forwardTonAmount - Amount of TON to forward with the payload (e.g., toNano('0.05')).
 * @param {Cell | null} forwardPayload - Optional payload for the destination contract.
 * @param {bigint | number} queryId - Optional query ID.
 * @returns {Cell} The message body cell.
 */
export function createJettonTransferMessage(
  jettonAmount, 
  toAddress,    
  responseAddress, 
  forwardTonAmount = toNano("0.05"), 
  forwardPayload = null,
  queryId = 0 // Can be BigInt(0) or a specific number/BigInt
) {
  const bodyBuilder = new Builder();
  bodyBuilder.storeUint(0x0f8a7ea5, 32); // op: jetton_transfer
  bodyBuilder.storeUint(BigInt(queryId), 64);    // query_id
  bodyBuilder.storeCoins(jettonAmount);       // amount
  bodyBuilder.storeAddress(Address.parse(toAddress)); // destination
  bodyBuilder.storeAddress(Address.parse(responseAddress)); // response_destination
  bodyBuilder.storeBit(0); // custom_payload (null for now, as forward_payload is preferred for TEP-74 internal_transfer logic)
  bodyBuilder.storeCoins(forwardTonAmount);   // forward_ton_amount
  
  // Store forward_payload
  if (forwardPayload instanceof Cell) { 
    bodyBuilder.storeBit(1); // has forward_payload
    bodyBuilder.storeRef(forwardPayload);
  } else {
    bodyBuilder.storeBit(0); // no forward_payload
  }
  return bodyBuilder.asCell();
}

/**
 * Creates the forward_payload cell for a stake operation based on StakeParametersFromUser struct
 * as defined in the Tact smart contract.
 * struct StakeParametersFromUser {
 * query_id: Int as uint64;
 * duration_seconds: Int as uint32;
 * apr_bps: Int as uint16;       // APR for ARIX lock terms, if applicable on SC
 * penalty_bps: Int as uint16;    // Penalty for ARIX lock terms, if applicable on SC
 * }
 */
export function createStakeForwardPayload({ queryId = 0n, durationSeconds, aprBps, penaltyBps }) {
  const body = new Builder();
  body.storeUint(BigInt(queryId), 64);      // query_id
  body.storeUint(durationSeconds, 32); // duration_seconds for the ARIX lock
  body.storeUint(aprBps, 16);          // apr_bps for the ARIX lock terms
  body.storeUint(penaltyBps, 16);      // penalty_bps for the ARIX lock terms
  return body.asCell();
}

export const ARIX_DECIMALS = 9; // Defined in your project

export function toArixSmallestUnits(amount) {
  if (typeof amount === 'string') {
    try {
      return toNano(amount);
    } catch (e) {
      console.error("Failed to convert string to smallest units (toNano):", amount, e);
      return BigInt(0);
    }
  }
  if (typeof amount === 'number' && !isNaN(amount)) {
     try {
      return toNano(amount.toString());
    } catch (e) {
      console.error("Failed to convert number to smallest units (toNano):", amount, e);
      return BigInt(0);
    }
  }
  console.warn("toArixSmallestUnits: Invalid amount type or NaN, returning BigInt(0). Amount:", amount);
  return BigInt(0);
}

export function fromArixSmallestUnits(amount) { 
  if (typeof amount === 'bigint') {
    try {
      return Number(fromNano(amount));
    } catch(e) {
      console.error("Failed to convert bigint from smallest units (fromNano):", amount, e);
      return 0;
    }
  }
  if (typeof amount === 'string') { // Handle if string representation of bigint is passed
     try {
      return Number(fromNano(BigInt(amount)));
    } catch(e) {
      console.error("Failed to convert string (as bigint) from smallest units (fromNano):", amount, e);
      return 0;
    }
  }
  console.warn("fromArixSmallestUnits: Invalid amount type, returning 0. Amount:", amount);
  return 0;
}