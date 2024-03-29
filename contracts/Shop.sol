//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error requireAllowedNFTs(address _nft);
error requireListed(address _nft, uint256 _tokenId);
error requireUnListed(address _nft, uint256 _tokenId);
error requireOwnerOfNFT(address _nft, uint256 _tokenId);
error requireApproved(address _nft, uint256 _tokenId);
error requirePriceGreaterThanZero();
error InsufficientBalance();

/**
 * @title Little test marketplace contract
 * @dev Use proxy pattern to upgrade the contract
 * @author maxper
 */
contract Shop is OwnableUpgradeable, PausableUpgradeable {
    struct Offer {
        address payable owner;
        uint256 price;
    }

    uint256 public royaltiesPercent;                                            // should use 2 decimals, e.g. 5% = 500
    address payable public royaltiesAddress;                                    // address to receive royalties at each sale

    uint16 public constant royaltiesDivisor = 10**2 * 100;                      // power 2 for 2 decimals, 100 for percentage

    mapping(address => bool) public allowedNFTs;                                // allowed NFTs to be sold in this shop
    mapping(address => mapping(uint256 => bool)) public listed;                 // listed NFTs
    mapping(address => mapping(uint256 => Offer)) public offers;                // offers index for each NFT

    modifier onlyAllowedNFTs(address _nft){
        if(!allowedNFTs[_nft]) {
            revert requireAllowedNFTs(_nft);
        }
        _;
    }

    modifier onlyListed(address _nft, uint256 _tokenId){
        if(!listed[_nft][_tokenId]) {
            revert requireListed(_nft, _tokenId);
        }
        _;
    }

    modifier onlyUnListed(address _nft, uint256 _tokenId){
        if(listed[_nft][_tokenId]) {
            revert requireUnListed(_nft, _tokenId);
        }
        _;
    }

    modifier onlyOwnerOfNFT(address _nft, uint256 _tokenId){
        if(IERC721(_nft).ownerOf(_tokenId) != msg.sender) {
            revert requireOwnerOfNFT(_nft, _tokenId);
        }
        _;
    }

    modifier onlyApproved(address _nft, uint256 _tokenId){
        if(!IERC721(_nft).isApprovedForAll(_msgSender(), address(this)) && IERC721(_nft).getApproved(_tokenId) != address(this)) {
            revert requireApproved(_nft, _tokenId);
        }
        _;
    }

    /**
     * @notice Initialize the contract
     * @param _royaltiesPercent Royalties percent to receive at each sale
     * @param _royaltiesAddress Royalties address to receive at each sale
     * @param _nftAddresses Allowed NFTs to be sold in this shop
     * @dev equivalent to constructor but for proxied contracts
     */
    function initialize(uint256 _royaltiesPercent, address _royaltiesAddress, address[] calldata _nftAddresses) public initializer {
        __Ownable_init();
        __Pausable_init();

        royaltiesPercent = _royaltiesPercent;
        royaltiesAddress = payable(_royaltiesAddress);

        for (uint256 i = 0; i < _nftAddresses.length; ++i) {
            allowedNFTs[_nftAddresses[i]] = true;
        }
    }

    /**
     * @notice put an NFT for sale
     * @param _nft NFT address 
     * @param _tokenId NFT token id
     * @dev The NFT is transferred back to the owner
     */
    function sell(address _nft, uint256 _tokenId, uint256 _price) external onlyAllowedNFTs(_nft) onlyUnListed(_nft, _tokenId) 
        onlyOwnerOfNFT(_nft, _tokenId) onlyApproved(_nft, _tokenId) whenNotPaused {
        if(_price == 0) {
            revert requirePriceGreaterThanZero();
        }

        offers[_nft][_tokenId] = Offer(payable(msg.sender), _price);
        listed[_nft][_tokenId] = true;
    }

    /**
     * @notice edit listing price
     * @param _nft NFT address 
     * @param _tokenId NFT token id
     * @param _price new price
     */
    function editPrice(address _nft, uint256 _tokenId, uint256 _price) external onlyListed(_nft, _tokenId) onlyOwnerOfNFT(_nft, _tokenId)
    whenNotPaused {
        if(_price == 0) {
            revert requirePriceGreaterThanZero();
        }

        offers[_nft][_tokenId].price = _price;
    }

    /**
     * @notice Cancelling a listed NFT
     * @param _nft NFT address 
     * @param _tokenId NFT token id
     * @dev The NFT is transferred back to the owner
     */
    function cancelSell(address _nft, uint256 _tokenId) external onlyListed(_nft, _tokenId) onlyOwnerOfNFT(_nft, _tokenId)
    whenNotPaused {
        delete offers[_nft][_tokenId];
        listed[_nft][_tokenId] = false;
    }

    /**
     * @notice Buying a listed NFT
     * @param _nft NFT address 
     * @param _tokenId NFT token id
     * @dev The NFT is transferred to the buyer and the seller receives the price minus the royalties
     */
    function buy(address _nft, uint256 _tokenId) external payable onlyAllowedNFTs(_nft) onlyListed(_nft, _tokenId) whenNotPaused {
        Offer memory offer = offers[_nft][_tokenId];
        if(msg.value < offer.price) {
            revert InsufficientBalance();
        }

        uint256 royalties = royaltiesCalculator(offer.price);
        uint256 ownerAmount = offer.price - royalties;

        delete offers[_nft][_tokenId];
        listed[_nft][_tokenId] = false;

        IERC721(_nft).transferFrom(offer.owner, msg.sender, _tokenId);
        offer.owner.transfer(ownerAmount);
        royaltiesAddress.transfer(royalties);
    }

    /**
     * @notice Formula to calculate royalties
     * @param _amount Amount of the sale
     */
    function royaltiesCalculator(uint256 _amount) view public returns (uint256) {
        return (_amount * royaltiesPercent) / royaltiesDivisor;
    }

     /**
     * @notice Allows the owner to set the royalties percent
     * @param _royaltiesPercent The new royalties percent
     * @dev Can only be called by the owner
     */
    function setRoyaltiesPercent(uint256 _royaltiesPercent) external onlyOwner {
        royaltiesPercent = _royaltiesPercent;
    }

     /**
     * @notice Allows the owner to set the royalties address
     * @param _royaltiesAddress The new royalties address
     * @dev Can only be called by the owner
     */
    function setRoyaltiesAddress(address payable _royaltiesAddress) external onlyOwner {
        royaltiesAddress = _royaltiesAddress;
    }

    /**
     * @notice Allows owner to allow or disallow NFTs to be sold in this shop
     * @param _nftAddresses NFT addresses list
     * @param _allowed true to allow, false to disallow (for all address)
     * @dev Can only be called by the owner
     */
    function setAllowedNFTs(address[] calldata _nftAddresses, bool _allowed) external onlyOwner {
        for (uint256 i = 0; i < _nftAddresses.length; ++i) {
            allowedNFTs[_nftAddresses[i]] = _allowed;
        }
    }

    /**
     * @notice Allows pause of the contract
     * @dev Can only be called by the owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Allows unpause of the contract
     * @dev Can only be called by the owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Allows receiving ETH
     * @dev Called automatically
     */
    receive() external payable {
        royaltiesAddress.transfer(msg.value);                         
    }
    
    /**
     * @notice Allows owners to recover NFT sent to the contract by mistake
     * @param _token: NFT token address
     * @param _tokenId: tokenId
     * @dev Callable by owner
     */
    function recoverNonFungibleToken(address _token, uint256 _tokenId) external onlyOwner onlyUnListed(_token, _tokenId) {
        IERC721(_token).transferFrom(address(this), address(msg.sender), _tokenId);
    }

    /**
     * @notice Allows owners to recover tokens sent to the contract by mistake
     * @param _token: token address
     * @dev Callable by owner
     */
    function recoverToken(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance != 0, "Operations: Cannot recover zero balance");

        IERC20(_token).transferFrom(address(this), address(msg.sender), balance);
    }
}