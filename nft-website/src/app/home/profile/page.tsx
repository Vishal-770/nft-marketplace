"use client";

import client from "@/app/client";
import { contractAddress } from "@/constants";
import React, { useState, useEffect, useMemo } from "react";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  fetchNFTMetadata,
  isValidIPFSHash,
  NFTCard,
} from "../marketplace/page";

interface NFTData {
  tokenId: bigint;
  seller: string;
  priceInEther: bigint;
  forRent: boolean;
  minRentDuration: bigint;
  maxRentDuration: bigint;
  rentEnd: bigint;
  renter: string;
  active: boolean;
  tokenURI: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

interface NFTWithMetadata extends NFTData {
  metadata?: NFTMetadata | null;
  isLoadingMetadata?: boolean;
}

const ProfilePage = () => {
  const account = useActiveAccount();
  const [nftsWithMetadata, setNftsWithMetadata] = useState<NFTWithMetadata[]>(
    []
  );
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  // Get all NFTs from the marketplace
  const { data: allNFTs, isPending: isLoadingAllNFTs } = useReadContract({
    contract,
    method:
      "function getAllNFTs() view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI)[])",
    params: [],
  });

  // Use account address to fetch only owned NFT token IDs
  const ownedTokenIdsQuery = useReadContract({
    contract,
    method: "function getNFTsOwned(address user) view returns (uint256[])",
    params: account?.address
      ? [account.address]
      : ["0x0000000000000000000000000000000000000000"],
  });

  const ownedTokenIds = useMemo(() => {
    return account?.address ? ownedTokenIdsQuery.data : [];
  }, [account?.address, ownedTokenIdsQuery.data]);

  const isLoadingTokenIds = account?.address
    ? ownedTokenIdsQuery.isPending
    : false;

  const isPending = isLoadingAllNFTs || isLoadingTokenIds;

  useEffect(() => {
    const loadNFTMetadata = async () => {
      if (!ownedTokenIds || ownedTokenIds.length === 0 || !allNFTs) {
        setNftsWithMetadata([]);
        return;
      }

      setIsLoadingMetadata(true);

      try {
        // Filter allNFTs to get only the ones owned by the user
        const userNFTs = allNFTs.filter((nft: NFTData) =>
          ownedTokenIds.some((tokenId: bigint) => tokenId === nft.tokenId)
        );

        // Filter NFTs with valid IPFS hashes
        const validNFTs = userNFTs.filter((nft: NFTData) =>
          isValidIPFSHash(nft.tokenURI)
        );

        // Start with placeholders
        setNftsWithMetadata(
          validNFTs.map((nft: NFTData) => ({ ...nft, isLoadingMetadata: true }))
        );

        // Fetch metadata for each
        const promises = validNFTs.map(async (nft: NFTData) => {
          const metadata = await fetchNFTMetadata(nft.tokenURI);
          return { ...nft, metadata, isLoadingMetadata: false };
        });

        const results = await Promise.all(promises);
        setNftsWithMetadata(results);
      } catch (error) {
        console.error("Error loading NFT metadata:", error);
        setNftsWithMetadata([]);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadNFTMetadata();
  }, [ownedTokenIds, allNFTs]);

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        ⚠️ Please connect your wallet
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-bold">My NFTs</h1>
          <p className="text-muted-foreground">
            Connected: <span className="font-mono">{account.address}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoadingMetadata ? (
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading NFT metadata...</p>
          </div>
        ) : nftsWithMetadata.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            You don’t own any NFTs yet.
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Owned ({nftsWithMetadata.length})
              </h2>
              <Badge variant="secondary">
                {nftsWithMetadata.filter((n) => n.metadata).length} with
                metadata
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nftsWithMetadata.map((nft) => (
                <NFTCard key={nft.tokenId.toString()} nft={nft} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
