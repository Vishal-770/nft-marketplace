"use client";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import Image from "next/image";

export default function Marketplace() {
  const [query, setQuery] = useState("");

  const nfts = [
    { id: 1, name: "CryptoPunk #7804", price: "0.5 ETH / day", image: "https://cryptopunks.app/cryptopunks/7804.png" },
    { id: 2, name: "Bored Ape #3456", price: "0.8 ETH / day", image: "https://boredapeyachtclub.com/api/members/3456.png" },
    { id: 3, name: "Azuki #1234", price: "0.3 ETH / day", image: "https://azuki.com/images/azuki-1234.png" },
    { id: 4, name: "Moonbirds #5678", price: "0.6 ETH / day", image: "https://moonbirds.xyz/api/5678.png" },
    { id: 5, name: "Doodles #9012", price: "0.4 ETH / day", image: "https://doodles.app/api/9012.png" },
    { id: 6, name: "CloneX #3456", price: "0.7 ETH / day", image: "https://clonex.rtfkt.com/3456.png" },
  ];

  const filteredNFTs = nfts.filter((nft) =>
    nft.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="px-4 py-6 pb-24 bg-[#0a0f18] min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold">Marketplace</h1>
        <SlidersHorizontal size={18} className="text-gray-300" />
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search NFTs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-800 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <button className="bg-gray-800 px-3 py-1 rounded-full text-sm">Category</button>
        <button className="bg-gray-800 px-3 py-1 rounded-full text-sm">Price</button>
        <button className="bg-gray-800 px-3 py-1 rounded-full text-sm">Duration</button>
      </div>

      {/* NFT Grid */}
      {filteredNFTs.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredNFTs.map((nft) => (
            <div key={nft.id} className="min-w-[120px] flex-shrink-0">
              <div className="w-[120px] h-[120px] rounded-lg overflow-hidden bg-gray-700">
                <Image
                  src="/nftsample.png"
                  alt={nft.name}
                  width={120}
                  height={120}
                  className="object-cover"
                />
              </div>
              <p className="mt-2 text-xs font-medium truncate">{nft.name}</p>
              <p className="text-[11px] text-gray-400">{nft.price}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No NFTs found.</p>
      )}
    </div>
  );
}