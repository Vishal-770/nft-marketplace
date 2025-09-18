"use client";
import client from "@/app/client";
import { contractAddress } from "@/constants";
import React, { useState, useEffect } from "react";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { useReadContract } from "thirdweb/react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Calendar, DollarSign } from "lucide-react";

// Define interfaces for NFT data
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

// Utility functions
const isValidIPFSHash = (tokenURI: string): boolean => {
  return tokenURI.startsWith("ipfs://bafkrei");
};

const convertToGatewayURL = (ipfsHash: string): string => {
  if (ipfsHash.startsWith("ipfs://")) {
    const hash = ipfsHash.replace("ipfs://", "");
    // Try Pinata gateway first, but we'll have fallbacks
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
  return ipfsHash;
};

// Alternative gateway for fallback
const getAlternativeImageURL = (ipfsHash: string): string => {
  if (ipfsHash.startsWith("ipfs://")) {
    const hash = ipfsHash.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${hash}`;
  }
  return ipfsHash;
};

const fetchNFTMetadata = async (
  tokenURI: string
): Promise<NFTMetadata | null> => {
  try {
    if (!isValidIPFSHash(tokenURI)) {
      console.log(`Invalid IPFS hash: ${tokenURI}`);
      return null;
    }

    const gatewayURL = convertToGatewayURL(tokenURI);
    console.log(`Fetching metadata from: ${gatewayURL}`);

    const response = await fetch(gatewayURL);

    if (!response.ok) {
      console.error(
        `Failed to fetch metadata: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata: NFTMetadata = await response.json();
    console.log(`Fetched metadata:`, metadata);

    // Convert image URL to gateway URL if it's IPFS
    if (metadata.image && metadata.image.startsWith("ipfs://")) {
      const originalImage = metadata.image;
      metadata.image = convertToGatewayURL(metadata.image);
      console.log(
        `Converted image URL from ${originalImage} to ${metadata.image}`
      );
    }

    // Validate that the image URL is accessible
    if (metadata.image) {
      try {
        const imageResponse = await fetch(metadata.image, { method: "HEAD" });
        if (!imageResponse.ok) {
          console.warn(
            `Image not accessible: ${metadata.image} (${imageResponse.status})`
          );
          // Don't set image to null, just log the warning
        } else {
          console.log(`Image is accessible: ${metadata.image}`);
        }
      } catch (imageError) {
        console.warn(`Error checking image accessibility:`, imageError);
      }
    }

    return metadata;
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    return null;
  }
};

// NFT Card Component
const NFTCard: React.FC<{ nft: NFTWithMetadata }> = ({ nft }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(nft.metadata?.image || "");

  const formatEther = (wei: bigint): string => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleImageError = () => {
    console.error(`Failed to load image for NFT #${nft.tokenId}:`, imageSrc);

    // Try alternative gateway if we haven't already
    if (imageSrc && imageSrc.includes("gateway.pinata.cloud")) {
      const alternativeUrl = getAlternativeImageURL(
        nft.metadata?.image?.replace(
          "https://gateway.pinata.cloud/ipfs/",
          "ipfs://"
        ) || ""
      );
      console.log(`Trying alternative gateway: ${alternativeUrl}`);
      setImageSrc(alternativeUrl);
      setImageLoading(true);
      return;
    }

    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log(`Successfully loaded image for NFT #${nft.tokenId}`);
    setImageLoading(false);
    setImageError(false);
  };

  // Update image source when metadata changes
  useEffect(() => {
    if (nft.metadata?.image) {
      setImageSrc(nft.metadata.image);
      setImageError(false);
      setImageLoading(true);
    }
  }, [nft.metadata?.image]);

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
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
              {imageError && nft.metadata?.image && (
                <p className="text-xs text-destructive px-2">
                  Failed to load from IPFS
                </p>
              )}
            </div>
          </div>
        )}

        {/* Token ID Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs font-mono">
            #{nft.tokenId.toString()}
          </Badge>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {nft.active && (
            <Badge className="text-xs bg-green-500 hover:bg-green-600">
              Active
            </Badge>
          )}
          {nft.forRent && (
            <Badge variant="outline" className="text-xs">
              For Rent
            </Badge>
          )}
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

        {/* Price and Seller Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Price</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm font-medium">
                {nft.priceInEther > 0
                  ? `${formatEther(nft.priceInEther)} ETH`
                  : "Not for sale"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Owner</span>
            <span className="text-xs font-mono text-foreground">
              {formatAddress(nft.seller)}
            </span>
          </div>
        </div>

        {/* Rental Info */}
        {nft.forRent && (
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Min Rent</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs">
                  {nft.minRentDuration.toString()} days
                </span>
              </div>
            </div>
            {nft.rentEnd > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Rented to</span>
                <span className="text-xs font-mono">
                  {formatAddress(nft.renter)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Attributes */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Traits</span>
              <Badge variant="outline" className="text-xs">
                {nft.metadata.attributes.length}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.metadata.attributes.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{nft.metadata.attributes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* IPFS Link */}
        <div className="pt-2 border-t border-border">
          <a
            href={convertToGatewayURL(nft.tokenURI)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Metadata
          </a>
        </div>
      </div>
    </Card>
  );
};

const ProfilePage = () => {
  const [nftsWithMetadata, setNftsWithMetadata] = useState<NFTWithMetadata[]>(
    []
  );
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  const { data, isPending } = useReadContract({
    contract,
    method:
      "function getAllNFTs() view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI)[])",
    params: [],
  });

  useEffect(() => {
    const loadNFTMetadata = async () => {
      if (!data) return;

      setIsLoadingMetadata(true);

      // Filter NFTs with valid IPFS hashes
      const validNFTs = data.filter((nft: NFTData) =>
        isValidIPFSHash(nft.tokenURI)
      );

      // Initialize NFTs with loading state
      const initialNFTs: NFTWithMetadata[] = validNFTs.map((nft: NFTData) => ({
        ...nft,
        isLoadingMetadata: true,
      }));

      setNftsWithMetadata(initialNFTs);

      // Fetch metadata for each NFT
      const nftsWithMetadataPromises = validNFTs.map(async (nft: NFTData) => {
        const metadata = await fetchNFTMetadata(nft.tokenURI);
        return {
          ...nft,
          metadata,
          isLoadingMetadata: false,
        };
      });

      try {
        const results = await Promise.all(nftsWithMetadataPromises);
        setNftsWithMetadata(results);
      } catch (error) {
        console.error("Error loading NFT metadata:", error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadNFTMetadata();
  }, [data]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading NFTs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              My NFT Collection
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Discover and manage your NFT portfolio
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isLoadingMetadata ? (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading NFT metadata...</p>
          </div>
        ) : nftsWithMetadata.length === 0 ? (
          <div className="text-center space-y-4 py-12">
            <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <div className="text-2xl">🖼️</div>
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              No NFTs Found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No NFTs with valid IPFS metadata were found in your collection.
              Create your first NFT to get started!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  Collection ({nftsWithMetadata.length})
                </h2>
                <Badge variant="secondary" className="px-3 py-1">
                  {nftsWithMetadata.filter((nft) => nft.metadata).length} with
                  metadata
                </Badge>
              </div>
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
// At the bottom of your file

// Default export (main page)

// Named exports (helpers + card + interfaces if needed elsewhere)
export {
  NFTCard,
  fetchNFTMetadata,
  isValidIPFSHash,
  convertToGatewayURL,
  getAlternativeImageURL,
};

// Interfaces (optional – export only if you’ll import them elsewhere)
export type { NFTData, NFTMetadata, NFTWithMetadata };
