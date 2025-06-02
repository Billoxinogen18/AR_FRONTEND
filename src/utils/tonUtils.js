// File: ar_terminal/tma_frontend/src/utils/tonUtils.js
import { TonClient } from "@ton/ton";
import { Address, Cell, toNano, fromNano } from "@ton/core";
import { getHttpEndpoint } from "@orbs-network/ton-access";

async function getTonClient() {
  const network = "mainnet"; // HARDCODED FOR DEBUGGING (was import.meta.env.VITE_TON_NETWORK || "testnet")
  console.log("[tonUtils.js] Using HARDCODED network for TonClient:", network);
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
    const networkForAddress = import.meta.env.VITE_TON_NETWORK || "mainnet"; // Or hardcode if VITE_ var is suspect
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
    return result.stack.readBigNumber(); 
  } catch (error) {
    console.error("Error getting Jetton balance:", error);
    return BigInt(0);
  }
}

export function createJettonTransferMessage(
  jettonAmount, 
  toAddress,    
  responseAddress, 
  forwardTonAmount = toNano("0.05"), 
  forwardPayload = null 
) {
  const body = new Cell();
  body.bits.writeUint(0x0f8a7ea5, 32); 
  body.bits.writeUint(0, 64); 
  body.bits.writeCoins(jettonAmount);
  body.bits.writeAddress(Address.parse(toAddress));
  body.bits.writeAddress(Address.parse(responseAddress));
  body.bits.writeBit(0); 
  body.bits.writeCoins(forwardTonAmount); 
  if (forwardPayload instanceof Cell) { 
    body.bits.writeBit(1); 
    body.refs.push(forwardPayload);
  } else {
    body.bits.writeBit(0); 
  }
  return body;
}

export const ARIX_DECIMALS = 9;

export function toArixSmallestUnits(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return BigInt(0);
  return toNano(amount.toString());
}

export function fromArixSmallestUnits(amount) { 
  if (typeof amount !== 'bigint') return 0;
  return Number(fromNano(amount));
}