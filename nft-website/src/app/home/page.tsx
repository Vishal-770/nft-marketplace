"use client";

import { ConnectButton } from "thirdweb/react";
import client from "../client";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function HomePage() {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center pb-20 mb-15">
      {theme === "light" && (
        <div className="mt-10">
          <Image src="/logo.png" alt="NFT Rentals" width={200} height={200} />
        </div>
      )}
      {theme === "dark" && (
        <div className="mt-10">
          <Image
            src="/logodark.png"
            alt="NFT Rentals"
            width={200}
            height={200}
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mt-6">NFT Rentals</h1>
      <p className="text-muted-foreground text-sm">The Airbnb of NFTs</p>

      {/* Buttons */}
      <div className="flex flex-col gap-4 mt-8 w-64">
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition-colors">
          Browse NFTs
        </button>
        <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-2 rounded-lg transition-colors">
          List Your NFT
        </button>
      </div>

      {/* Wallet Connect */}
      <div className="mt-8">
        <ConnectButton client={client} />
      </div>
    </div>
  );
}
