// File: AR_FRONTEND/src/utils/tonUtils.js
import { TonClient, Address, Cell, toNano, fromNano, Builder } from "@ton/core";
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

    const contractState = await client.getContractState(jettonWalletAddress);
    if (contractState.state !== 'active') {
        console.warn(`[tonUtils.js] Jetton wallet ${jettonWalletAddressString} is not active. State: ${contractState.state}. Balance will likely be 0 or error.`);
    }

    const result = await client.runMethod(
      jettonWalletAddress,
      "get_wallet_data"
    );
    return result.stack.readBigNumber(); 
  } catch (error) {
    console.error(`[tonUtils.js] Error getting Jetton balance from ${jettonWalletAddressString}:`, error);
    if (error.message && error.message.includes("exit_code: -13")) {
        console.error(`[tonUtils.js] Exit code -13 for ${jettonWalletAddressString} often means the jetton wallet contract is uninitialized or not found.`);
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

export function createStakeForwardPayload({ queryId = 0n, stakeIdentifier, durationSeconds, aprBps, penaltyBps }) {
  const body = new Builder();
  body.storeUint(BigInt(queryId), 64); 
  body.storeUint(BigInt(stakeIdentifier), 64); 
  body.storeUint(durationSeconds, 32); 
  body.storeUint(aprBps, 16); 
  body.storeUint(penaltyBps, 16); 
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
  if (typeof amount === 'string' || typeof amount === 'number') { 
     try { return Number(fromNano(BigInt(amount))); } 
     catch(e) { console.error("fromNano failed for string/number:", amount, e); return 0; }
  }
  console.warn("fromArixSmallestUnits: Invalid amount type, returning 0. Amount:", amount, typeof amount);
  return 0;
}

export async function waitForTransactionConfirmation(
    sourceWalletAddressString, 
    externalMessageCell,
    pollingIntervalMs = 5000, 
    maxRetries = 24 
) {
    const client = await getTonClient();
    const sourceAddress = Address.parse(sourceWalletAddressString);
    const messageHash = externalMessageCell.hash();

    console.log(`[waitForTx] Started polling for tx from ${sourceWalletAddressString} with message hash ${messageHash.toString('hex')}`);

    for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
        console.log(`[waitForTx] Polling attempt ${i + 1}/${maxRetries}...`);
        try {
            const transactions = await client.getTransactions(sourceAddress, { limit: 10 }); 
            for (const tx of transactions) {
                if (tx.inMessage && tx.inMessage.info.type === 'external-in') {
                    if (tx.inMessage.body.hash().equals(messageHash)) {
                        console.log(`[waitForTx] Transaction found! Hash: ${tx.hash().toString('hex')}`);
                        return tx.hash().toString('hex');
                    }
                }
            }
        } catch (error) {
            console.error(`[waitForTx] Error during polling attempt ${i + 1}:`, error);
        }
    }
    console.warn(`[waitForTx] Transaction not confirmed after ${maxRetries} retries for message hash ${messageHash.toString('hex')}`);
    return null;
}