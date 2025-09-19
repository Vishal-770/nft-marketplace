# 🤝 Contributing to NFT Marketplace

Thank you for your interest in contributing to the NFT Marketplace! We welcome all contributions that help improve this Web3 platform.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Community Guidelines](#community-guidelines)

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **pnpm** package manager
- **Git** for version control
- **MetaMask** or compatible Web3 wallet for testing
- Basic knowledge of **React**, **Next.js**, **TypeScript**, and **Solidity**

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/nft-marketplace.git
   cd nft-marketplace
   ```

2. **Install Dependencies**
   ```bash
   # Frontend dependencies
   cd nft-website
   npm install
   
   # Smart contract dependencies
   cd ../marketplace-contracts
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment variables
   cd nft-website
   cp .env.example .env.local
   
   # Add your API keys:
   # - Thirdweb Client ID
   # - Pinata API keys
   # - Other required environment variables
   ```

4. **Start Development Servers**
   ```bash
   # Start frontend development server
   cd nft-website
   npm run dev
   
   # In another terminal, compile smart contracts
   cd marketplace-contracts
   npm run build
   ```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome the following types of contributions:

- 🐛 **Bug fixes** - Fix issues and improve stability
- ✨ **New features** - Add functionality to enhance the platform
- 📚 **Documentation** - Improve or add documentation
- 🎨 **UI/UX improvements** - Enhance user interface and experience
- 🔒 **Security improvements** - Strengthen platform security
- ⚡ **Performance optimizations** - Improve speed and efficiency
- 🧪 **Tests** - Add or improve test coverage

### Before You Start

1. **Check existing issues** - Look for related issues or discussions
2. **Create an issue** - For significant changes, create an issue first to discuss
3. **Assign yourself** - Comment on the issue to avoid duplicate work
4. **Review our roadmap** - Ensure your contribution aligns with project goals

## 🏗️ Code Standards

### Frontend (Next.js/TypeScript)

- **ESLint Configuration**: Follow the existing ESLint rules
- **TypeScript**: Use strict typing, avoid `any` types when possible
- **Component Structure**: Use functional components with hooks
- **Styling**: Use TailwindCSS classes, follow existing patterns
- **File Naming**: Use kebab-case for files, PascalCase for components

```typescript
// Example component structure
interface ComponentProps {
  title: string;
  isVisible?: boolean;
}

export function ComponentName({ title, isVisible = false }: ComponentProps) {
  // Component logic here
  return (
    <div className="flex items-center justify-center">
      {isVisible && <h1 className="text-2xl font-bold">{title}</h1>}
    </div>
  );
}
```

### Smart Contracts (Solidity)

- **Solidity Version**: Use Solidity 0.8.20 or compatible
- **OpenZeppelin**: Prefer OpenZeppelin contracts for standard functionality
- **Security**: Include proper access controls and input validation
- **Documentation**: Use NatSpec comments for all public functions
- **Testing**: Include comprehensive test coverage

```solidity
// Example contract structure
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Example NFT Contract
 * @dev Implementation of NFT marketplace functionality
 */
contract ExampleNFT is ERC721, Ownable {
    // Contract implementation
}
```

### Git Commit Guidelines

Use conventional commit messages:

```
type(scope): description

Examples:
feat(frontend): add NFT rental functionality
fix(contracts): resolve reentrancy vulnerability
docs(readme): update installation instructions
style(ui): improve responsive design for mobile
test(contracts): add marketplace contract tests
```

## 🔄 Pull Request Process

### Creating a Pull Request

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make Your Changes**
   - Follow the code standards above
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Frontend tests
   cd nft-website
   npm run lint
   npm run build
   
   # Contract tests
   cd marketplace-contracts
   npm run build
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat(scope): descriptive commit message"
   git push origin feature/your-feature-name
   ```

5. **Open Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Fill out the PR template completely

### PR Review Process

- **Automated Checks**: All PRs must pass automated checks
- **Code Review**: At least one maintainer review required
- **Testing**: Verify functionality in development environment
- **Documentation**: Ensure documentation is updated
- **Approval**: Maintainer approval required before merge

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Environment**: OS, browser, Node.js version
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** or error messages
- **Console logs** if applicable

### Feature Requests

For feature requests, please provide:

- **Use case**: Why is this feature needed?
- **Description**: What should the feature do?
- **Mockups**: Visual representation if applicable
- **Implementation ideas**: Any technical suggestions

## 👥 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers get started
- Focus on what's best for the community
- Show empathy towards other contributors

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: [Join our community](https://discord.gg/nft-marketplace)
- **Twitter**: [@NFTMarketplace](https://twitter.com/nftmarketplace)

## 🏆 Recognition

Contributors will be recognized in:

- Repository contributors list
- Release notes for significant contributions
- Special mentions in project updates
- Community hall of fame

## 📚 Additional Resources

### Documentation

- [Smart Contract Documentation](./marketplace-contracts/README.md)
- [Frontend Documentation](./nft-website/README.md)
- [API Reference](./docs/API.md)

### Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Thirdweb SDK](https://portal.thirdweb.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)

---

**Thank you for contributing to the future of decentralized digital asset ownership! 🎨✨**

*For questions or support, reach out to our community on [Discord](https://discord.gg/nft-marketplace) or create an issue.*