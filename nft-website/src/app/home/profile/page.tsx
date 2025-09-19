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
  TransactionButton,
} from "thirdweb/react";
import {
  Loader2,
  DollarSign,
  Calendar,
  MoreVertical,
  ShoppingCart,
  Clock,
  RefreshCw,
  User,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Rented NFT Card Component (for NFTs user rented from others)
const RentedNFTCard: React.FC<{
  nft: NFTWithMetadata;
  onRefetch: () => void;
}> = ({ nft, onRefetch }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(nft.metadata?.image || "");

  const formatTimeRemaining = (rentEnd: bigint): string => {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    if (currentTime >= rentEnd) return "Expired";

    const remaining = Number(rentEnd - currentTime);
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const isRentalExpired = (rentEnd: bigint): boolean => {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    return currentTime >= rentEnd;
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

  const isExpired = isRentalExpired(nft.rentEnd);

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

        {/* Rental Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            className={`text-xs ${
              isExpired
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isExpired ? "Expired" : "Renting"}
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

        {/* Rental Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Owner</span>
            <span className="text-sm font-mono text-foreground">
              {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isExpired ? "Was Renting Until" : "Rental Ends"}
            </span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatTimeRemaining(nft.rentEnd)}
              </span>
            </div>
          </div>
        </div>

        {/* Attributes */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-1">
              {nft.metadata.attributes.slice(0, 2).map((attr, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.metadata.attributes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{nft.metadata.attributes.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Owner Rental Card Component (for NFTs user owns but rented to others)
const OwnerRentalCard: React.FC<{
  nft: NFTWithMetadata;
  onRefetch: () => void;
}> = ({ nft, onRefetch }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(nft.metadata?.image || "");

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  const formatTimeRemaining = (rentEnd: bigint): string => {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    if (currentTime >= rentEnd) return "Expired";

    const remaining = Number(rentEnd - currentTime);
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const isRentalExpired = (rentEnd: bigint): boolean => {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    return currentTime >= rentEnd;
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

  const isExpired = isRentalExpired(nft.rentEnd);

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

        {/* Rental Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            className={`text-xs ${
              isExpired
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isExpired ? "Can Reclaim" : "Rented Out"}
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

        {/* Rental Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Renter</span>
            <span className="text-sm font-mono text-foreground">
              {nft.renter.slice(0, 6)}...{nft.renter.slice(-4)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isExpired ? "Rental Ended" : "Rental Ends"}
            </span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatTimeRemaining(nft.rentEnd)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isExpired && (
          <div className="pt-2">
            <TransactionButton
              transaction={() => {
                return prepareContractCall({
                  contract,
                  method: "function endRental(uint256 tokenId)",
                  params: [nft.tokenId],
                });
              }}
              onTransactionConfirmed={() => {
                toast.success("🎉 NFT reclaimed successfully!");
                onRefetch();
              }}
              onError={(error) => {
                toast.error(`❌ Failed to reclaim NFT: ${error.message}`);
              }}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reclaim NFT
            </TransactionButton>
          </div>
        )}

        {/* Attributes */}
        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-1">
              {nft.metadata.attributes.slice(0, 2).map((attr, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {attr.trait_type}: {attr.value}
                </Badge>
              ))}
              {nft.metadata.attributes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{nft.metadata.attributes.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Profile NFT Card Component with listing functionality
const ProfileNFTCard: React.FC<{ nft: NFTWithMetadata }> = ({ nft }) => {
  const { mutate: sendTransaction } = useSendTransaction();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(nft.metadata?.image || "");

  // Dialog states
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [rentDialogOpen, setRentDialogOpen] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [minDays, setMinDays] = useState("");
  const [maxDays, setMaxDays] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  const formatWei = (weiValue: bigint): string => {
    const weiString = weiValue.toString();
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
    const priceInWei = BigInt(salePrice);

    try {
      const transaction = prepareContractCall({
        contract,
        method: "function listNFTForSale(uint256 tokenId, uint256 priceInWei)",
        params: [nft.tokenId, priceInWei],
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          toast.success("🎉 NFT listed for sale successfully!", {
            id: "list-sale",
          });
          resetSaleForm();
          setIsTransacting(false);
        },
        onError: (error) => {
          toast.error(`❌ Failed to list for sale: ${error.message}`, {
            id: "list-sale",
          });
          setIsTransacting(false);
        },
      });
    } catch (error) {
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

    const pricePerDayInWei = BigInt(rentPrice);
    const minDurationInHours = BigInt(parseInt(minDays));
    const maxDurationInHours = BigInt(parseInt(maxDays));

    try {
      const transaction = prepareContractCall({
        contract,
        method:
          "function listNFTForRent(uint256 tokenId, uint256 pricePerDayInWei, uint256 minDurationInHours, uint256 maxDurationInHours)",
        params: [
          nft.tokenId,
          pricePerDayInWei,
          minDurationInHours,
          maxDurationInHours,
        ],
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          toast.success("🎉 NFT listed for rent successfully!", {
            id: "list-rent",
          });
          resetRentForm();
          setIsTransacting(false);
        },
        onError: (error) => {
          toast.error(`❌ Failed to list for rent: ${error.message}`, {
            id: "list-rent",
          });
          setIsTransacting(false);
        },
      });
    } catch (error) {
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
                placeholder="48"
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
  const [rentedNFTs, setRentedNFTs] = useState<NFTWithMetadata[]>([]);
  const [ownedRentedNFTs, setOwnedRentedNFTs] = useState<NFTWithMetadata[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const contract = getContract({
    chain: sepolia,
    client: client,
    address: contractAddress,
  });

  // Get all NFTs from the marketplace
  const {
    data: allNFTs,
    isPending: isLoadingAllNFTs,
    refetch: refetchAllNFTs,
  } = useReadContract({
    contract,
    method:
      "function getAllNFTs() view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI)[])",
    params: [],
  });

  // Get NFTs rented by user
  const {
    data: userRentedNFTs,
    isPending: isLoadingRentedNFTs,
    refetch: refetchRentedNFTs,
  } = useReadContract({
    contract,
    method:
      "function getNFTsRentedByUser(address user) view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI)[])",
    params: account?.address
      ? [account.address]
      : ["0x0000000000000000000000000000000000000000"],
  });

  // Get owned NFT token IDs
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
  const isPending =
    isLoadingAllNFTs || isLoadingTokenIds || isLoadingRentedNFTs;

  const handleRefetch = () => {
    setRefetchTrigger((prev) => prev + 1);
    refetchAllNFTs();
    refetchRentedNFTs();
    ownedTokenIdsQuery.refetch();
  };

  useEffect(() => {
    const loadNFTMetadata = async () => {
      if (!account?.address || (!allNFTs && !userRentedNFTs)) {
        setNftsWithMetadata([]);
        setRentedNFTs([]);
        setOwnedRentedNFTs([]);
        return;
      }

      setIsLoadingMetadata(true);

      try {
        // Process owned NFTs
        if (allNFTs && ownedTokenIds) {
          const userOwnedNFTs = allNFTs.filter((nft: NFTData) =>
            ownedTokenIds.some((tokenId: bigint) => tokenId === nft.tokenId)
          );

          const validOwnedNFTs = userOwnedNFTs.filter((nft: NFTData) =>
            isValidIPFSHash(nft.tokenURI)
          );

          const ownedPromises = validOwnedNFTs.map(async (nft: NFTData) => {
            const metadata = await fetchNFTMetadata(nft.tokenURI);
            return { ...nft, metadata, isLoadingMetadata: false };
          });

          const ownedResults = await Promise.all(ownedPromises);
          setNftsWithMetadata(ownedResults);

          // Find NFTs owned by user but rented to others
          const ownedAndRented = ownedResults.filter(
            (nft) =>
              nft.renter !== "0x0000000000000000000000000000000000000000" &&
              nft.renter !== account.address
          );
          setOwnedRentedNFTs(ownedAndRented);
        }

        // Process rented NFTs (NFTs user rented from others)
        if (userRentedNFTs) {
          const validRentedNFTs = userRentedNFTs.filter((nft: NFTData) =>
            isValidIPFSHash(nft.tokenURI)
          );

          const rentedPromises = validRentedNFTs.map(async (nft: NFTData) => {
            const metadata = await fetchNFTMetadata(nft.tokenURI);
            return { ...nft, metadata, isLoadingMetadata: false };
          });

          const rentedResults = await Promise.all(rentedPromises);
          setRentedNFTs(rentedResults);
        }
      } catch (error) {
        console.error("Error loading NFT metadata:", error);
        setNftsWithMetadata([]);
        setRentedNFTs([]);
        setOwnedRentedNFTs([]);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadNFTMetadata();
  }, [
    allNFTs,
    userRentedNFTs,
    ownedTokenIds,
    account?.address,
    refetchTrigger,
  ]);

  // Separate owned NFTs into idle and active listings
  const idleNFTs = nftsWithMetadata.filter(
    (nft) =>
      !nft.active && nft.renter === "0x0000000000000000000000000000000000000000"
  );

  const activeListings = nftsWithMetadata.filter(
    (nft) =>
      nft.active && nft.renter === "0x0000000000000000000000000000000000000000"
  );

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
    <div className="min-h-screen bg-background mb-15">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Connected: <span className="font-mono">{account.address}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="idle" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="idle" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Idle NFTs ({idleNFTs.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Active Listings ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger
              value="rented-from"
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Renting From Others ({rentedNFTs.length})
            </TabsTrigger>
            <TabsTrigger value="rented-to" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Rented To Others ({ownedRentedNFTs.length})
            </TabsTrigger>
          </TabsList>

          {/* Idle NFTs Tab */}
          <TabsContent value="idle" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Idle NFTs</h2>
              <Badge variant="secondary">
                {idleNFTs.filter((n) => n.metadata).length} with metadata
              </Badge>
            </div>

            {isLoadingMetadata ? (
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Loading NFT metadata...</p>
              </div>
            ) : idleNFTs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Idle NFTs</h3>
                <p>All your NFTs are either listed or rented out!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {idleNFTs.map((nft) => (
                  <ProfileNFTCard key={nft.tokenId.toString()} nft={nft} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active Listings Tab */}
          <TabsContent value="active" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Active Listings</h2>
              <Badge variant="secondary">
                {activeListings.filter((n) => n.metadata).length} with metadata
              </Badge>
            </div>

            {isLoadingMetadata ? (
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Loading NFT metadata...</p>
              </div>
            ) : activeListings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  No Active Listings
                </h3>
                <p>Start listing your NFTs for sale or rent!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeListings.map((nft) => (
                  <ProfileNFTCard key={nft.tokenId.toString()} nft={nft} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rented From Others Tab */}
          <TabsContent value="rented-from" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">NFTs I&apos;m Renting</h2>
              <Badge variant="secondary">
                {rentedNFTs.filter((n) => n.metadata).length} with metadata
              </Badge>
            </div>

            {isLoadingMetadata ? (
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Loading NFT metadata...</p>
              </div>
            ) : rentedNFTs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Rented NFTs</h3>
                <p>Visit the rent page to start renting NFTs!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rentedNFTs.map((nft) => (
                  <RentedNFTCard
                    key={nft.tokenId.toString()}
                    nft={nft}
                    onRefetch={handleRefetch}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rented To Others Tab */}
          <TabsContent value="rented-to" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">NFTs Rented to Others</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {ownedRentedNFTs.filter((n) => n.metadata).length} with
                  metadata
                </Badge>
                <Button onClick={handleRefetch} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {isLoadingMetadata ? (
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Loading NFT metadata...</p>
              </div>
            ) : ownedRentedNFTs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">
                  No NFTs Rented Out
                </h3>
                <p>List your NFTs for rent to see them here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ownedRentedNFTs.map((nft) => (
                  <OwnerRentalCard
                    key={nft.tokenId.toString()}
                    nft={nft}
                    onRefetch={handleRefetch}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
