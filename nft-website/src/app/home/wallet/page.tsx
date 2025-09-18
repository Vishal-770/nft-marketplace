"use client";

import { useState } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { TransactionButton } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { contract } from "@/lib/contract";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wallet, Crown, Clock, AlertCircle } from "lucide-react";

interface RentedNFT {
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

export default function WalletPage() {
  const account = useActiveAccount();
  const [platformFee, setPlatformFee] = useState("");
  const [newOwner, setNewOwner] = useState("");

  // Format wei for display
  const formatWei = (wei: bigint): string => {
    const weiString = wei.toString();
    return weiString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get pending withdrawals
  const { data: pendingWithdrawals, refetch: refetchWithdrawals } =
    useReadContract({
      contract,
      method: "function pendingWithdrawals(address) view returns (uint256)",
      params: account?.address
        ? [account.address]
        : ["0x0000000000000000000000000000000000000000"],
    });

  // Get total minted count
  const { data: totalMinted } = useReadContract({
    contract,
    method: "function getTotalMinted() view returns (uint256)",
    params: [],
  });

  // Get marketplace owner
  const { data: marketplaceOwner } = useReadContract({
    contract,
    method: "function marketplaceOwner() view returns (address)",
    params: [],
  });

  // Get platform fee
  const { data: currentPlatformFee } = useReadContract({
    contract,
    method: "function platformFeePercent() view returns (uint256)",
    params: [],
  });

  // Get NFTs rented by user
  const { data: rentedNFTs, refetch: refetchRentedNFTs } = useReadContract({
    contract,
    method:
      "function getNFTsRentedByUser(address user) view returns ((uint256 tokenId, address seller, uint256 priceInEther, bool forRent, uint256 minRentDuration, uint256 maxRentDuration, uint256 rentEnd, address renter, bool active, string tokenURI)[])",
    params: account?.address
      ? [account.address]
      : ["0x0000000000000000000000000000000000000000"],
  });

  const isAdmin =
    account?.address?.toLowerCase() === marketplaceOwner?.toLowerCase();

  const isRentalExpired = (rentEnd: bigint): boolean => {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    return currentTime >= rentEnd;
  };

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

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access wallet features
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 mb-15">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Wallet Management</h1>
          <p className="text-muted-foreground">
            Manage your withdrawals, rentals, and marketplace settings
          </p>
        </div>

        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="rentals">My Rentals</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Pending Withdrawals
                </CardTitle>
                <CardDescription>
                  Withdraw your earnings from NFT sales and rentals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Available Balance
                      </span>
                      <span className="text-2xl font-bold">
                        {pendingWithdrawals
                          ? formatWei(pendingWithdrawals)
                          : "0"}{" "}
                        WEI
                      </span>
                    </div>
                  </div>

                  <TransactionButton
                    transaction={() => {
                      return prepareContractCall({
                        contract,
                        method: "function withdraw()",
                        params: [],
                      });
                    }}
                    onTransactionConfirmed={() => {
                      toast.success("💰 Withdrawal successful!");
                      refetchWithdrawals();
                    }}
                    onError={(error) => {
                      toast.error(`❌ Withdrawal failed: ${error.message}`);
                    }}
                    disabled={
                      !pendingWithdrawals || pendingWithdrawals === BigInt(0)
                    }
                    className="w-full"
                  >
                    {!pendingWithdrawals || pendingWithdrawals === BigInt(0)
                      ? "No Funds Available"
                      : `Withdraw ${formatWei(pendingWithdrawals)} WEI`}
                  </TransactionButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rentals Tab */}
          <TabsContent value="rentals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  My Rented NFTs
                </CardTitle>
                <CardDescription>
                  Manage NFTs you are currently renting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!rentedNFTs || rentedNFTs.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      You are not renting any NFTs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rentedNFTs.map((nft: RentedNFT) => (
                      <div
                        key={nft.tokenId.toString()}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              NFT #{nft.tokenId.toString()}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Renting from: {nft.seller.slice(0, 6)}...
                              {nft.seller.slice(-4)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              isRentalExpired(nft.rentEnd)
                                ? "destructive"
                                : "default"
                            }
                          >
                            {isRentalExpired(nft.rentEnd)
                              ? "Expired"
                              : "Active"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Time Remaining:
                            </span>
                            <p className="font-medium">
                              {formatTimeRemaining(nft.rentEnd)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Daily Rate:
                            </span>
                            <p className="font-medium">
                              {formatWei(nft.priceInEther)} WEI
                            </p>
                          </div>
                        </div>

                        {isRentalExpired(nft.rentEnd) && (
                          <div className="mt-4">
                            <TransactionButton
                              transaction={() =>
                                prepareContractCall({
                                  contract,
                                  method: "function endRental(uint256 tokenId)",
                                  params: [nft.tokenId],
                                })
                              }
                              onTransactionConfirmed={() => {
                                toast.success("🔄 Rental ended successfully!");
                                refetchRentedNFTs();
                              }}
                              onError={(error) => {
                                toast.error(
                                  `❌ Failed to end rental: ${error.message}`
                                );
                              }}
                              className="text-sm"
                            >
                              End Rental
                            </TransactionButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total NFTs Minted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {totalMinted ? totalMinted.toString() : "0"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Platform Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {currentPlatformFee
                      ? (Number(currentPlatformFee) / 10).toFixed(1)
                      : "0"}
                    %
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Rentals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {rentedNFTs?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Admin Functions
                  </CardTitle>
                  <CardDescription>
                    Manage marketplace settings (Admin only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Platform Fee */}
                  <div className="space-y-3">
                    <Label htmlFor="platformFee">
                      Platform Fee (in tenths of percent)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="platformFee"
                        type="number"
                        placeholder="25 (for 2.5%)"
                        value={platformFee}
                        onChange={(e) => setPlatformFee(e.target.value)}
                        max="100"
                        min="0"
                      />
                      <TransactionButton
                        transaction={() => {
                          return prepareContractCall({
                            contract,
                            method:
                              "function setPlatformFee(uint256 feePercent)",
                            params: [BigInt(platformFee || 0)],
                          });
                        }}
                        onTransactionConfirmed={() => {
                          toast.success("✅ Platform fee updated!");
                          setPlatformFee("");
                        }}
                        onError={(error) => {
                          toast.error(
                            `❌ Failed to update fee: ${error.message}`
                          );
                        }}
                        disabled={!platformFee || isNaN(Number(platformFee))}
                      >
                        Set Fee
                      </TransactionButton>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current fee:{" "}
                      {currentPlatformFee
                        ? (Number(currentPlatformFee) / 10).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>

                  {/* Marketplace Owner */}
                  <div className="space-y-3">
                    <Label htmlFor="newOwner">New Marketplace Owner</Label>
                    <div className="flex gap-2">
                      <Input
                        id="newOwner"
                        placeholder="0x..."
                        value={newOwner}
                        onChange={(e) => setNewOwner(e.target.value)}
                      />
                      <TransactionButton
                        transaction={() => {
                          return prepareContractCall({
                            contract,
                            method:
                              "function setMarketplaceOwner(address newOwner)",
                            params: [newOwner],
                          });
                        }}
                        onTransactionConfirmed={() => {
                          toast.success("✅ Marketplace owner updated!");
                          setNewOwner("");
                        }}
                        onError={(error) => {
                          toast.error(
                            `❌ Failed to update owner: ${error.message}`
                          );
                        }}
                        disabled={
                          !newOwner || !/^0x[a-fA-F0-9]{40}$/.test(newOwner)
                        }
                      >
                        Set Owner
                      </TransactionButton>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current owner: {marketplaceOwner?.slice(0, 6)}...
                      {marketplaceOwner?.slice(-4)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
