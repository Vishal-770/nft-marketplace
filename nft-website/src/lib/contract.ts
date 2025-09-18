import { createThirdwebClient, getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { contractAddress } from "@/constants";

// Create the client
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRD_WEB_CLIENT_ID!,
});

// Contract configuration
export const CONTRACT_ADDRESS = contractAddress;
export const CHAIN = sepolia;

// Create the contract object
export const contract = getContract({
  client,
  address: CONTRACT_ADDRESS,
  chain: CHAIN,
});
