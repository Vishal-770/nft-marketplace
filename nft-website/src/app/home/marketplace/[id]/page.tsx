"use client";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, DollarSign, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActiveAccount } from "thirdweb/react";
import { TransactionButton } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { contract } from "@/lib/contract";
import {
  useNFTDetails,
  useRoyaltyInfo,
  formatWei,
  isRentalExpired,
  formatTimeRemaining,
} from "@/lib/contractUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export default function NFTDetail() {
  const params = useParams();
  const account = useActiveAccount();
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);

  const tokenId = params.id ? BigInt(params.id as string) : undefined;

  // Get NFT details from contract
  const { data: nftData, isPending: isLoadingNFT } = useNFTDetails(tokenId);

  // Get royalty information
  const { data: royaltyData } = useRoyaltyInfo(
    tokenId,
    nftData?.priceInEther || BigInt(0)
  );

  // Load metadata from IPFS
  useEffect(() => {
    const loadMetadata = async () => {
      if (!nftData?.tokenURI) return;

      try {
        // Handle IPFS URLs
        let metadataUrl = nftData.tokenURI;
        if (nftData.tokenURI.startsWith("ipfs://")) {
          metadataUrl = nftData.tokenURI.replace(
            "ipfs://",
            "https://gateway.pinata.cloud/ipfs/"
          );
        }

        const response = await fetch(metadataUrl);
        const metadata = await response.json();
        setMetadata(metadata);
      } catch (error) {
        console.error("Error loading metadata:", error);
        setMetadata({
          name: `NFT #${tokenId}`,
          description: "NFT from the marketplace",
          image: "/nftsample.png",
        });
      }
    };

    loadMetadata();
  }, [nftData?.tokenURI, tokenId]);

  if (isLoadingNFT || !nftData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading NFT details...</p>
        </div>
      </div>
    );
  }

  const isOwner =
    account?.address?.toLowerCase() === nftData.seller?.toLowerCase();
  const isRented =
    nftData.renter !== "0x0000000000000000000000000000000000000000";
  const isExpired =
    isRented && nftData.rentEnd > BigInt(0) && isRentalExpired(nftData.rentEnd);

  return (
    <div className="min-h-screen bg-background mb-15">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <Link href="/home/marketplace">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">NFT Details</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* NFT Image and Basic Info */}
        <Card>
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="relative aspect-square">
                <Image
                  src={metadata?.image || "/nftsample.png"}
                  alt={metadata?.name || `NFT #${tokenId}`}
                  fill
                  className="object-cover rounded-lg"
                  priority
                />
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {metadata?.name || `NFT #${tokenId}`}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {metadata?.description || "No description available"}
                  </p>
                </div>

                {/* Status and Price */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge variant={nftData.active ? "default" : "secondary"}>
                      {nftData.forRent
                        ? "For Rent"
                        : nftData.active
                        ? "For Sale"
                        : "Not Listed"}
                    </Badge>
                  </div>

                  {nftData.priceInEther > BigInt(0) && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {nftData.forRent ? "Price/Day" : "Price"}
                      </span>
                      <span className="text-lg font-bold">
                        {formatWei(nftData.priceInEther)} WEI
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Owner</span>
                    <span className="text-sm font-mono">
                      {nftData.seller.slice(0, 6)}...{nftData.seller.slice(-4)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {nftData.active && !isOwner && (
                    <>
                      {nftData.forRent ? (
                        <Link href={`/home/marketplace/${tokenId}/rent`}>
                          <Button className="w-full h-12">
                            <Clock className="w-4 h-4 mr-2" />
                            Rent NFT
                          </Button>
                        </Link>
                      ) : (
                        <TransactionButton
                          transaction={() =>
                            prepareContractCall({
                              contract,
                              method: "function buyNFT(uint256 tokenId)",
                              params: [tokenId!],
                              value: nftData.priceInEther,
                            })
                          }
                          onTransactionConfirmed={() => {
                            toast.success("🎉 NFT purchased successfully!");
                          }}
                          onError={(error) => {
                            toast.error(`❌ Purchase failed: ${error.message}`);
                          }}
                          className="w-full h-12"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Buy for {formatWei(nftData.priceInEther)} WEI
                        </TransactionButton>
                      )}
                    </>
                  )}

                  {isExpired && (
                    <TransactionButton
                      transaction={() =>
                        prepareContractCall({
                          contract,
                          method: "function endRental(uint256 tokenId)",
                          params: [tokenId!],
                        })
                      }
                      onTransactionConfirmed={() => {
                        toast.success("🔄 Rental ended successfully!");
                      }}
                      onError={(error) => {
                        toast.error(
                          `❌ Failed to end rental: ${error.message}`
                        );
                      }}
                      className="w-full border border-border"
                    >
                      End Expired Rental
                    </TransactionButton>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Information */}
        {nftData.forRent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Rental Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Min Duration
                  </span>
                  <p className="font-medium">
                    {Number(nftData.minRentDuration)} hours
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Max Duration
                  </span>
                  <p className="font-medium">
                    {Number(nftData.maxRentDuration)} hours
                  </p>
                </div>
              </div>

              {isRented && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Current Renter
                    </span>
                    <p className="font-medium font-mono">
                      {nftData.renter.slice(0, 6)}...{nftData.renter.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Time Remaining
                    </span>
                    <p className="font-medium">
                      {formatTimeRemaining(nftData.rentEnd)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Royalty Information */}
        {royaltyData && royaltyData[1] > BigInt(0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Royalty Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Royalty Recipient
                  </span>
                  <p className="font-medium font-mono">
                    {royaltyData[0].slice(0, 6)}...{royaltyData[0].slice(-4)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Royalty Amount
                  </span>
                  <p className="font-medium">{formatWei(royaltyData[1])} WEI</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attributes */}
        {metadata?.attributes && metadata.attributes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {metadata.attributes.map((attr, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">
                      {attr.trait_type}
                    </p>
                    <p className="font-medium">{attr.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
