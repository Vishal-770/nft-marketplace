import { NFTCreationForm } from "./components/NFTCreationForm";

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create NFT Metadata
          </h1>
          <p className="text-gray-600">
            Upload your image and create metadata for your NFT
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <NFTCreationForm />
        </div>
      </div>
    </div>
  );
}
