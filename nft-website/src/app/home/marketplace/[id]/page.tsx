"use client";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const nfts = [
  { id: 1, name: "CryptoPunk #7804", price: "0.5 ETH / day", image: "https://cryptopunks.app/cryptopunks/7804.png" },
  { id: 2, name: "Bored Ape #3456", price: "0.8 ETH / day", image: "https://boredapeyachtclub.com/api/members/3456.png" },
  { id: 3, name: "Azuki #1234", price: "0.3 ETH / day", image: "https://azuki.com/images/azuki-1234.png" },
  { id: 4, name: "Moonbirds #5678", price: "0.6 ETH / day", image: "https://moonbirds.xyz/api/5678.png" },
  { id: 5, name: "Doodles #9012", price: "0.4 ETH / day", image: "https://doodles.app/api/9012.png" },
  { id: 6, name: "CloneX #3456", price: "0.7 ETH / day", image: "https://clonex.rtfkt.com/3456.png" },
];

export default function NFTDetail() {
  const params = useParams();
  const nft = nfts.find((item) => item.id.toString() === params.id);

  if (!nft) return <p className="text-white">NFT not found</p>;

  return (
    <div className="px-4 py-6 bg-[#0a0f18] min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/home/marketplace">
          <ArrowLeft size={20} className="cursor-pointer" />
        </Link>
        <h1 className="text-lg font-semibold">{nft.name}</h1>
      </div>

      {/* Main Image */}
      <div className="w-full h-[300px] rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
        <Image src="/nftsample.png" alt={nft.name} width={400} height={400} className="object-contain" />
      </div>

      {/* Price + Rent button */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm">{nft.price}</p>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          Rent Now
        </button>
      </div>
    </div>
  );
}
