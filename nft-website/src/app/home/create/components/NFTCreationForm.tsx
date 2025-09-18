"use client";

import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Upload, AlertCircle, Check } from "lucide-react";
import {
  uploadImageToPinata,
  uploadMetadataToPinata,
  formatIPFSUri,
  type NFTMetadata,
} from "@/lib/pinata";

interface FormData {
  name: string;
  description: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface UploadResult {
  metadataCid: string;
  imageCid: string;
  metadata: NFTMetadata;
}

export function NFTCreationForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showImageError, setShowImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
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
      setTimeout(() => setShowImageError(false), 3000);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log("Starting upload process...");

      // Upload image to Pinata
      const imageCid = await uploadImageToPinata(selectedImage);
      console.log("Image uploaded with CID:", imageCid);

      // Create metadata
      const metadata: NFTMetadata = {
        name: data.name,
        description: data.description,
        image: formatIPFSUri(imageCid),
        attributes: data.attributes.filter(
          (attr) => attr.trait_type && attr.value
        ),
      };

      console.log("Created metadata:", metadata);

      // Upload metadata to Pinata
      const metadataCid = await uploadMetadataToPinata(metadata);
      console.log("Metadata uploaded with CID:", metadataCid);

      setUploadResult({
        metadataCid,
        imageCid,
        metadata,
      });
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen  bg-background overflow-x-hidden">
      {/* Header */}
      <div className="border-b overflow-x-hidden border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-background/90">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/home"
            className="inline-flex mb-8 items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Back to Home
          </Link>
          <div className="mx-auto">
            <h1 className="text-3xl font-bold text-foreground">Create NFT</h1>
            <p className="text-muted-foreground mt-2">
              Upload your artwork and create NFT metadata for minting
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm dark:shadow-lg dark:bg-card/50 dark:backdrop-blur-sm">
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="p-6 space-y-8"
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Name *
                      </label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        type="text"
                        placeholder="Enter your NFT name"
                        className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Description Field */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Description *
                      </label>
                      <textarea
                        {...register("description", {
                          required: "Description is required",
                        })}
                        placeholder="Describe your NFT in detail..."
                        rows={4}
                        className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">
                          {errors.description.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Attributes Section */}
                  <div className="space-y-6">
                    <div className="pb-3 border-b border-border">
                      <h2 className="text-xl font-semibold text-foreground">
                        Attributes
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Define your NFT&apos;s traits and properties
                      </p>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="p-4 rounded-lg border border-border bg-muted/30 dark:bg-muted/20"
                        >
                          <div className="flex gap-4 items-start">
                            <div className="flex-1 space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Trait Type
                              </label>
                              <input
                                {...register(`attributes.${index}.trait_type`)}
                                type="text"
                                placeholder="e.g., Color, Rarity, Background"
                                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Value
                              </label>
                              <input
                                {...register(`attributes.${index}.value`)}
                                type="text"
                                placeholder="e.g., Blue, Rare, Ocean"
                                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTrait(index)}
                                className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive h-10 w-10"
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
                  <div className="pt-6 border-t border-border">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 py-3"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                          Creating NFT...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Create NFT
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm dark:shadow-lg dark:bg-card/50 dark:backdrop-blur-sm">
                <div className="p-6 space-y-6">
                  <div className="pb-3 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">
                      Artwork
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload your NFT image
                    </p>
                  </div>

                  {/* File Upload Area */}
                  <div className="space-y-4">
                    {!imagePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/50 ${
                          showImageError
                            ? "border-destructive bg-destructive/5"
                            : "border-border"
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Click to upload image
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
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
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
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
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">
                          Please select a valid image file (PNG, JPG, GIF)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload Tips */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-foreground">
                      Tips for best results:
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-1 bg-muted/30 dark:bg-muted/20 p-3 rounded-lg">
                      <li>• Use high-quality images (at least 500x500px)</li>
                      <li>• Square aspect ratio works best</li>
                      <li>• File size should be under 10MB</li>
                      <li>• PNG format preserves transparency</li>
                    </ul>
                  </div>
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

      {/* Success State */}
      {uploadResult && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg dark:shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      NFT Metadata Created Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your NFT metadata has been uploaded to IPFS
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadResult(null)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-muted/30 dark:bg-muted/20">
                    <h4 className="font-medium text-foreground mb-2">
                      Image CID
                    </h4>
                    <code className="text-xs bg-background dark:bg-background/50 p-2 rounded border block break-all">
                      {uploadResult.imageCid}
                    </code>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30 dark:bg-muted/20">
                    <h4 className="font-medium text-foreground mb-2">
                      Metadata CID
                    </h4>
                    <code className="text-xs bg-background dark:bg-background/50 p-2 rounded border block break-all">
                      {uploadResult.metadataCid}
                    </code>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">
                    Generated Metadata:
                  </h4>
                  <pre className="text-xs bg-background dark:bg-background/50 p-3 rounded border overflow-x-auto text-foreground">
                    {JSON.stringify(uploadResult.metadata, null, 2)}
                  </pre>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Next Steps:</strong> Use
                    the Metadata CID (
                    <code className="bg-muted dark:bg-muted/50 px-1 rounded text-foreground border border-border/50">
                      {uploadResult.metadataCid}
                    </code>
                    ) when minting your NFT on the blockchain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
