"use client";

import client from "@/app/client";
import { contractAddress } from "@/constants";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import {
  Loader2,
  DollarSign,
  Calendar,
  MoreVertical,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Profile NFT Card Component with listing functionality
const ProfileNFTCard: React.FC<{ nft: NFTWithMetadata }> = ({ nft }) => {
  const { mutate: sendTransaction } = useSendTransaction();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(nft.metadata?.image || "");

  // Dialog states
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [rentDialogOpen, setRentDialogOpen] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);

  // Form states
  const [salePrice, setSalePrice] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  const formatWei = (wei: bigint): string => {
    // Format wei for better readability
    const weiString = wei.toString();

    // Add commas for better readability
    return weiString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

  const resetSaleForm = () => {
    setSalePrice("");
    setSaleDialogOpen(false);
  };

  const resetRentForm = () => {
    setRentPrice("");
    setMinDays("");
    setMaxDays("");
    setRentDialogOpen(false);
  };

  const handleListForSale = () => {
    if (
      !salePrice ||
      isNaN(parseFloat(salePrice)) ||
      parseFloat(salePrice) <= 0
    ) {
      toast.error("Please enter a valid sale price");
      return;
    }

    setIsTransacting(true);
    toast.loading("Preparing transaction...", { id: "list-sale" });

    // Since we're working in wei, use the input value directly
    const priceInWei = BigInt(salePrice);

    try {
      const transaction = prepareContractCall({
        contract,
        method:
          "function listNFTForSale(uint256 tokenId, uint256 priceInEther)",
        params: [nft.tokenId, priceInWei],
      });

      sendTransaction(transaction, {
        onSuccess: (receipt) => {
          console.log("✅ Sale listing successful:", receipt);
          toast.success("🎉 NFT listed for sale successfully!", {
            id: "list-sale",
          });
          resetSaleForm();
          setIsTransacting(false);
        },
        onError: (error) => {
          console.error("❌ Sale listing error:", error);
          toast.error(`❌ Failed to list for sale: ${error.message}`, {
            id: "list-sale",
          });
          setIsTransacting(false);
        },
      });
    } catch (error) {
      console.error("🚨 Error preparing sale transaction:", error);
      toast.error(
        `Failed to prepare transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: "list-sale" }
      );
      setIsTransacting(false);
    }
  };

  const handleListForRent = () => {
    if (
      !rentPrice ||
      isNaN(parseFloat(rentPrice)) ||
      parseFloat(rentPrice) <= 0
    ) {
      toast.error("Please enter a valid rental price");
      return;
    }
    if (!minDays || isNaN(parseInt(minDays)) || parseInt(minDays) <= 0) {
      toast.error("Please enter a valid minimum rental hours");
      return;
    }
    if (!maxDays || isNaN(parseInt(maxDays)) || parseInt(maxDays) <= 0) {
      toast.error("Please enter a valid maximum rental hours");
      return;
    }
    if (parseInt(minDays) > parseInt(maxDays)) {
      toast.error("Minimum hours cannot be greater than maximum hours");
      return;
    }

    setIsTransacting(true);
    toast.loading("Preparing transaction...", { id: "list-rent" });

    // Since we're working in wei, use the input value directly
    const pricePerDayInWei = BigInt(rentPrice);
    const minDurationInHours = BigInt(parseInt(minDays) * 24);
    const maxDurationInHours = BigInt(parseInt(maxDays) * 24);

    try {
      const transaction = prepareContractCall({
        contract,
        method:
          "function listNFTForRent(uint256 tokenId, uint256 pricePerDayInEther, uint256 minDurationInHours, uint256 maxDurationInHours)",
        params: [
          nft.tokenId,
          pricePerDayInWei,
          minDurationInHours,
          maxDurationInHours,
        ],
      });

      sendTransaction(transaction, {
        onSuccess: (receipt) => {
          console.log("✅ Rent listing successful:", receipt);
          toast.success("🎉 NFT listed for rent successfully!", {
            id: "list-rent",
          });
          resetRentForm();
          setIsTransacting(false);
        },
        onError: (error) => {
          console.error("❌ Rent listing error:", error);
          toast.error(`❌ Failed to list for rent: ${error.message}`, {
            id: "list-rent",
          });
          setIsTransacting(false);
        },
      });
    } catch (error) {
      console.error("🚨 Error preparing rent transaction:", error);
      toast.error(
        `Failed to prepare transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: "list-rent" }
      );
      setIsTransacting(false);
    }
  };

  const isListed = nft.active && (nft.priceInEther > 0 || nft.forRent);

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

        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {isListed ? (
            <Badge className="text-xs bg-green-500 hover:bg-green-600">
              Listed
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Unlisted
            </Badge>
          )}
          {nft.forRent && (
            <Badge variant="outline" className="text-xs">
              For Rent
            </Badge>
          )}
        </div>

        {/* Action Menu */}
        {!isListed && (
          <div className="absolute bottom-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isTransacting}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSaleDialogOpen(true)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  List for Sale
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRentDialogOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  List for Rent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
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

        {/* Current Status */}
        <div className="space-y-2">
          {nft.priceInEther > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Listed Price
              </span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {formatWei(nft.priceInEther)} WEI
                </span>
              </div>
            </div>
          )}

          {nft.forRent && nft.minRentDuration > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Rent Duration
              </span>
              <span className="text-xs">
                {nft.minRentDuration.toString()}-
                {nft.maxRentDuration.toString()} hours
              </span>
            </div>
          )}
        </div>

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
              {nft.metadata.attributes.slice(0, 2).map((attr, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.metadata.attributes.length > 2 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{nft.metadata.attributes.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
            <DialogDescription>
              Set a price for your NFT. Once listed, buyers can purchase it
              immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salePrice" className="text-right">
                Price (WEI)
              </Label>
              <Input
                id="salePrice"
                type="number"
                step="1"
                min="1"
                placeholder="100"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="col-span-3"
                disabled={isTransacting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetSaleForm}
              disabled={isTransacting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleListForSale}
              disabled={isTransacting || !salePrice}
            >
              {isTransacting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Listing...
                </>
              ) : (
                "List for Sale"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rent Dialog */}
      <Dialog open={rentDialogOpen} onOpenChange={setRentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>List NFT for Rent</DialogTitle>
            <DialogDescription>
              Set rental terms for your NFT. Renters can use it for the
              specified duration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rentPrice" className="text-right">
                Price/Day (WEI)
              </Label>
              <Input
                id="rentPrice"
                type="number"
                step="1"
                min="1"
                placeholder="50"
                value={rentPrice}
                onChange={(e) => setRentPrice(e.target.value)}
                className="col-span-3"
                disabled={isTransacting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minDays" className="text-right">
                Min hours
              </Label>
              <Input
                id="minDays"
                type="number"
                min="1"
                placeholder="1"
                value={minDays}
                onChange={(e) => setMinDays(e.target.value)}
                className="col-span-3"
                disabled={isTransacting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxDays" className="text-right">
                Max hours
              </Label>
              <Input
                id="maxDays"
                type="number"
                min="1"
                placeholder="30"
                value={maxDays}
                onChange={(e) => setMaxDays(e.target.value)}
                className="col-span-3"
                disabled={isTransacting}
              />
            </div>
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
              onClick={handleListForRent}
              disabled={isTransacting || !rentPrice || !minDays || !maxDays}
            >
              {isTransacting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Listing...
                </>
              ) : (
                "List for Rent"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

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
                <ProfileNFTCard key={nft.tokenId.toString()} nft={nft} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
