"use client";

import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Link from "next/link";
import Image from "next/image";
import {
  ConnectButton,
  useSendTransaction,
  useActiveAccount,
} from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { contract } from "@/lib/contract";
import {
  uploadImageToPinata,
  uploadMetadataToPinata,
  formatIPFSUri,
  type NFTMetadata,
} from "@/lib/pinata";
import { toast } from "sonner";
import { Upload, X, Plus, Check, AlertCircle } from "lucide-react";

interface FormData {
  name: string;
  description: string;
  royaltyPercent: number;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface UploadResult {
  metadataCid: string;
  imageCid: string;
  metadata: NFTMetadata;
  royaltyPercent: number;
}

type LoadingState =
  | "idle"
  | "uploading-image"
  | "uploading-metadata"
  | "ready-to-mint"
  | "minting"
  | "completed";

export function NFTCreationForm() {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showImageError, setShowImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      royaltyPercent: 0,
      attributes: [{ trait_type: "", value: "" }],
    },
  });

  const {
    fields,
    append: addTrait,
    remove: removeTrait,
  } = useFieldArray({
    control,
    name: "attributes",
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setShowImageError(false);
      } else {
        setShowImageError(true);
        setTimeout(() => setShowImageError(false), 3000);
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedImage) {
      setShowImageError(true);
      toast.error("Please select an image first");
      setTimeout(() => setShowImageError(false), 3000);
      return;
    }

    setError(null);
    setUploadResult(null);

    try {
      // Step 1: Upload image to Pinata
      setLoadingState("uploading-image");
      toast.loading("🎨 Uploading image to IPFS...", { id: "upload-progress" });
      console.log("Starting image upload...");
      const imageCid = await uploadImageToPinata(selectedImage);
      console.log("Image uploaded with CID:", imageCid);
      toast.success("✅ Image uploaded successfully!", {
        id: "upload-progress",
      });

      // Step 2: Create and upload metadata
      setLoadingState("uploading-metadata");
      toast.loading("📝 Creating and uploading metadata...", {
        id: "metadata-progress",
      });
      console.log("Creating and uploading metadata...");
      const metadata: NFTMetadata = {
        name: data.name,
        description: data.description,
        image: formatIPFSUri(imageCid),
        attributes: data.attributes.filter(
          (attr) => attr.trait_type && attr.value
        ),
      };

      const metadataCid = await uploadMetadataToPinata(metadata);
      console.log("Metadata uploaded with CID:", metadataCid);
      toast.success("✅ Metadata uploaded successfully!", {
        id: "metadata-progress",
      });

      // Step 3: Ready for minting
      setUploadResult({
        metadataCid,
        imageCid,
        metadata,
        royaltyPercent: data.royaltyPercent,
      });
      setLoadingState("ready-to-mint");
      toast.success("🚀 Ready to mint your NFT!");
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      setLoadingState("idle");
      toast.error(`❌ Upload failed: ${errorMessage}`);
    }
  };

  const getDisabledReason = () => {
    if (!account?.address) return "Connect wallet to mint";
    if (!uploadResult?.metadataCid) return "Upload metadata first";
    if (loadingState === "minting") return "Minting in progress...";
    if (loadingState === "completed") return "Completed!";
    return null;
  };

  const isDisabled =
    !account?.address ||
    !uploadResult?.metadataCid ||
    loadingState === "minting" ||
    loadingState === "completed";

  const handleMintNFT = () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!uploadResult?.metadataCid) {
      toast.error("Metadata not available. Please upload again.");
      return;
    }

    setLoadingState("minting");
    toast.success("Preparing transaction...");

    console.log("🔧 Contract Details:", {
      address: contract.address,
      chain: contract.chain,
      client: contract.client,
    });

    console.log("📋 Transaction Parameters:", {
      metadataCid: uploadResult.metadataCid,
      royaltyPercent: uploadResult.royaltyPercent,
      ipfsUrl: `ipfs://${uploadResult.metadataCid}`,
      walletAddress: account.address,
    });

    try {
      const transaction = prepareContractCall({
        contract,
        method: "function mintNFT(string _hash, uint256 royaltyPercent)",
        params: [
          `ipfs://${uploadResult.metadataCid}`,
          BigInt(uploadResult.royaltyPercent),
        ],
      });

      console.log("🚀 Prepared Transaction:", transaction);

      sendTransaction(transaction, {
        onSuccess: (receipt) => {
          console.log("✅ Transaction Success:", receipt);
          setLoadingState("completed");
          toast.success("🎉 NFT minted successfully!");

          // Reset form after 2 seconds
          setTimeout(() => {
            setLoadingState("idle");
            setUploadResult(null);
            setSelectedImage(null);
            setImagePreview(null);
            setError(null);
            reset();
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            toast.success("Form reset! Ready for next NFT.");
          }, 2000);
        },
        onError: (error) => {
          console.error("❌ Transaction Error:", error);
          toast.error(`❌ Minting failed: ${error.message}`);
          setError(error.message);
          setLoadingState("ready-to-mint");
        },
      });
    } catch (error) {
      console.error("🚨 Error preparing transaction:", error);
      toast.error(
        `Failed to prepare transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setLoadingState("ready-to-mint");
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed top-4 left-4 bg-card text-card-foreground p-3 rounded-lg text-xs z-50 border border-border shadow-lg">
          <div className="font-medium mb-1">Debug Panel</div>
          <div>
            State: <span className="text-primary">{loadingState}</span>
          </div>
          <div>
            Wallet:{" "}
            {account?.address
              ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
              : "Not connected"}
          </div>
          <div>Metadata: {uploadResult ? "Ready" : "None"}</div>
          <div>
            Can Mint:{" "}
            <span
              className={
                !isDisabled ? "text-accent-foreground" : "text-muted-foreground"
              }
            >
              {!isDisabled ? "Yes" : "No"}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Link
              href="/home"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 shadow-sm"
            >
              ← Back to Home
            </Link>
            <div className="w-full sm:w-auto">
              <ConnectButton client={contract.client} />
            </div>
          </div>
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Create Your NFT
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Transform your digital artwork into a unique NFT with custom
              metadata and royalties
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Form Section */}
            <div className="xl:col-span-2 order-2 xl:order-1">
              <div className="rounded-xl border border-border bg-card text-card-foreground shadow-lg overflow-hidden">
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="p-6 sm:p-8 space-y-8"
                >
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div className="pb-3 border-b border-border">
                      <h2 className="text-xl font-semibold text-foreground">
                        Basic Information
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Essential details about your NFT
                      </p>
                    </div>

                    {/* Name Field */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Name *
                      </label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        type="text"
                        placeholder="Enter your NFT name"
                        className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Description Field */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Description *
                      </label>
                      <textarea
                        {...register("description", {
                          required: "Description is required",
                        })}
                        placeholder="Describe your NFT in detail..."
                        rows={4}
                        className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    {/* Royalty Field */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Royalty Percentage
                      </label>
                      <div className="relative">
                        <input
                          {...register("royaltyPercent", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "Royalty must be at least 0%",
                            },
                            max: {
                              value: 99,
                              message: "Royalty cannot exceed 99%",
                            },
                          })}
                          type="number"
                          min="0"
                          max="99"
                          step="1"
                          placeholder="0"
                          className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          %
                        </div>
                      </div>
                      {errors.royaltyPercent && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.royaltyPercent.message}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                        💡 Royalty percentage you&apos;ll earn from secondary
                        sales (0-99%)
                      </div>
                    </div>
                  </div>

                  {/* Attributes Section */}
                  <div className="space-y-6">
                    <div className="pb-4 border-b border-border">
                      <h2 className="text-xl font-semibold text-foreground">
                        Attributes
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        Define your NFT&apos;s traits and properties
                      </p>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 sm:p-5 rounded-lg border border-border bg-muted/30 dark:bg-muted/20"
                        >
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="flex-1 space-y-2 w-full">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Trait Type
                              </label>
                              <input
                                {...register(`attributes.${index}.trait_type`)}
                                type="text"
                                placeholder="e.g., Color, Rarity, Background"
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                              />
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Value
                              </label>
                              <input
                                {...register(`attributes.${index}.value`)}
                                type="text"
                                placeholder="e.g., Blue, Rare, Ocean"
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                              />
                            </div>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTrait(index)}
                                className="mt-6 sm:mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive h-10 w-10 shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {fields.length < 5 && (
                      <button
                        type="button"
                        onClick={() => addTrait({ trait_type: "", value: "" })}
                        className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-dashed border-border bg-background hover:bg-accent hover:text-accent-foreground h-12 px-4 py-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Trait ({fields.length}/5)
                      </button>
                    )}

                    <p className="text-sm text-muted-foreground bg-muted/50 dark:bg-muted/30 p-3 rounded-lg border border-border/50">
                      💡 <strong className="text-foreground">Tip:</strong>{" "}
                      Attributes help categorize and filter your NFT in
                      marketplaces. Common traits include background, color,
                      rarity, and special features.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-8 border-t border-border space-y-6">
                    {/* Wallet Status */}
                    {account?.address ? (
                      <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-sm text-accent-foreground flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Wallet connected: {account.address.slice(0, 6)}...
                          {account.address.slice(-4)}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Connect your wallet using the button above to enable
                          NFT minting
                        </p>
                      </div>
                    )}

                    {loadingState === "ready-to-mint" ||
                    loadingState === "minting" ||
                    loadingState === "completed" ? (
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={handleMintNFT}
                        className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 py-3 shadow-sm"
                      >
                        {loadingState === "minting" ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                            Minting NFT...
                          </>
                        ) : loadingState === "completed" ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            NFT Minted!
                          </>
                        ) : isDisabled ? (
                          <>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {getDisabledReason()}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Mint NFT
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loadingState !== "idle"}
                        className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 py-3 shadow-sm"
                      >
                        {loadingState === "uploading-image" ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                            Uploading Image...
                          </>
                        ) : loadingState === "uploading-metadata" ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                            Uploading Metadata...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Create NFT Metadata
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="xl:col-span-1 order-1 xl:order-2">
              <div className="rounded-xl border border-border bg-card text-card-foreground shadow-lg overflow-hidden sticky top-6">
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="pb-4 border-b border-border">
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                      Artwork Preview
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload and preview your NFT image
                    </p>
                  </div>

                  {/* File Upload Area */}
                  <div className="space-y-4">
                    {!imagePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 ${
                          showImageError
                            ? "border-destructive bg-destructive/5"
                            : "border-border"
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center border border-border">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-foreground mb-1">
                              Click to upload image
                            </p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/30">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-3 right-3 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 w-8 shadow-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {selectedImage && (
                            <div className="absolute bottom-3 left-3 right-3 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2">
                              <p className="text-xs text-foreground font-medium truncate">
                                {selectedImage.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(selectedImage.size / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-4 py-2"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Change Image
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </div>
                    )}

                    {showImageError && (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Please select a valid image file (PNG, JPG, GIF)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload Tips */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-foreground">
                      💡 Tips for best results:
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2 bg-muted/30 dark:bg-muted/20 p-4 rounded-lg border border-border/50">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                        <span>
                          Use high-quality images (at least 500x500px)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                        <span>Square aspect ratio works best</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                        <span>File size should be under 10MB</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                        <span>PNG format preserves transparency</span>
                      </li>
                    </ul>
                  </div>

                  {/* Progress Indicator */}
                  {loadingState !== "idle" && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium text-foreground">
                          Creation Progress
                        </h3>
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {loadingState === "uploading-image" && "Step 1 of 3"}
                          {loadingState === "uploading-metadata" &&
                            "Step 2 of 3"}
                          {(loadingState === "ready-to-mint" ||
                            loadingState === "minting") &&
                            "Step 3 of 3"}
                          {loadingState === "completed" && "Complete!"}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Image Upload Step */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              loadingState === "uploading-image"
                                ? "bg-primary text-primary-foreground"
                                : [
                                    "uploading-metadata",
                                    "ready-to-mint",
                                    "minting",
                                    "completed",
                                  ].includes(loadingState)
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted border border-border text-muted-foreground"
                            }`}
                          >
                            {loadingState === "uploading-image" ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            ) : [
                                "uploading-metadata",
                                "ready-to-mint",
                                "minting",
                                "completed",
                              ].includes(loadingState) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium">1</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-medium ${
                                  loadingState === "uploading-image"
                                    ? "text-primary"
                                    : [
                                        "uploading-metadata",
                                        "ready-to-mint",
                                        "minting",
                                        "completed",
                                      ].includes(loadingState)
                                    ? "text-accent-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Upload Image to IPFS
                              </span>
                              {loadingState === "uploading-image" && (
                                <span className="text-xs text-primary animate-pulse">
                                  Uploading...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Metadata Upload Step */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              loadingState === "uploading-metadata"
                                ? "bg-primary text-primary-foreground"
                                : [
                                    "ready-to-mint",
                                    "minting",
                                    "completed",
                                  ].includes(loadingState)
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted border border-border text-muted-foreground"
                            }`}
                          >
                            {loadingState === "uploading-metadata" ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            ) : [
                                "ready-to-mint",
                                "minting",
                                "completed",
                              ].includes(loadingState) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium">2</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-medium ${
                                  loadingState === "uploading-metadata"
                                    ? "text-primary"
                                    : [
                                        "ready-to-mint",
                                        "minting",
                                        "completed",
                                      ].includes(loadingState)
                                    ? "text-accent-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Create & Upload Metadata
                              </span>
                              {loadingState === "uploading-metadata" && (
                                <span className="text-xs text-primary animate-pulse">
                                  Creating...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Minting Step */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              loadingState === "minting"
                                ? "bg-primary text-primary-foreground"
                                : loadingState === "completed"
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted border border-border text-muted-foreground"
                            }`}
                          >
                            {loadingState === "minting" ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            ) : loadingState === "completed" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium">3</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-medium ${
                                  loadingState === "minting"
                                    ? "text-primary"
                                    : loadingState === "completed"
                                    ? "text-accent-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Mint NFT on Blockchain
                              </span>
                              {loadingState === "minting" && (
                                <span className="text-xs text-primary animate-pulse">
                                  Minting...
                                </span>
                              )}
                              {loadingState === "completed" && (
                                <span className="text-xs text-accent-foreground">
                                  Complete!
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NFT Summary */}
                  {uploadResult && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Check className="w-5 h-5 text-accent" />
                        NFT Summary
                      </h3>

                      {/* NFT Details */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                          <h4 className="font-semibold text-foreground mb-2 text-base">
                            {uploadResult.metadata.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            {uploadResult.metadata.description}
                          </p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Royalty:
                              </span>
                              <span className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                {uploadResult.royaltyPercent}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Traits:
                              </span>
                              <span className="font-semibold">
                                {uploadResult.metadata.attributes.length}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* IPFS Details */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-foreground">
                            IPFS Storage
                          </h4>
                          <div className="space-y-2">
                            <div className="p-3 rounded-lg bg-muted/30 border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Image CID
                                </p>
                                <div className="w-2 h-2 bg-accent rounded-full"></div>
                              </div>
                              <code className="text-xs font-mono text-foreground break-all leading-relaxed">
                                {uploadResult.imageCid}
                              </code>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Metadata CID
                                </p>
                                <div className="w-2 h-2 bg-accent rounded-full"></div>
                              </div>
                              <code className="text-xs font-mono text-foreground break-all leading-relaxed">
                                {uploadResult.metadataCid}
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-6 rounded-lg border bg-destructive/10 border-destructive/20 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-destructive">
                        Upload Error
                      </h3>
                      <div className="mt-2 text-sm text-destructive/80">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
