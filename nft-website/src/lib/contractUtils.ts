import { useReadContract } from "thirdweb/react";
import { contract } from "@/lib/contract";

// Hook to get single NFT details
export const useNFTDetails = (tokenId: bigint | undefined) => {
  return useReadContract({
    contract,
    method:
      "function getNFT(uint256 tokenId) view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI))",
    params: tokenId !== undefined ? [tokenId] : [BigInt(0)],
  });
};

// Hook to get NFT rental information
export const useNFTRentInfo = (tokenId: bigint | undefined) => {
  return useReadContract({
    contract,
    method:
      "function getNFTRentInfo(uint256 tokenId) view returns (address renter, uint256 rentEnd)",
    params: tokenId !== undefined ? [tokenId] : [BigInt(0)],
  });
};

// Hook to get royalty information
export const useRoyaltyInfo = (
  tokenId: bigint | undefined,
  salePrice: bigint | undefined
) => {
  return useReadContract({
    contract,
    method:
      "function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address, uint256)",
    params:
      tokenId !== undefined && salePrice !== undefined
        ? [tokenId, salePrice]
        : [BigInt(0), BigInt(0)],
  });
};

// Hook to get total minted NFTs
export const useTotalMinted = () => {
  return useReadContract({
    contract,
    method: "function getTotalMinted() view returns (uint256)",
    params: [],
  });
};

// Hook to get marketplace owner
export const useMarketplaceOwner = () => {
  return useReadContract({
    contract,
    method: "function marketplaceOwner() view returns (address)",
    params: [],
  });
};

// Hook to get platform fee percentage
export const usePlatformFee = () => {
  return useReadContract({
    contract,
    method: "function platformFeePercent() view returns (uint256)",
    params: [],
  });
};

// Hook to get pending withdrawals for an address
export const usePendingWithdrawals = (address: string | undefined) => {
  return useReadContract({
    contract,
    method: "function pendingWithdrawals(address) view returns (uint256)",
    params: address
      ? [address]
      : ["0x0000000000000000000000000000000000000000"],
  });
};

// Hook to get NFTs rented by a user
export const useNFTsRentedByUser = (userAddress: string | undefined) => {
  return useReadContract({
    contract,
    method:
      "function getNFTsRentedByUser(address user) view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI)[])",
    params: userAddress
      ? [userAddress]
      : ["0x0000000000000000000000000000000000000000"],
  });
};

// Hook to get NFT status
export const useNFTStatus = (tokenId: bigint | undefined) => {
  return useReadContract({
    contract,
    method: "function nftStatus(uint256) view returns (uint8)",
    params: tokenId !== undefined ? [tokenId] : [BigInt(0)],
  });
};

// Utility function to format NFT status
export const formatNFTStatus = (status: number): string => {
  const statusMap = {
    0: "Owned",
    1: "For Sale",
    2: "For Rent",
    3: "Rented",
  };
  return statusMap[status as keyof typeof statusMap] || "Unknown";
};

// Utility function to check if rental is expired
export const isRentalExpired = (rentEnd: bigint): boolean => {
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  return currentTime >= rentEnd;
};

// Utility function to format time remaining
export const formatTimeRemaining = (rentEnd: bigint): string => {
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  if (currentTime >= rentEnd) return "Expired";

  const remaining = Number(rentEnd - currentTime);
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Utility function to format wei with commas
export const formatWei = (wei: bigint): string => {
  const weiString = wei.toString();
  return weiString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
