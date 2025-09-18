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
import { Loader2, DollarSign, ShoppingCart } from "lucide-react";
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

// Buy NFT Card Component
const BuyNFTCard: React.FC<{ nft: NFTWithMetadata }> = ({ nft }) => {
  const { mutate: sendTransaction } = useSendTransaction();
  const account = useActiveAccount();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(nft.metadata?.image || "");
  const [isTransacting, setIsTransacting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const handleBuyClick = () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (account.address.toLowerCase() === nft.seller.toLowerCase()) {
      toast.error("You cannot buy your own NFT");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmBuy = () => {
    setShowConfirmDialog(false);
    setIsTransacting(true);
    toast.loading("Preparing purchase...", { id: "buy-nft" });

    try {
      // Contract logic: require(msg.value >= l.priceInEther * 1 ether, "Insufficient ETH");
      // Since the contract multiplies priceInEther by 1 ether,
      // priceInEther must be stored as ether units (like 1 = 1 ETH)
      // But thirdweb might return it as wei, so we need to multiply by 1 ether
      const valueToSend = nft.priceInEther * BigInt(1e18);

      console.log("NFT Price:", nft.priceInEther.toString());
      console.log("Value to send:", valueToSend.toString());

      const transaction = prepareContractCall({
        contract,
        method: "function buyNFT(uint256 tokenId)",
        params: [nft.tokenId],
        value: valueToSend,
      });

      sendTransaction(transaction, {
        onSuccess: (receipt) => {
          console.log("✅ Purchase successful:", receipt);
          toast.success("🎉 NFT purchased successfully!", { id: "buy-nft" });
          setIsTransacting(false);
        },
        onError: (error) => {
          console.error("❌ Purchase error:", error);
          toast.error(`❌ Purchase failed: ${error.message}`, {
            id: "buy-nft",
          });
          setIsTransacting(false);
        },
      });
    } catch (error) {
      console.error("🚨 Error preparing purchase:", error);
      toast.error(
        `Failed to prepare transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: "buy-nft" }
      );
      setIsTransacting(false);
    }
  };

  const isOwner = account?.address?.toLowerCase() === nft.seller.toLowerCase();

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

        {/* For Sale Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="text-xs bg-green-500 hover:bg-green-600">
            For Sale
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

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price</span>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">
              {formatEther(nft.priceInEther)} ETH
            </span>
          </div>
        </div>

        {/* Seller */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Seller</span>
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

        {/* Buy Button */}
        <div className="pt-2">
          {isOwner ? (
            <Button className="w-full" disabled>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Your NFT
            </Button>
          ) : (
            <>
              <Button
                className="w-full"
                onClick={handleBuyClick}
                disabled={isTransacting || !account}
              >
                {isTransacting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy for {formatEther(nft.priceInEther)} ETH
                  </>
                )}
              </Button>

              {/* Confirmation Dialog */}
              <Dialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm NFT Purchase</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to purchase this NFT?
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* NFT Preview */}
                    <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                      <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden">
                        {imageSrc && !imageError ? (
                          <Image
                            src={imageSrc}
                            alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">
                            NFT
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {nft.metadata?.name || `Unnamed NFT #${nft.tokenId}`}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Token ID: #{nft.tokenId.toString()}
                        </p>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Price:
                        </span>
                        <span className="font-medium">
                          {formatEther(nft.priceInEther)} ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Seller:
                        </span>
                        <span className="font-mono text-sm">
                          {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                      ⚠️ This transaction cannot be undone. Make sure you want
                      to purchase this NFT before confirming.
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(false)}
                      disabled={isTransacting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmBuy} disabled={isTransacting}>
                      {isTransacting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Purchasing...
                        </>
                      ) : (
                        <>Confirm Purchase</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

const BuyPage = () => {
  const [nftsWithMetadata, setNftsWithMetadata] = useState<NFTWithMetadata[]>(
    []
  );
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  // Get NFTs listed for sale
  const { data: saleNFTs, isPending: isLoadingSaleNFTs } = useReadContract({
    contract,
    method:
      "function getNFTsListedForSale() view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI)[])",
    params: [],
  });

  useEffect(() => {
    const loadNFTMetadata = async () => {
      if (!saleNFTs || saleNFTs.length === 0) {
        setNftsWithMetadata([]);
        return;
      }

      setIsLoadingMetadata(true);

      try {
        // Filter NFTs with valid IPFS hashes
        const validNFTs = saleNFTs.filter((nft: NFTData) =>
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
  }, [saleNFTs]);

  if (isLoadingSaleNFTs) {
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
          <h1 className="text-3xl font-bold">Buy NFTs</h1>
          <p className="text-muted-foreground">
            Discover and purchase amazing NFTs from our marketplace
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
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No NFTs for Sale</h2>
            <p>Check back later for new listings!</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Available for Purchase ({nftsWithMetadata.length})
              </h2>
              <Badge variant="secondary">
                {nftsWithMetadata.filter((n) => n.metadata).length} with
                metadata
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nftsWithMetadata.map((nft) => (
                <BuyNFTCard key={nft.tokenId.toString()} nft={nft} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BuyPage;
