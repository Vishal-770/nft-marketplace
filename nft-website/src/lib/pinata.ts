import { PinataSDK } from "pinata";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// Initialize Pinata SDK for frontend use
const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
  pinataGateway:
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud",
});

/**
 * Upload an image file to Pinata IPFS
 * @param file - The image file to upload
 * @returns Promise with the IPFS CID
 */
export async function uploadImageToPinata(file: File): Promise<string> {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("Please upload a valid image file");
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB");
    }

    console.log("Uploading image to Pinata...", {
      name: file.name,
      size: file.size,
    });

    // Upload using PinataSDK v2 - correct API
    const upload = await pinata.upload.public.file(file);

    console.log("Image uploaded successfully:", upload.cid);
    return upload.cid;
  } catch (error) {
    console.error("Error uploading image to Pinata:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload image"
    );
  }
}

/**
 * Upload metadata JSON to Pinata IPFS
 * @param metadata - The NFT metadata object
 * @returns Promise with the IPFS CID
 */
export async function uploadMetadataToPinata(
  metadata: NFTMetadata
): Promise<string> {
  try {
    if (!metadata) {
      throw new Error("No metadata provided");
    }

    // Validate required fields
    if (!metadata.name || !metadata.description || !metadata.image) {
      throw new Error("Name, description, and image are required");
    }

    console.log("Uploading metadata to Pinata...", metadata);

    // Create a JSON file from metadata
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const jsonFile = new File([jsonBlob], `metadata-${Date.now()}.json`, {
      type: "application/json",
    });

    // Upload JSON file using PinataSDK v2
    const upload = await pinata.upload.public.file(jsonFile);

    console.log("Metadata uploaded successfully:", upload.cid);
    return upload.cid;
  } catch (error) {
    console.error("Error uploading metadata to Pinata:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload metadata"
    );
  }
}

/**
 * Get the full IPFS URL for a given CID
 * @param cid - The IPFS CID
 * @returns The full gateway URL
 */
export function getIPFSUrl(cid: string): string {
  const gateway =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
  return `https://${gateway}/ipfs/${cid}`;
}

/**
 * Format CID as ipfs:// URI
 * @param cid - The IPFS CID
 * @returns The ipfs:// URI
 */
export function formatIPFSUri(cid: string): string {
  return `ipfs://${cid}`;
}
