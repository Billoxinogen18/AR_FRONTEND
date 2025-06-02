// File: AR_FRONTEND/src/utils/tonUtils.js
import { TonClient } from "@ton/ton";
import { Address, Cell, toNano, fromNano, Builder } from "@ton/core";
import { getHttpEndpoint } from "@orbs-network/ton-access";

async function getTonClient() {
  const network = import.meta.env.VITE_TON_NETWORK || "mainnet"; 
  const endpoint = await getHttpEndpoint({ network: network });
  return new TonClient({ endpoint });
}

export async function getJettonWalletAddress(ownerAddress, jettonMasterAddress) {
  if (!ownerAddress || !jettonMasterAddress) {
    console.warn("[tonUtils.js] getJettonWalletAddress: Missing ownerAddress or jettonMasterAddress");
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
    console.error(`[tonUtils.js] Error getting Jetton wallet address for owner ${ownerAddress} and master ${jettonMasterAddress}:`, error);
    return null; 
  }
}

export async function getJettonBalance(jettonWalletAddressString) {
  if (!jettonWalletAddressString) {
    console.warn("[tonUtils.js] getJettonBalance: jettonWalletAddressString is null or undefined.");
    return BigInt(0);
  }
  try {
    const client = await getTonClient();
    const jettonWalletAddress = Address.parse(jettonWalletAddressString);

    // Check if the contract is active, helpful for diagnosing -13 errors
    const contractState = await client.getContractState(jettonWalletAddress);
    if (contractState.state !== 'active') {
        console.warn(`[tonUtils.js] Jetton wallet ${jettonWalletAddressString} is not active. State: ${contractState.state}. Balance will likely be 0 or error.`);
        // Depending on the case, you might still try get_wallet_data or return 0
    }

    const result = await client.runMethod(
      jettonWalletAddress,
      "get_wallet_data"
    );
    return result.stack.readBigNumber(); 
  } catch (error) {
    console.error(`[tonUtils.js] Error getting Jetton balance from ${jettonWalletAddressString}:`, error);
    if (error.message && error.message.includes("exit_code: -13")) {
        console.error(`[tonUtils.js] Exit code -13 for ${jettonWalletAddressString} often means the jetton wallet contract is uninitialized for this user or not found on the current network (${import.meta.env.VITE_TON_NETWORK}).`);
    }
    return BigInt(0);
  }
}

export function createJettonTransferMessage(
  jettonAmount, toAddress, responseAddress, 
  forwardTonAmount = toNano("0.05"), forwardPayload = null, queryId = 0
) {
  const bodyBuilder = new Builder();
  bodyBuilder.storeUint(0x0f8a7ea5, 32); 
  bodyBuilder.storeUint(BigInt(queryId), 64);    
  bodyBuilder.storeCoins(jettonAmount);       
  bodyBuilder.storeAddress(Address.parse(toAddress)); 
  bodyBuilder.storeAddress(Address.parse(responseAddress)); 
  bodyBuilder.storeBit(0); 
  bodyBuilder.storeCoins(forwardTonAmount);   
  if (forwardPayload instanceof Cell) { 
    bodyBuilder.storeBit(1); bodyBuilder.storeRef(forwardPayload);
  } else { bodyBuilder.storeBit(0); }
  return bodyBuilder.asCell();
}

export function createStakeForwardPayload({ queryId = 0n, durationSeconds, aprBps, penaltyBps }) {
  const body = new Builder();
  body.storeUint(BigInt(queryId), 64); body.storeUint(durationSeconds, 32); 
  body.storeUint(aprBps, 16); body.storeUint(penaltyBps, 16); 
  return body.asCell();
}

export const ARIX_DECIMALS = 9;

export function toArixSmallestUnits(amount) {
  if (typeof amount === 'string') {
    try { return toNano(amount); } 
    catch (e) { console.error("toNano failed for string:", amount, e); return BigInt(0); }
  }
  if (typeof amount === 'number' && !isNaN(amount)) {
     try { return toNano(amount.toString()); } 
     catch (e) { console.error("toNano failed for number:", amount, e); return BigInt(0); }
  }
  console.warn("toArixSmallestUnits: Invalid amount, returning 0. Amount:", amount);
  return BigInt(0);
}

export function fromArixSmallestUnits(amount) { 
  if (typeof amount === 'bigint') {
    try { return Number(fromNano(amount)); } 
    catch(e) { console.error("fromNano failed for bigint:", amount, e); return 0; }
  }
  if (typeof amount === 'string') {
     try { return Number(fromNano(BigInt(amount))); } 
     catch(e) { console.error("fromNano failed for string:", amount, e); return 0; }
  }
  console.warn("fromArixSmallestUnits: Invalid amount type, returning 0. Amount:", amount);
  return 0;
}
