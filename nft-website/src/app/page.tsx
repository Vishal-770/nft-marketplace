import { ConnectButton } from "thirdweb/react";
import Link from "next/link";
import client from "./client";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold text-center">NFT Marketplace</h1>

        <ConnectButton client={client} />

        <div className="flex gap-4 mt-8">
          <Link
            href="/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create NFT Metadata
          </Link>
        </div>

        <div className="text-center max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">
            Welcome to NFT Marketplace
          </h2>
          <p className="text-gray-600">
            Create and manage your NFT metadata with our easy-to-use tools.
            Upload images to IPFS, create metadata JSON, and get ready to mint
            your NFTs on the blockchain.
          </p>
        </div>
      </main>
    </div>
  );
}
