"use client";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ConfirmRental() {
  const router = useRouter();
  return (
    <div className="bg-background min-h-screen text-foreground px-4 py-6 mb-15">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowLeft
          onClick={() => router.back()}
          size={20}
          className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
        />
        <h1 className="text-lg font-semibold flex-1 text-center text-foreground">
          Confirm Rental
        </h1>
      </div>

      {/* NFT Card */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-muted border border-border">
          <Image
            src="/nftsample.png"
            alt="CryptoPunk #7804"
            width={60}
            height={60}
            className="object-cover"
          />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            CryptoPunk #7804
          </h2>
          <p className="text-xs text-muted-foreground">by Larva Labs</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4 bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Rental Duration</span>
          <span className="text-foreground">7 Days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Price per day</span>
          <span className="text-foreground">500,000,000,000,000,000 WEI</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-primary">
          <span>Total Cost</span>
          <span>3,500,000,000,000,000,000 WEI</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Payment Method</span>
          <div className="flex items-center gap-2">
            <Image src="/eth_logo.png" alt="WEI" width={18} height={18} />
            <span className="text-sm text-foreground">WEI</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground mb-6 leading-snug">
        This is a decentralized transaction. By proceeding, you are interacting
        directly with a smart contract on the blockchain. Ensure you have
        reviewed all details as transactions are irreversible.
      </p>

      {/* Confirm Button */}
      <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
        Finalize Rental & Sign Contract
      </button>
    </div>
  );
}
