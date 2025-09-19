# 📚 API Documentation

## Overview

The NFT Marketplace provides comprehensive APIs for interacting with the platform's smart contracts and frontend services. This documentation covers contract interfaces, Web3 integration, and IPFS operations.

## 📋 Table of Contents

- [Smart Contract APIs](#smart-contract-apis)
- [Frontend APIs](#frontend-apis)
- [IPFS Integration](#ipfs-integration)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## 🔗 Smart Contract APIs

### Contract Address
- **Network**: zkSync Sepolia Testnet
- **Contract**: MyContract.sol (NFT Marketplace)
- **Standards**: ERC721, ERC2981, Ownable

### Core Functions

#### **NFT Minting**

```solidity
/**
 * @dev Mint a new NFT with metadata
 * @param to Address to mint the NFT to
 * @param tokenURI IPFS URI for NFT metadata
 * @param royaltyPercentage Royalty percentage for creator (in basis points)
 */
function mintNFT(
    address to,
    string memory tokenURI,
    uint256 royaltyPercentage
) external returns (uint256 tokenId)
```

**Parameters:**
- `to`: Recipient address
- `tokenURI`: IPFS metadata URI (e.g., `ipfs://QmHash...`)
- `royaltyPercentage`: 0-10000 (0% to 100%, in basis points)

**Returns:**
- `tokenId`: Unique identifier for the minted NFT

**Events:**
```solidity
event NFTMinted(uint256 indexed tokenId, address indexed to, string tokenURI);
```

#### **Marketplace Operations**

```solidity
/**
 * @dev List NFT for sale
 * @param tokenId ID of the NFT to list
 * @param price Sale price in wei
 */
function listForSale(uint256 tokenId, uint256 price) external

/**
 * @dev Purchase listed NFT
 * @param tokenId ID of the NFT to purchase
 */
function purchaseNFT(uint256 tokenId) external payable

/**
 * @dev List NFT for rent
 * @param tokenId ID of the NFT to list
 * @param dailyRate Daily rental rate in wei
 * @param maxRentalDays Maximum rental period
 */
function listForRent(
    uint256 tokenId,
    uint256 dailyRate,
    uint256 maxRentalDays
) external
```

#### **Rental System**

```solidity
/**
 * @dev Rent an NFT for specified duration
 * @param tokenId ID of the NFT to rent
 * @param rentalDays Number of days to rent
 */
function rentNFT(uint256 tokenId, uint256 rentalDays) external payable

/**
 * @dev Check if NFT is currently rented
 * @param tokenId ID of the NFT to check
 * @return isRented Current rental status
 * @return renter Address of current renter (if any)
 * @return expiryTime Rental expiry timestamp
 */
function getRentalInfo(uint256 tokenId) 
    external view returns (bool isRented, address renter, uint256 expiryTime)
```

#### **Platform Administration**

```solidity
/**
 * @dev Set platform fee percentage (owner only)
 * @param feePercentage Fee percentage in basis points
 */
function setPlatformFee(uint256 feePercentage) external onlyOwner

/**
 * @dev Withdraw platform fees (owner only)
 */
function withdrawFees() external onlyOwner
```

### Events

```solidity
// NFT Events
event NFTMinted(uint256 indexed tokenId, address indexed to, string tokenURI);
event NFTListed(uint256 indexed tokenId, uint256 price, address indexed seller);
event NFTSold(uint256 indexed tokenId, uint256 price, address indexed buyer, address indexed seller);

// Rental Events
event NFTListedForRent(uint256 indexed tokenId, uint256 dailyRate, uint256 maxDays);
event NFTRented(uint256 indexed tokenId, address indexed renter, uint256 rentalDays, uint256 totalCost);
event RentalExpired(uint256 indexed tokenId, address indexed renter);

// Admin Events
event PlatformFeeUpdated(uint256 newFeePercentage);
event FeesWithdrawn(uint256 amount, address indexed to);
```

---

## 🖥️ Frontend APIs

### Thirdweb Integration

#### **Contract Connection**

```typescript
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";

const contract = getContract({
  client,
  chain: sepolia,
  address: "CONTRACT_ADDRESS"
});
```

#### **Wallet Connection**

```typescript
import { ConnectButton } from "thirdweb/react";

// Connect wallet component
<ConnectButton
  client={client}
  wallets={[
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow")
  ]}
/>
```

#### **Reading Contract Data**

```typescript
import { readContract } from "thirdweb";

// Get NFT metadata
const tokenURI = await readContract({
  contract,
  method: "tokenURI",
  params: [tokenId]
});

// Check rental status
const rentalInfo = await readContract({
  contract,
  method: "getRentalInfo",
  params: [tokenId]
});
```

#### **Writing to Contract**

```typescript
import { sendTransaction } from "thirdweb";

// Mint NFT
const transaction = await sendTransaction({
  account,
  transaction: {
    to: contract.address,
    data: encodeFunctionData({
      abi: contract.abi,
      functionName: "mintNFT",
      args: [to, tokenURI, royaltyPercentage]
    })
  }
});
```

### React Hooks

#### **useReadContract**

```typescript
import { useReadContract } from "thirdweb/react";

function NFTInfo({ tokenId }: { tokenId: number }) {
  const { data: tokenURI, isLoading } = useReadContract({
    contract,
    method: "tokenURI",
    params: [tokenId]
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>Token URI: {tokenURI}</div>;
}
```

#### **useSendTransaction**

```typescript
import { useSendTransaction } from "thirdweb/react";

function MintNFT() {
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const handleMint = () => {
    sendTransaction({
      transaction: {
        to: contract.address,
        data: encodeFunctionData({
          abi: contract.abi,
          functionName: "mintNFT",
          args: [to, tokenURI, royaltyPercentage]
        })
      }
    });
  };

  return (
    <button onClick={handleMint} disabled={isPending}>
      {isPending ? "Minting..." : "Mint NFT"}
    </button>
  );
}
```

---

## 📁 IPFS Integration

### Pinata Configuration

```typescript
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY_URL
});
```

### File Upload

```typescript
/**
 * Upload file to IPFS via Pinata
 */
async function uploadToIPFS(file: File): Promise<string> {
  try {
    const upload = await pinata.upload.file(file);
    return `ipfs://${upload.IpfsHash}`;
  } catch (error) {
    console.error("IPFS upload failed:", error);
    throw new Error("Failed to upload to IPFS");
  }
}
```

### Metadata Upload

```typescript
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Upload NFT metadata to IPFS
 */
async function uploadMetadata(metadata: NFTMetadata): Promise<string> {
  try {
    const upload = await pinata.upload.json(metadata);
    return `ipfs://${upload.IpfsHash}`;
  } catch (error) {
    console.error("Metadata upload failed:", error);
    throw new Error("Failed to upload metadata");
  }
}
```

### File Retrieval

```typescript
/**
 * Retrieve file from IPFS
 */
async function getFromIPFS(ipfsHash: string): Promise<any> {
  try {
    const response = await fetch(
      `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${ipfsHash}`
    );
    return await response.json();
  } catch (error) {
    console.error("IPFS retrieval failed:", error);
    throw new Error("Failed to retrieve from IPFS");
  }
}
```

---

## 🔐 Authentication

### Wallet Authentication

```typescript
import { useActiveAccount } from "thirdweb/react";

function useAuth() {
  const account = useActiveAccount();
  
  return {
    isConnected: !!account,
    address: account?.address,
    disconnect: () => {
      // Implement disconnect logic
    }
  };
}
```

### Transaction Signing

```typescript
import { signMessage } from "thirdweb/wallets";

async function signAuthMessage(account: Account): Promise<string> {
  const message = `Sign this message to authenticate with NFT Marketplace at ${Date.now()}`;
  
  const signature = await signMessage({
    account,
    message
  });
  
  return signature;
}
```

---

## 🚨 Error Handling

### Contract Errors

```typescript
enum ContractError {
  INSUFFICIENT_FUNDS = "InsufficientFunds",
  NOT_OWNER = "NotOwner",
  NFT_NOT_FOUND = "NFTNotFound",
  ALREADY_LISTED = "AlreadyListed",
  NOT_FOR_SALE = "NotForSale",
  RENTAL_ACTIVE = "RentalActive"
}

function handleContractError(error: any): string {
  if (error.message.includes("InsufficientFunds")) {
    return "Insufficient funds for this transaction";
  }
  if (error.message.includes("NotOwner")) {
    return "You don't own this NFT";
  }
  return "Transaction failed. Please try again.";
}
```

### IPFS Errors

```typescript
function handleIPFSError(error: any): string {
  if (error.message.includes("Network Error")) {
    return "Network connection issue. Please check your internet.";
  }
  if (error.message.includes("File too large")) {
    return "File size exceeds 10MB limit.";
  }
  return "Upload failed. Please try again.";
}
```

---

## ⏱️ Rate Limiting

### IPFS Rate Limits

- **Pinata Free Tier**: 1000 requests/month
- **File Size Limit**: 10MB per file
- **Concurrent Uploads**: 5 simultaneous uploads

### Blockchain Rate Limits

- **Transaction Speed**: ~2-3 seconds per transaction
- **Gas Limits**: Set appropriate gas limits for complex operations
- **Nonce Management**: Handle sequential transactions properly

---

## 💡 Examples

### Complete NFT Minting Flow

```typescript
import { useState } from "react";
import { uploadToIPFS, uploadMetadata } from "./ipfs";
import { useSendTransaction } from "thirdweb/react";

function MintNFTFlow() {
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: sendTransaction } = useSendTransaction();

  const handleMint = async (
    file: File,
    name: string,
    description: string,
    royalty: number
  ) => {
    try {
      setIsLoading(true);

      // 1. Upload image to IPFS
      const imageURI = await uploadToIPFS(file);

      // 2. Create and upload metadata
      const metadata = {
        name,
        description,
        image: imageURI,
        attributes: []
      };
      const metadataURI = await uploadMetadata(metadata);

      // 3. Mint NFT with metadata
      sendTransaction({
        transaction: {
          to: contract.address,
          data: encodeFunctionData({
            abi: contract.abi,
            functionName: "mintNFT",
            args: [account.address, metadataURI, royalty * 100] // Convert to basis points
          })
        }
      });

    } catch (error) {
      console.error("Minting failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Your minting UI here */}
    </div>
  );
}
```

### NFT Marketplace Listing

```typescript
function ListNFT({ tokenId }: { tokenId: number }) {
  const [price, setPrice] = useState("");
  const { mutate: sendTransaction } = useSendTransaction();

  const handleList = () => {
    const priceInWei = parseEther(price);
    
    sendTransaction({
      transaction: {
        to: contract.address,
        data: encodeFunctionData({
          abi: contract.abi,
          functionName: "listForSale",
          args: [tokenId, priceInWei]
        })
      }
    });
  };

  return (
    <div>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price in ETH"
      />
      <button onClick={handleList}>List for Sale</button>
    </div>
  );
}
```

---

## 📞 Support

### Documentation Resources

- [Smart Contract Documentation](../marketplace-contracts/README.md)
- [Frontend Documentation](../nft-website/README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

### Community Support

- **Discord**: [Join our community](https://discord.gg/nft-marketplace)
- **GitHub Issues**: [Report bugs or request features](https://github.com/Vishal-770/nft-marketplace/issues)
- **Twitter**: [@NFTMarketplace](https://twitter.com/nftmarketplace)

### Technical Support

For technical questions:
1. Check this documentation first
2. Search existing GitHub issues
3. Join our Discord for real-time help
4. Create a new issue with detailed information

---

*Last updated: December 2024*

**Built with ❤️ by [Vishal](https://github.com/Vishal-770)**