# 🎨 NFT Marketplace - Complete Web3 Platform

A full-stack NFT marketplace and rental platform built with Next.js, Solidity, and IPFS integration. Users can mint, buy, sell, and rent NFTs with advanced features like royalties, platform fees, and decentralized metadata storage.

![NFT Marketplace](https://img.shields.io/badge/NFT-Marketplace-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black) ![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🌟 Features

### 🎯 Core Functionality
- **🎨 NFT Minting**: Create NFTs with metadata stored on IPFS
- **🛒 Buy/Sell**: Traditional NFT marketplace functionality
- **🏠 NFT Rental**: Unique rental system with time-based access
- **💰 Royalty System**: Creator royalties on secondary sales
- **📊 Platform Fees**: Configurable marketplace fees
- **🌐 IPFS Integration**: Decentralized metadata and image storage

### 🔧 Technical Features
- **⚡ Modern Stack**: Next.js 15 with App Router and React 19
- **🎨 Beautiful UI**: TailwindCSS with custom Sanchez font
- **🌈 3D Graphics**: Three.js and GSAP animations
- **🔗 Web3 Integration**: Thirdweb SDK for blockchain interactions
- **📱 Responsive Design**: Mobile-first with bottom navigation
- **🌙 Dark Mode**: Theme switching support
- **🔒 Secure**: OpenZeppelin contracts for security

## 🏗️ Project Structure

```
nft-marketplace/
├── marketplace-contracts/          # Smart contracts
│   ├── contracts/
│   │   └── MyContract.sol         # NFT Marketplace contract
│   ├── hardhat.config.js          # Hardhat configuration
│   └── scripts/
│       └── verify/
│           └── my-contract.js     # Contract verification
│
└── nft-website/                   # Frontend application
    ├── src/
    │   ├── app/                   # Next.js App Router
    │   │   ├── create/            # NFT creation page
    │   │   ├── home/              # Main app pages
    │   │   │   ├── buy/           # Buy NFTs
    │   │   │   ├── rent/          # Rent NFTs
    │   │   │   ├── wallet/        # User wallet
    │   │   │   └── create/        # Mint NFTs
    │   │   ├── layout.tsx         # Root layout
    │   │   └── page.tsx           # Landing page
    │   ├── components/            # Reusable components
    │   │   ├── ui/                # UI components
    │   │   ├── infinite-hero.tsx  # 3D hero section
    │   │   └── bottomNavBar.tsx   # Navigation
    │   ├── lib/
    │   │   └── pinata.ts          # IPFS utilities
    │   └── constants.ts           # Contract addresses
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Wallet (MetaMask recommended)
- Pinata account for IPFS

### 1. Clone Repository
```bash
git clone https://github.com/Vishal-770/nft-marketplace.git
cd nft-marketplace
```

### 2. Setup Smart Contracts
```bash
cd marketplace-contracts
npm install

# Deploy contract (using Thirdweb)
npm run deploy
```

### 3. Setup Frontend
```bash
cd ../nft-website
npm install

# Create environment file
cp .env.local.example .env.local
```

### 4. Configure Environment Variables
```bash
# nft-website/.env.local
NEXT_PUBLIC_THIRD_WEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_THIRD_WEB_KEY=your_thirdweb_secret_key
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud
```

### 5. Update Contract Address
```typescript
// src/constants.ts
export const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

### 6. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📱 Application Features

### 🎨 NFT Creation (`/create`)
- **Image Upload**: Drag-and-drop file upload with preview
- **Metadata Form**: Name, description, and attributes
- **IPFS Storage**: Automatic upload to Pinata
- **Dynamic Traits**: Add up to 5 custom attributes
- **Real-time Validation**: Form validation with error handling

### 🏠 Main App (`/home`)
- **Buy Page**: Browse and purchase NFTs
- **Rent Page**: Rent NFTs for specified durations
- **Create Page**: Mint new NFTs on blockchain
- **Wallet Page**: View owned and rented NFTs

### 🎭 UI/UX Features
- **3D Hero Section**: WebGL shaders and animations
- **Dark/Light Mode**: System-aware theming
- **Mobile Navigation**: Bottom tab bar for mobile users
- **Loading States**: Smooth loading indicators
- **Toast Notifications**: Success/error feedback

## 🔗 Smart Contract Details

### Contract: `NFTMarketplace`
**Address**: `0xf8947e481D2477349d157700b971d490766ce5B7`  
**Network**: Sepolia Testnet  
**Standard**: ERC721 + ERC2981 (Royalties)

### Key Functions

#### Minting
```solidity
function mintNFT(string memory _hash, uint256 royaltyPercent) external
```
- Creates new NFT with IPFS metadata hash
- Sets creator royalties (max 10%)

#### Marketplace Operations
```solidity
function listNFTForSale(uint256 tokenId, uint256 priceInWei) external
function listNFTForRent(uint256 tokenId, uint256 pricePerDayInWei, uint256 minDurationInHours, uint256 maxDurationInHours) external
function buyNFT(uint256 tokenId) external payable
function rentNFT(uint256 tokenId, uint256 durationInHours) external payable
```

#### Rental System
- **Ownership Retention**: Original owner keeps NFT during rental
- **Time-based Access**: Renter gets access for specified duration
- **Automatic Expiry**: Rental ends automatically
- **Transfer Protection**: Prevents transfers during rental period

### Fee Structure
- **Platform Fee**: 2.5% (configurable by owner)
- **Creator Royalties**: 0-10% (set by creator)
- **Gas Optimization**: Efficient batch operations

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript 5.0
- **Styling**: TailwindCSS 4.0
- **UI Components**: Radix UI primitives
- **3D Graphics**: Three.js + React Three Fiber
- **Animations**: GSAP with SplitText
- **Forms**: React Hook Form
- **Web3**: Thirdweb SDK 5.106.0
- **IPFS**: Pinata SDK 2.5.0

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Standards**: ERC721, ERC2981, Ownable
- **Security**: OpenZeppelin contracts
- **Deployment**: Thirdweb deployment tools
- **Network**: zkSync Sepolia Testnet

### Development Tools
- **Package Manager**: npm/pnpm
- **Linting**: ESLint
- **Bundler**: Turbopack (Next.js)
- **Version Control**: Git

## 🔐 Security Features

### Smart Contract Security
- **OpenZeppelin**: Battle-tested contract implementations
- **Reentrancy Protection**: Built-in guards
- **Access Control**: Owner-only administrative functions
- **Transfer Locks**: Prevents transfers during rental
- **Overflow Protection**: SafeMath equivalent in Solidity 0.8+

### Frontend Security
- **Environment Variables**: Secure API key management
- **Input Validation**: Client and server-side validation
- **File Type Validation**: Image upload restrictions
- **Size Limits**: 10MB max file size for uploads

## 📊 Business Model

### Revenue Streams
1. **Platform Fees**: 2.5% on all sales and rentals
2. **Premium Features**: Enhanced listing options
3. **Creator Tools**: Advanced analytics and promotion

### Fee Distribution
```
Sale Price: 100 ETH
├── Creator Royalty: 5 ETH (5%)
├── Platform Fee: 2.5 ETH (2.5%)
└── Seller Receives: 92.5 ETH (92.5%)
```

## 🎯 Roadmap

### Phase 1: ✅ Core Platform
- [x] Smart contract development
- [x] Basic marketplace functionality
- [x] NFT rental system
- [x] IPFS integration
- [x] Frontend development

### Phase 2: 🔄 In Progress
- [ ] Advanced search and filtering
- [ ] Collection management
- [ ] Bulk operations
- [ ] Analytics dashboard
- [ ] Mobile app

### Phase 3: 📋 Planned
- [ ] Cross-chain support
- [ ] DAO governance
- [ ] Creator verification
- [ ] Advanced rental features
- [ ] Marketplace API

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork the repository
git clone https://github.com/YOUR_USERNAME/nft-marketplace.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git commit -m "Add amazing feature"

# Push to branch
git push origin feature/amazing-feature

# Open a Pull Request
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

### Documentation
- **Smart Contracts**: [Contract Documentation](./marketplace-contracts/README.md)
- **Frontend**: [Frontend Documentation](./nft-website/README.md)
- **API Reference**: [API Documentation](./docs/API.md)

### Community
- **Discord**: [Join our community](https://discord.gg/nft-marketplace)
- **Twitter**: [@NFTMarketplace](https://twitter.com/nftmarketplace)
- **Telegram**: [NFT Marketplace Chat](https://t.me/nftmarketplace)

### Issues
Found a bug? Have a feature request? Please [create an issue](https://github.com/Vishal-770/nft-marketplace/issues).

---

## 🏆 Acknowledgments

- **OpenZeppelin**: For secure smart contract templates
- **Thirdweb**: For Web3 development tools
- **Pinata**: For IPFS infrastructure
- **Vercel**: For deployment platform
- **Next.js Team**: For the amazing framework

---

**Made with ❤️ by [Vishal](https://github.com/Vishal-770)**

*Building the future of digital asset ownership and accessibility.*