"use client";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Marketplace() {
  const [query, setQuery] = useState("");

  const nfts = [
    {
      id: 1,
      name: "CryptoPunk #7804",
      price: "0.5 ETH / day",
      image: "https://cryptopunks.app/cryptopunks/7804.png",
    },
    {
      id: 2,
      name: "Bored Ape #3456",
      price: "0.8 ETH / day",
      image: "https://boredapeyachtclub.com/api/members/3456.png",
    },
    {
      id: 3,
      name: "Azuki #1234",
      price: "0.3 ETH / day",
      image: "https://azuki.com/images/azuki-1234.png",
    },
    {
      id: 4,
      name: "Moonbirds #5678",
      price: "0.6 ETH / day",
      image: "https://moonbirds.xyz/api/5678.png",
    },
    {
      id: 5,
      name: "Doodles #9012",
      price: "0.4 ETH / day",
      image: "https://doodles.app/api/9012.png",
    },
    {
      id: 6,
      name: "CloneX #3456",
      price: "0.7 ETH / day",
      image: "https://clonex.rtfkt.com/3456.png",
    },
  ];

  const filteredNFTs = nfts.filter((nft) =>
    nft.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="px-4 py-6 pb-24 bg-background min-h-screen text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold text-foreground">Marketplace</h1>
        {/* <SlidersHorizontal size={18} className="text-muted-foreground" /> */}
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <input
          type="text"
          placeholder="Search NFTs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-card border border-border text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <button className="bg-muted hover:bg-muted/80 border border-border px-3 py-1 rounded-full text-sm text-foreground transition-colors">
          Category
        </button>
        <button className="bg-muted hover:bg-muted/80 border border-border px-3 py-1 rounded-full text-sm text-foreground transition-colors">
          Price
        </button>
        <button className="bg-muted hover:bg-muted/80 border border-border px-3 py-1 rounded-full text-sm text-foreground transition-colors">
          Duration
        </button>
      </div>

      {/* NFT Grid */}
      {filteredNFTs.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredNFTs.map((nft) => (
            <Link key={nft.id} href={`/home/marketplace/${nft.id}`}>
              <div className="min-w-[120px] flex-shrink-0 cursor-pointer group">
                <div className="w-[120px] h-[120px] rounded-lg overflow-hidden bg-muted border border-border group-hover:border-ring transition-colors">
                  <Image
                    src="/nftsample.png"
                    alt={nft.name}
                    width={120}
                    height={120}
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-xs font-medium truncate text-foreground">
                  {nft.name}
                </p>
                <p className="text-[11px] text-muted-foreground">{nft.price}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No NFTs found.</p>
      )}
    </div>
  );
}
