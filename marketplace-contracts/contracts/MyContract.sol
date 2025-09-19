// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract NFTMarketplace is ERC721, IERC2981, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    address public marketplaceOwner;
    // platformFeePercent is in tenths of percent (25 => 2.5%)
    uint256 public platformFeePercent = 25;

    enum NFTStatus { Owned, ForSale, ForRent, Rented }

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 priceInEther; // stored in wei (price or pricePerDay)
        bool forRent;
        uint256 minRentDuration;
        uint256 maxRentDuration;
        uint256 rentEnd;
        address renter;
        bool active;
        string tokenURI;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public tokenRoyalty; // basis points (10000 = 100%)
    mapping(uint256 => address) public creators;     // original minter / royalty receiver
    mapping(address => uint256) public pendingWithdrawals;
    mapping(uint256 => NFTStatus) public nftStatus;

    constructor() ERC721("SimpleNFT", "SNFT") {
        marketplaceOwner = msg.sender;
    }

    // ================== MINT ==================
    function mintNFT(string memory _hash, uint256 royaltyPercent) external {
        require(royaltyPercent <= 1000, "Max 10%");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _mint(msg.sender, tokenId);

        creators[tokenId] = msg.sender;
        tokenRoyalty[tokenId] = royaltyPercent;
        nftStatus[tokenId] = NFTStatus.Owned;

        listings[tokenId] = Listing(
            tokenId,
            msg.sender,
            0,
            false,
            0,
            0,
            0,
            address(0),
            false,
            _hash
        );
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return listings[tokenId].tokenURI;
    }

    function getTotalMinted() external view returns (uint256) {
        return _tokenIds.current();
    }

    // ================== ROYALTY ==================
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address, uint256)
    {
        uint256 royaltyAmount = (salePrice * tokenRoyalty[tokenId]) / 10000;
        address receiver = creators[tokenId] == address(0) ? ownerOf(tokenId) : creators[tokenId];
        return (receiver, royaltyAmount);
    }

    // ================== LISTING ==================
    function listNFTForSale(uint256 tokenId, uint256 priceInWei) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(nftStatus[tokenId] == NFTStatus.Owned, "NFT busy");

        listings[tokenId].priceInEther = priceInWei;
        listings[tokenId].forRent = false;
        listings[tokenId].active = true;
        listings[tokenId].seller = msg.sender;
        nftStatus[tokenId] = NFTStatus.ForSale;
    }

    function listNFTForRent(
        uint256 tokenId,
        uint256 pricePerDayInWei,
        uint256 minDurationInHours,
        uint256 maxDurationInHours
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(nftStatus[tokenId] == NFTStatus.Owned, "NFT busy");
        require(minDurationInHours > 0 && maxDurationInHours >= minDurationInHours, "Invalid duration");

        listings[tokenId].priceInEther = pricePerDayInWei;
        listings[tokenId].forRent = true;
        listings[tokenId].minRentDuration = minDurationInHours;
        listings[tokenId].maxRentDuration = maxDurationInHours;
        listings[tokenId].active = true;
        listings[tokenId].seller = msg.sender;
        nftStatus[tokenId] = NFTStatus.ForRent;
    }

    // ================== BUY ==================
    function buyNFT(uint256 tokenId) external payable {
        Listing storage l = listings[tokenId];
        require(l.active && !l.forRent, "NFT not for sale");
        require(msg.sender != l.seller, "Cannot buy own NFT");
        require(msg.value >= l.priceInEther, "Insufficient ETH");

        // Prevent buying while rented (shouldn't be possible as forRent==false, but defensive)
        require(nftStatus[tokenId] != NFTStatus.Rented, "Currently rented");

        uint256 price = l.priceInEther;
        uint256 royalty = (price * tokenRoyalty[tokenId]) / 10000;
        uint256 fee = (price * platformFeePercent) / 1000;

        uint256 sellerAmount = price >= royalty + fee ? price - royalty - fee : 0;

        pendingWithdrawals[l.seller] += sellerAmount;

        address royaltyReceiver = creators[tokenId] == address(0) ? l.seller : creators[tokenId];
        if (royalty > 0) {
            pendingWithdrawals[royaltyReceiver] += royalty;
        }

        if (fee > 0) {
            pendingWithdrawals[marketplaceOwner] += fee;
        }

        // Transfer NFT ownership to buyer
        _transfer(l.seller, msg.sender, tokenId);

        // deactivate listing & update state
        l.active = false;
        l.forRent = false;
        l.renter = address(0);
        l.rentEnd = 0;
        l.seller = msg.sender;
        nftStatus[tokenId] = NFTStatus.Owned;

        // refund extra
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }

    // ================== RENT ==================
    /**
     * NOTE: Renting DOES NOT transfer token ownership. The token stays owned by 'seller'.
     * The contract records 'renter' and 'rentEnd' so the frontend / off-chain code can
     * give the renter access. This prevents the owner from accidentally losing the token
     * and avoids the "owner changed" bug you reported.
     */
    function rentNFT(uint256 tokenId, uint256 durationInHours) external payable {
        Listing storage l = listings[tokenId];
        require(l.active && l.forRent, "NFT not for rent");
        require(msg.sender != l.seller, "Owner cannot rent");
        require(durationInHours >= l.minRentDuration && durationInHours <= l.maxRentDuration, "Invalid duration");
        require(nftStatus[tokenId] == NFTStatus.ForRent, "NFT not available for rent");

        uint256 totalPrice = (l.priceInEther * durationInHours) / 24;
        require(msg.value >= totalPrice, "Insufficient ETH");

        uint256 royalty = (totalPrice * tokenRoyalty[tokenId]) / 10000;
        uint256 fee = (totalPrice * platformFeePercent) / 1000;
        uint256 sellerAmount = totalPrice >= royalty + fee ? totalPrice - royalty - fee : 0;

        // record money
        pendingWithdrawals[l.seller] += sellerAmount;

        address royaltyReceiver = creators[tokenId] == address(0) ? l.seller : creators[tokenId];
        if (royalty > 0) {
            pendingWithdrawals[royaltyReceiver] += royalty;
        }

        if (fee > 0) {
            pendingWithdrawals[marketplaceOwner] += fee;
        }

        // IMPORTANT: DO NOT transfer token ownership to renter.
        // Instead set renter and rentEnd so off-chain systems know renter has access.
        l.renter = msg.sender;
        l.rentEnd = block.timestamp + (durationInHours * 1 hours);

        // mark listing inactive while rented so it won't appear in lists
        l.active = false;
        nftStatus[tokenId] = NFTStatus.Rented;

        // refund excess
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }

    /**
     * End rental — anyone can call after rental period
     * This function simply clears the renter and returns status to Owned.
     * No transfers are made because ownership was never changed on rent.
     */
    function endRental(uint256 tokenId) external {
        Listing storage l = listings[tokenId];
        require(l.renter != address(0), "Not rented");
        require(block.timestamp >= l.rentEnd, "Rental ongoing");

        // clear rental info
        l.renter = address(0);
        l.rentEnd = 0;

        // do not auto-relist — owner should relist if desired
        l.active = false;
        l.forRent = false;
        nftStatus[tokenId] = NFTStatus.Owned;
    }

    // ================== WITHDRAW ==================
    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function setPlatformFee(uint256 feePercent) external onlyOwner {
        require(feePercent <= 100, "Max 10%");
        platformFeePercent = feePercent;
    }

    function setMarketplaceOwner(address newOwner) external onlyOwner {
        marketplaceOwner = newOwner;
    }

    // ================== HELPERS ==================
    function getNFT(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    function getNFTsOwned(address user) external view returns (uint256[] memory) {
        uint256 total = _tokenIds.current();
        uint256 count = balanceOf(user);
        uint256[] memory result = new uint256[](count);
        uint256 j = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (_exists(i) && ownerOf(i) == user) {
                result[j] = i;
                j++;
            }
        }
        return result;
    }

    function getNFTsListedForSale() external view returns (Listing[] memory) {
        uint256 total = _tokenIds.current();
        uint256 count;
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].active && !listings[i].forRent) count++;
        }
        Listing[] memory result = new Listing[](count);
        uint256 j = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].active && !listings[i].forRent) {
                result[j] = listings[i];
                j++;
            }
        }
        return result;
    }

    function getNFTsListedForRent() external view returns (Listing[] memory) {
        uint256 total = _tokenIds.current();
        uint256 count;
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].active && listings[i].forRent) count++;
        }
        Listing[] memory result = new Listing[](count);
        uint256 j = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].active && listings[i].forRent) {
                result[j] = listings[i];
                j++;
            }
        }
        return result;
    }

    function getNFTsRentedByUser(address user) external view returns (Listing[] memory) {
        uint256 total = _tokenIds.current();
        uint256 count;
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].renter == user) count++;
        }
        Listing[] memory result = new Listing[](count);
        uint256 j = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].renter == user) {
                result[j] = listings[i];
                j++;
            }
        }
        return result;
    }

    function getNFTRentInfo(uint256 tokenId) external view returns (address renter, uint256 rentEnd) {
        Listing storage l = listings[tokenId];
        renter = l.renter;
        rentEnd = l.rentEnd;
    }

    function getAllNFTs() external view returns (Listing[] memory) {
        uint256 total = _tokenIds.current();
        Listing[] memory result = new Listing[](total);
        for (uint256 i = 1; i <= total; i++) {
            result[i - 1] = listings[i];
        }
        return result;
    }

    // ================== INTERFACE OVERRIDES & TRANSFER HOOK ==================
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * Prevent transfers while token is rented.
     * Also clear listing.active and forRent on transfers (owner changed).
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // If token is rented, disallow transfers (owner retains ownership during rent)
        if (nftStatus[tokenId] == NFTStatus.Rented) {
            // allow mint (from == address(0)) and burn (to == address(0)), but not transfers between accounts
            require(from == address(0) || to == address(0), "Token is rented");
        }

        // Only for normal transfers (not mint/burn) clear listing state and update seller
        if (from != address(0) && to != address(0)) {
            listings[tokenId].active = false;
            listings[tokenId].forRent = false;
            listings[tokenId].renter = address(0);
            listings[tokenId].rentEnd = 0;

            listings[tokenId].seller = to;
            nftStatus[tokenId] = NFTStatus.Owned;
        }
    }
}
