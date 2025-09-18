"use client";

import { ConnectButton } from "thirdweb/react";
import client from "../client";
import Image from "next/image";

export default function HomePage() {
    return (
        <div className="flex flex-col items-center justify-center  bg-background text-center pb-20">
            {/* Logo */}
            <div className="mt-10">
                <Image src="/logo.png" alt="NFT Rentals" width={200} height={200} />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mt-6">NFT Rentals</h1>
            <p className="text-muted-foreground text-sm">The Airbnb of NFTs</p>

            {/* Buttons */}
            <div className="flex flex-col gap-4 mt-8 w-64">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg">
                    Browse NFTs
                </button>
                <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-2 rounded-lg">
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