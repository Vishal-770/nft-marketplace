"use client";

import client from "@/app/client";
import { contractAddress } from "@/constants";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { Loader2, DollarSign, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prepareContractCall } from "thirdweb";
import { fetchNFTMetadata, isValidIPFSHash } from "../marketplace/page";
import { toast } from "sonner";

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

// Rent NFT Card Component
const RentNFTCard: React.FC<{ nft: NFTWithMetadata }> = ({ nft }) => {
  const { mutate: sendTransaction } = useSendTransaction();
  const account = useActiveAccount();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(nft.metadata?.image || "");
  const [isTransacting, setIsTransacting] = useState(false);

  // Dialog states
  const [rentDialogOpen, setRentDialogOpen] = useState(false);
  const [rentDays, setRentDays] = useState("");

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  const formatEther = (etherOrWei: bigint): string => {
    // Check if the value is likely in wei (very large number) or ether (small number)
    const num = Number(etherOrWei);
    if (num > 1000000) {
      // Likely in wei, convert to ether
      return (num / 1e18).toFixed(4);
    } else {
      // Likely already in ether
      return num.toFixed(4);
    }
  };

  const formatDuration = (hours: bigint): string => {
    const days = Number(hours) / 24;
    return days === 1 ? "1 day" : `${days} days`;
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  useEffect(() => {
    if (nft.metadata?.image) {
      setImageSrc(nft.metadata.image);
      setImageError(false);
      setImageLoading(true);
    }
  }, [nft.metadata?.image]);

  const resetRentForm = () => {
    setRentDays("");
    setRentDialogOpen(false);
  };

  const handleRentNFT = () => {
    if (!rentDays || isNaN(parseInt(rentDays)) || parseInt(rentDays) <= 0) {
      toast.error("Please enter a valid rental duration");
      return;
    }

    const days = parseInt(rentDays);
    const minDays = Number(nft.minRentDuration) / 24;
    const maxDays = Number(nft.maxRentDuration) / 24;

    if (days < minDays || days > maxDays) {
      toast.error(
        `Rental duration must be between ${minDays} and ${maxDays} days`
      );
      return;
    }

    setIsTransacting(true);
    toast.loading("Preparing rental...", { id: "rent-nft" });

    const durationInHours = BigInt(days * 24);

    // Contract logic: uint256 totalPriceInEther = (l.priceInEther * durationInHours) / 24;
    // require(msg.value >= totalPriceInEther * 1 ether, "Insufficient ETH");
    //
    // Since contract multiplies by 1 ether, priceInEther must be in ether units
    // Calculate: (priceInEther * durationInHours) / 24 * 1 ether
    const totalPriceInEther = (nft.priceInEther * durationInHours) / BigInt(24);
    const totalCostInWei = totalPriceInEther * BigInt(1e18);

    console.log("NFT Price per day:", nft.priceInEther.toString());
    console.log("Duration in hours:", durationInHours.toString());
    console.log("Total price in ether:", totalPriceInEther.toString());
    console.log("Total cost in wei:", totalCostInWei.toString());
    try {
      const transaction = prepareContractCall({
        contract,
        method: "function rentNFT(uint256 tokenId, uint256 durationInHours)",
        params: [nft.tokenId, durationInHours],
        value: totalCostInWei,
      });

      sendTransaction(transaction, {
        onSuccess: (receipt) => {
          console.log("✅ Rental successful:", receipt);
          toast.success("🎉 NFT rented successfully!", { id: "rent-nft" });
          resetRentForm();
          setIsTransacting(false);
        },
        onError: (error) => {
          console.error("❌ Rental error:", error);
          toast.error(`❌ Rental failed: ${error.message}`, { id: "rent-nft" });
          setIsTransacting(false);
        },
      });
    } catch (error) {
      console.error("🚨 Error preparing rental:", error);
      toast.error(
        `Failed to prepare transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: "rent-nft" }
      );
      setIsTransacting(false);
    }
  };

  const isOwner = account?.address?.toLowerCase() === nft.seller.toLowerCase();
  const minDays = Number(nft.minRentDuration) / 24;
  const maxDays = Number(nft.maxRentDuration) / 24;
  const totalCost = rentDays
    ? ((nft.priceInEther * BigInt(parseInt(rentDays) * 24)) / BigInt(24)) *
      BigInt(1e18) // Same calculation as transaction
    : BigInt(0);

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-200 border border-border">
      {/* Image Section */}
      <div className="relative aspect-square bg-muted/30">
        {nft.isLoadingMetadata ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : imageSrc && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <Image
              src={imageSrc}
              alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              onError={handleImageError}
              onLoad={handleImageLoad}
              unoptimized={true}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-lg bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">NFT</span>
              </div>
              <p className="text-sm">
                {imageError ? "Image Error" : "No Image"}
              </p>
            </div>
          </div>
        )}

        {/* Token ID Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs font-mono">
            #{nft.tokenId.toString()}
          </Badge>
        </div>

        {/* For Rent Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="text-xs bg-blue-500 hover:bg-blue-600">
            For Rent
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-lg leading-tight">
            {nft.metadata?.name || `Unnamed NFT #${nft.tokenId}`}
          </h3>
          {nft.metadata?.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {nft.metadata.description}
            </p>
          )}
        </div>

        {/* Rental Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price per Day</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-bold text-foreground">
                {formatEther(nft.priceInEther)} ETH
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatDuration(nft.minRentDuration)} -{" "}
                {formatDuration(nft.maxRentDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Owner</span>
          <span className="text-sm font-mono text-foreground">
            {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
          </span>
        </div>

        {/* Attributes */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Attributes</div>
            <div className="flex flex-wrap gap-1">
              {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.metadata.attributes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{nft.metadata.attributes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Rent Button */}
        <div className="pt-2">
          {isOwner ? (
            <Button className="w-full" disabled>
              <Calendar className="mr-2 h-4 w-4" />
              Your NFT
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => setRentDialogOpen(true)}
              disabled={isTransacting || !account}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Rent NFT
            </Button>
          )}
        </div>
      </div>

      {/* Rent Dialog */}
      <Dialog open={rentDialogOpen} onOpenChange={setRentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rent NFT</DialogTitle>
            <DialogDescription>
              Choose how many days you want to rent this NFT. Duration must be
              between {minDays} and {maxDays} days.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rentDays" className="text-right">
                Days
              </Label>
              <Input
                id="rentDays"
                type="number"
                min={minDays}
                max={maxDays}
                placeholder={`${minDays}`}
                value={rentDays}
                onChange={(e) => setRentDays(e.target.value)}
                className="col-span-3"
                disabled={isTransacting}
              />
            </div>
            {rentDays && !isNaN(parseInt(rentDays)) && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Cost:
                  </span>
                  <span className="font-semibold">
                    {formatEther(totalCost)} ETH
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {rentDays} days × {formatEther(nft.priceInEther)} ETH/day
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetRentForm}
              disabled={isTransacting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRentNFT}
              disabled={isTransacting || !rentDays}
            >
              {isTransacting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renting...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Rent for {formatEther(totalCost)} ETH
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const RentPage = () => {
  const [nftsWithMetadata, setNftsWithMetadata] = useState<NFTWithMetadata[]>(
    []
  );
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  // Get NFTs listed for rent
  const { data: rentNFTs, isPending: isLoadingRentNFTs } = useReadContract({
    contract,
    method:
      "function getNFTsListedForRent() view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI)[])",
    params: [],
  });

  useEffect(() => {
    const loadNFTMetadata = async () => {
      if (!rentNFTs || rentNFTs.length === 0) {
        setNftsWithMetadata([]);
        return;
      }

      setIsLoadingMetadata(true);

      try {
        // Filter NFTs with valid IPFS hashes
        const validNFTs = rentNFTs.filter((nft: NFTData) =>
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
  }, [rentNFTs]);

  if (isLoadingRentNFTs) {
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
          <h1 className="text-3xl font-bold">Rent NFTs</h1>
          <p className="text-muted-foreground">
            Rent amazing NFTs for short-term use from our marketplace
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
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No NFTs for Rent</h2>
            <p>Check back later for new rental listings!</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Available for Rent ({nftsWithMetadata.length})
              </h2>
              <Badge variant="secondary">
                {nftsWithMetadata.filter((n) => n.metadata).length} with
                metadata
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nftsWithMetadata.map((nft) => (
                <RentNFTCard key={nft.tokenId.toString()} nft={nft} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RentPage;
